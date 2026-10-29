import type { AvatarLook, AvatarStyle, Format } from "@/lib/studio/types"

// The stage is one canvas — 1920×1080 for YouTube or 1080×1920 for Reels,
// TikTok and Shorts: what the guest sees is exactly what gets recorded.
// The guest fills the frame; AVA lives in a small bubble in the corner and
// her lines appear as a chat bubble, like a conversation.

export const STAGE_W = 1920
export const STAGE_H = 1080

export function stageSize(format: Format): { w: number; h: number } {
  return format === "vertical" ? { w: STAGE_H, h: STAGE_W } : { w: STAGE_W, h: STAGE_H }
}

export type HostMode = "idle" | "speaking" | "listening" | "thinking"

export type StageState = {
  format: Format
  hostMode: HostMode
  hostLevel: number // 0..1, smoothed voice level
  guestLevel: number
  caption: string | null
  showName: string
  themeTitle: string
  hostName: string
  guestName: string
  avatarStyle: AvatarStyle
  look: AvatarLook
  portrait: HTMLImageElement | null
  video: HTMLVideoElement | null
  // The camera after the confidence filter, when it's on.
  cameraFrame: HTMLCanvasElement | null
  fonts: { display: string; body: string; mono: string }
}

// AVA brand.
export const AVA = {
  coral: "#F06A6A",
  crimson: "#E8384F",
  ink: "#1E1F21",
  cream: "#FFF8F5",
  blush: "#FFE5E0",
  online: "#34D399",
}

type Rect = { x: number; y: number; w: number; h: number }

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h, radius)
}

// Darken (amount < 0) or lighten (amount > 0) a #rrggbb colour.
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16)
  const ch = (shift: number) => {
    const c = (n >> shift) & 255
    const v = amount < 0 ? c * (1 + amount) : c + (255 - c) * amount
    return Math.round(Math.max(0, Math.min(255, v)))
  }
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  // Keep the end of long lines: the most recent words matter most on screen.
  const kept = lines.slice(-maxLines)
  kept[0] = `… ${kept[0]}`
  return kept
}

// Cover-crops the camera (filtered when the filter is on) into r. Returns
// false while there's no picture yet.
function drawCamera(ctx: CanvasRenderingContext2D, s: StageState, r: Rect): boolean {
  const v = s.video
  if (!v || v.readyState < 2 || v.videoWidth === 0) return false
  const src: HTMLVideoElement | HTMLCanvasElement = s.cameraFrame ?? v
  const sw = s.cameraFrame ? s.cameraFrame.width : v.videoWidth
  const sh = s.cameraFrame ? s.cameraFrame.height : v.videoHeight
  const scale = Math.max(r.w / sw, r.h / sh)
  const w = sw * scale
  const h = sh * scale
  ctx.drawImage(src, r.x + (r.w - w) / 2, r.y + (r.h - h) / 2, w, h)
  return true
}

function drawThinkingDots(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, t: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(k, k)
  ctx.beginPath()
  ctx.roundRect(-58, -30, 116, 60, 30)
  ctx.fillStyle = "rgba(255,248,245,0.95)"
  ctx.fill()
  for (let i = 0; i < 3; i++) {
    const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 5 - i * 0.7))
    ctx.beginPath()
    ctx.arc(-30 + i * 30, 0, 9, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(232,56,79,${a})`
    ctx.fill()
  }
  ctx.restore()
}

// ---- AVA, the orb ---------------------------------------------------------------

// AVA's mark (three dots, from the brand) on a coral → crimson orb whose edge
// ripples with her voice. Listening, it breathes; thinking, the dots pulse.
export function drawOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, mode: HostMode, level: number, t: number) {
  const speak = mode === "speaking" ? Math.min(1, 0.25 + level * 1.6) : 0
  const breathe = mode === "listening" || mode === "idle" ? Math.sin(t * 1.8) * 0.02 : 0
  const R = r * (1 + breathe + speak * 0.05)

  // Glow.
  const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * (1.9 + speak * 0.5))
  glow.addColorStop(0, `rgba(240,106,106,${0.38 + speak * 0.3})`)
  glow.addColorStop(1, "rgba(240,106,106,0)")
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, cy, R * (1.9 + speak * 0.5), 0, Math.PI * 2)
  ctx.fill()

  // Voice ripples.
  for (let i = 0; i < 2; i++) {
    const p = (t * 0.9 + i * 0.5) % 1
    if (speak <= 0) break
    ctx.beginPath()
    ctx.arc(cx, cy, R * (1.05 + p * 0.45), 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(240,106,106,${(1 - p) * 0.55 * speak})`
    ctx.lineWidth = r * 0.04
    ctx.stroke()
  }

  // The orb, its edge wobbling with the voice.
  ctx.save()
  ctx.beginPath()
  const steps = 72
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const wob = 1 + speak * (0.028 * Math.sin(a * 5 + t * 6) + 0.016 * Math.sin(a * 3 - t * 4))
    const x = cx + Math.cos(a) * R * wob
    const y = cy + Math.sin(a) * R * wob
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  const fill = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
  fill.addColorStop(0, AVA.coral)
  fill.addColorStop(1, AVA.crimson)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.clip()
  const hi = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, 0, cx - R * 0.35, cy - R * 0.45, R * 1.1)
  hi.addColorStop(0, "rgba(255,255,255,0.35)")
  hi.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = hi
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
  ctx.restore()

  // The three-dot mark (21 × 19 viewBox in the brand SVG).
  const k = (R * 0.95) / 21
  const dots: [number, number, number][] = [
    [10.5, 5.5, 0.92],
    [5.5, 14.5, 0.72],
    [15.5, 14.5, 0.72],
  ]
  dots.forEach(([x, y, o], i) => {
    const pulse = mode === "thinking" ? 0.45 + 0.55 * Math.max(0, Math.sin(t * 5 - i * 1.1)) : 1
    ctx.beginPath()
    ctx.arc(cx + (x - 10.5) * k, cy + (y - 9.5) * k, 4.5 * k * (1 + speak * 0.08 * Math.sin(t * 9 + i)), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${o * pulse})`
    ctx.fill()
  })

  // Online dot.
  ctx.beginPath()
  ctx.arc(cx + R * 0.7, cy + R * 0.7, R * 0.13, 0, Math.PI * 2)
  ctx.fillStyle = AVA.online
  ctx.fill()
  ctx.lineWidth = R * 0.05
  ctx.strokeStyle = AVA.ink
  ctx.stroke()
}

// The host bubble, in whichever style the guest picked.
function drawHost(ctx: CanvasRenderingContext2D, s: StageState, cx: number, cy: number, r: number, t: number) {
  const style = s.avatarStyle === "photo" && !s.portrait ? "orb" : s.avatarStyle
  if (style === "orb") {
    drawOrb(ctx, cx, cy, r, s.hostMode, s.hostLevel, t)
  } else {
    const speak = s.hostMode === "speaking" ? Math.min(1, 0.3 + s.hostLevel * 1.6) : 0
    const R = r * (1 + Math.sin(t * 1.6) * 0.01 + speak * 0.03)
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.45)"
    ctx.shadowBlur = 36
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.fillStyle = AVA.ink
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.clip()
    if (style === "photo" && s.portrait) {
      const img = s.portrait
      const k = Math.max((R * 2) / img.width, (R * 2) / img.height) * (1.02 + speak * 0.015)
      ctx.drawImage(img, cx - (img.width * k) / 2, cy - (img.height * k) / 2 - speak * R * 0.02, img.width * k, img.height * k)
    } else {
      const g = ctx.createLinearGradient(cx, cy - R, cx, cy + R)
      g.addColorStop(0, shade(s.look.outfit, -0.45))
      g.addColorStop(1, shade(s.look.outfit, -0.8))
      ctx.fillStyle = g
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
      drawAvatar(ctx, cx, cy + R, (R * 2) / 400, s.look, s.hostMode, s.hostLevel, s.guestLevel, t)
    }
    ctx.restore()
    ctx.beginPath()
    ctx.arc(cx, cy, R + r * 0.05 + speak * r * 0.12, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(240,106,106,${0.45 + speak * 0.55})`
    ctx.lineWidth = r * 0.05
    ctx.stroke()
    if (s.hostMode === "thinking") drawThinkingDots(ctx, cx - r * 0.9, cy - r * 0.95, r / 160, t)
  }

  // Name tag: mono, like the brand's labels.
  ctx.font = `600 ${Math.round(r * 0.24)}px ${s.fonts.mono}`
  const label = s.hostName.toUpperCase()
  const w = ctx.measureText(label).width + r * 0.5
  const h = r * 0.42
  const tag: Rect = { x: cx - w / 2, y: cy + r * 1.22, w, h }
  roundRect(ctx, tag, h / 2)
  ctx.fillStyle = "rgba(30,31,33,0.82)"
  ctx.fill()
  ctx.fillStyle = AVA.cream
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(label, cx, tag.y + h / 2 + 1)
}

// AVA's current line as a chat bubble.
function drawCaption(ctx: CanvasRenderingContext2D, s: StageState, area: Rect, size: number) {
  if (!s.caption) return
  ctx.font = `500 ${size}px ${s.fonts.body}`
  const maxW = area.w - size * 1.6
  const lines = wrapLines(ctx, s.caption, maxW, s.format === "vertical" ? 4 : 3)
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const lineH = size * 1.32
  const pad = size * 0.8
  const h = pad * 2 + size * 0.95 + lines.length * lineH
  const w = Math.min(area.w, Math.max(textW, size * 6) + pad * 2)
  const r: Rect = { x: area.x, y: area.y + area.h - h, w, h }
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.28)"
  ctx.shadowBlur = size
  ctx.shadowOffsetY = size * 0.2
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h, [size * 0.7, size * 0.7, size * 0.7, size * 0.2])
  ctx.fillStyle = "rgba(255,248,245,0.96)"
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = AVA.crimson
  ctx.font = `600 ${Math.round(size * 0.5)}px ${s.fonts.mono}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillText(s.hostName.toUpperCase(), r.x + pad, r.y + pad + size * 0.45)
  ctx.fillStyle = AVA.ink
  ctx.font = `500 ${size}px ${s.fonts.body}`
  lines.forEach((line, i) => ctx.fillText(line, r.x + pad, r.y + pad + size * 0.95 + size + i * lineH - size * 0.15))
}

export function drawStage(ctx: CanvasRenderingContext2D, s: StageState, t: number) {
  const { w: W, h: H } = stageSize(s.format)
  const vertical = s.format === "vertical"
  ctx.save()
  ctx.fillStyle = AVA.ink
  ctx.fillRect(0, 0, W, H)
  drawCamera(ctx, s, { x: 0, y: 0, w: W, h: H })

  // Soft shades top and bottom keep the text readable over any background.
  const topH = vertical ? 620 : 300
  const top = ctx.createLinearGradient(0, 0, 0, topH)
  top.addColorStop(0, "rgba(0,0,0,0.5)")
  top.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = top
  ctx.fillRect(0, 0, W, topH)
  const botH = vertical ? 900 : 420
  const bottom = ctx.createLinearGradient(0, H - botH, 0, H)
  bottom.addColorStop(0, "rgba(0,0,0,0)")
  bottom.addColorStop(1, "rgba(0,0,0,0.5)")
  ctx.fillStyle = bottom
  ctx.fillRect(0, H - botH, W, botH)

  // Reels, TikTok and Shorts cover roughly the top 220 px and bottom 400 px
  // of a 9:16 frame with their own interface: everything stays inside.
  const m = 64
  const headY = vertical ? 280 : 104
  ctx.fillStyle = AVA.cream
  ctx.font = `500 ${vertical ? 40 : 44}px ${s.fonts.display}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillText(s.showName, m, headY)
  if (s.themeTitle) {
    ctx.fillStyle = AVA.coral
    ctx.font = `600 ${vertical ? 22 : 22}px ${s.fonts.mono}`
    ctx.fillText(s.themeTitle.toUpperCase(), m, headY + 44)
  }

  const r = vertical ? 92 : 84
  const cx = W - m - r - 12
  const cy = vertical ? 300 : 72 + r
  drawHost(ctx, s, cx, cy, r, t)

  const area: Rect = vertical
    ? { x: m, y: 0, w: W - m * 2, h: H - 430 }
    : { x: m, y: 0, w: Math.min(1240, W - m * 2), h: H - m }
  drawCaption(ctx, s, area, vertical ? 44 : 38)
  ctx.restore()
}

// The stylized host: a bust drawn in a 430-unit box, origin at bottom centre.
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  bottom: number,
  scale: number,
  look: AvatarLook,
  mode: HostMode,
  level: number,
  guestLevel: number,
  t: number,
) {
  ctx.save()
  ctx.translate(cx, bottom)
  ctx.scale(scale, scale)

  const skin = look.skin
  const skinDark = shade(skin, -0.25)
  const breathe = Math.sin(t * 1.4) * 2.5

  // Shoulders and outfit.
  ctx.fillStyle = look.outfit
  ctx.beginPath()
  ctx.moveTo(-200, 0)
  ctx.bezierCurveTo(-200, -90, -150, -128 + breathe, -62, -136 + breathe)
  ctx.lineTo(62, -136 + breathe)
  ctx.bezierCurveTo(150, -128 + breathe, 200, -90, 200, 0)
  ctx.closePath()
  ctx.fill()
  // Neckline.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.moveTo(-44, -136 + breathe)
  ctx.quadraticCurveTo(0, -78 + breathe, 44, -136 + breathe)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = skinDark
  ctx.fillRect(-26, -170, 52, 44)

  // Head motion: an idle bob, a lively tilt while speaking, a nod while listening.
  let tilt = Math.sin(t * 0.7) * 0.02
  let lift = Math.sin(t * 1.6) * 2
  if (mode === "speaking") tilt += Math.sin(t * 2.6) * 0.035 * (0.4 + level)
  if (mode === "listening") lift += Math.sin(t * 3.2) * 3 * Math.min(1, guestLevel * 3)
  if (mode === "thinking") tilt += 0.06
  ctx.translate(0, -215 + lift)
  ctx.rotate(tilt)

  drawHairBack(ctx, look)

  // Ears and earrings.
  ctx.fillStyle = skin
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(side * 80, 0, 14, 22, 0, 0, Math.PI * 2)
    ctx.fill()
    if (look.earrings) {
      ctx.beginPath()
      ctx.arc(side * 82, 34, 11, 0, Math.PI * 2)
      ctx.strokeStyle = look.accent
      ctx.lineWidth = 4
      ctx.stroke()
    }
  }

  // Face.
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(0, 0, 80, 94, 0, 0, Math.PI * 2)
  ctx.fill()

  drawHairFront(ctx, look)

  // Cheeks.
  ctx.fillStyle = "rgba(230,110,90,0.22)"
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(side * 46, 26, 16, 10, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Eyes, with a blink every few seconds and an upward glance while thinking.
  const blinking = t % 4.3 < 0.13
  const lookX = mode === "thinking" ? 5 : Math.sin(t * 0.37) * 2
  const lookY = mode === "thinking" ? -6 : 0
  for (const side of [-1, 1]) {
    ctx.fillStyle = "#1A100A"
    ctx.beginPath()
    ctx.ellipse(side * 30 + lookX, -4 + lookY, 9, blinking ? 1.5 : 12, 0, 0, Math.PI * 2)
    ctx.fill()
    if (!blinking) {
      ctx.fillStyle = "rgba(255,255,255,0.85)"
      ctx.beginPath()
      ctx.arc(side * 30 + lookX + 3, -8 + lookY, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    // Brows lift a little while speaking.
    ctx.strokeStyle = shade(look.hair, 0.1)
    ctx.lineWidth = 5
    ctx.lineCap = "round"
    ctx.beginPath()
    const browY = -30 - (mode === "speaking" ? level * 6 : 0) - (mode === "thinking" ? 4 : 0)
    ctx.moveTo(side * 16, browY + 2)
    ctx.quadraticCurveTo(side * 30, browY - 6, side * 44, browY + 3)
    ctx.stroke()
  }

  // Nose.
  ctx.strokeStyle = skinDark
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(-8, 22)
  ctx.quadraticCurveTo(0, 28, 8, 22)
  ctx.stroke()

  // Mouth: opens with the voice level, smiles otherwise.
  const lip = shade(skin, -0.42)
  if (mode === "speaking" && level > 0.04) {
    const open = 4 + Math.min(1, level * 1.8) * 20
    ctx.fillStyle = "#3B0F14"
    ctx.beginPath()
    ctx.ellipse(0, 50, 20, open / 2 + 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = lip
    ctx.lineWidth = 5
    ctx.stroke()
    if (open > 10) {
      ctx.fillStyle = "rgba(255,255,255,0.85)"
      ctx.fillRect(-11, 50 - open / 2 + 1, 22, 4)
    }
  } else {
    ctx.strokeStyle = lip
    ctx.lineWidth = 6
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(-20, 46)
    ctx.quadraticCurveTo(0, mode === "listening" ? 60 : 56, 20, 46)
    ctx.stroke()
  }

  if (look.glasses) {
    ctx.strokeStyle = "#17110D"
    ctx.lineWidth = 4
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.roundRect(side * 30 - 24, -24, 48, 38, 14)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(-6, -8)
    ctx.quadraticCurveTo(0, -13, 6, -8)
    ctx.stroke()
  }

  if (mode === "thinking") drawThinkingDots(ctx, 120, -110, 0.9, t)

  ctx.restore()
}

function drawHairBack(ctx: CanvasRenderingContext2D, look: AvatarLook) {
  ctx.fillStyle = look.hair
  switch (look.hairStyle) {
    case "afro": {
      ctx.beginPath()
      ctx.arc(0, -24, 132, 0, Math.PI * 2)
      ctx.fill()
      // Soft bumpy silhouette.
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(Math.cos(a) * 124, -24 + Math.sin(a) * 124, 22, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case "puff": {
      ctx.beginPath()
      ctx.arc(0, -120, 62, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(Math.cos(a) * 56, -120 + Math.sin(a) * 56, 14, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case "braids": {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const x = side * (62 + i * 11)
          ctx.beginPath()
          ctx.roundRect(x - 8, -40, 16, 240 - i * 18, 8)
          ctx.fill()
        }
      }
      break
    }
    case "wrap": {
      ctx.fillStyle = look.accent
      ctx.beginPath()
      ctx.ellipse(0, -100, 100, 82, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case "short":
      break
  }
}

function drawHairFront(ctx: CanvasRenderingContext2D, look: AvatarLook) {
  if (look.hairStyle === "wrap") {
    ctx.fillStyle = look.accent
    ctx.beginPath()
    ctx.moveTo(-86, -18)
    ctx.bezierCurveTo(-100, -150, 100, -150, 86, -18)
    ctx.bezierCurveTo(70, -56, -70, -56, -86, -18)
    ctx.fill()
    // Folds and the knot.
    ctx.strokeStyle = shade(look.accent, -0.25)
    ctx.lineWidth = 4
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(-70 + i * 10, -60 - i * 22)
      ctx.quadraticCurveTo(0, -95 - i * 24, 70 - i * 10, -60 - i * 22)
      ctx.stroke()
    }
    ctx.fillStyle = shade(look.accent, -0.12)
    ctx.beginPath()
    ctx.ellipse(18, -150, 30, 22, 0.4, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.fillStyle = look.hair
  ctx.beginPath()
  const top = look.hairStyle === "afro" ? -118 : -112
  ctx.moveTo(-84, -6)
  ctx.bezierCurveTo(-96, top - 22, 96, top - 22, 84, -6)
  ctx.bezierCurveTo(76, -44, 30, -62, 0, -60)
  ctx.bezierCurveTo(-30, -62, -76, -44, -84, -6)
  ctx.fill()
}
