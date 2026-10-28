import type { AvatarLook } from "@/lib/studio/types"

// The stage is one 1920×1080 canvas: what Pam sees is exactly what gets
// recorded. Everything here is plain Canvas 2D so it can run every frame.

export const STAGE_W = 1920
export const STAGE_H = 1080

export type HostMode = "idle" | "speaking" | "listening" | "thinking"

export type StageState = {
  layout: number // 0 = side by side, 1 = guest in focus with host picture-in-picture
  layoutTarget: number
  hostMode: HostMode
  hostLevel: number // 0..1, smoothed voice level
  guestLevel: number
  caption: string | null
  showName: string
  themeTitle: string
  hostName: string
  guestName: string
  look: AvatarLook
  portrait: HTMLImageElement | null
  video: HTMLVideoElement | null
  fonts: { display: string; body: string }
}

const INK = "#0E1411"
const IVORY = "#FAF6EE"
const PINE = "#003219"

type Rect = { x: number; y: number; w: number; h: number }

const SPLIT_GUEST: Rect = { x: 80, y: 150, w: 860, h: 760 }
const SPLIT_HOST: Rect = { x: 980, y: 150, w: 860, h: 760 }
const FOCUS_GUEST: Rect = { x: 80, y: 150, w: 1760, h: 760 }
const FOCUS_HOST: Rect = { x: 1470, y: 590, w: 340, h: 290 }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => t * t * (3 - 2 * t)
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
})

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

function drawBackdrop(ctx: CanvasRenderingContext2D, s: StageState, t: number) {
  const g = ctx.createLinearGradient(0, 0, STAGE_W, STAGE_H)
  g.addColorStop(0, "#0B1A13")
  g.addColorStop(1, "#1A140C")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)

  // Two soft "studio lights" drifting slowly.
  const glow = (x: number, y: number, r: number, color: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, color)
    rg.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = rg
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  glow(360 + Math.sin(t * 0.13) * 60, 220, 700, "rgba(181,130,43,0.18)")
  glow(1600 + Math.cos(t * 0.11) * 60, 900, 760, "rgba(0,90,52,0.28)")

  ctx.fillStyle = IVORY
  ctx.font = `600 46px ${s.fonts.display}`
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  ctx.fillText(s.showName, 84, 82)

  if (s.themeTitle) {
    ctx.font = `600 26px ${s.fonts.body}`
    const label = s.themeTitle.toUpperCase()
    const w = ctx.measureText(label).width + 48
    const chip: Rect = { x: STAGE_W - 84 - w, y: 58, w, h: 48 }
    roundRect(ctx, chip, 24)
    ctx.fillStyle = "rgba(242,193,78,0.14)"
    ctx.fill()
    ctx.strokeStyle = "rgba(242,193,78,0.55)"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = "#F2C14E"
    ctx.textAlign = "center"
    ctx.fillText(label, chip.x + w / 2, chip.y + 25)
  }
}

function nameTag(ctx: CanvasRenderingContext2D, s: StageState, r: Rect, name: string, small: boolean) {
  const size = small ? 20 : 28
  ctx.font = `600 ${size}px ${s.fonts.body}`
  const w = ctx.measureText(name).width + size * 1.4
  const h = size * 1.9
  const tag: Rect = { x: r.x + 20, y: r.y + r.h - h - 20, w, h }
  roundRect(ctx, tag, h / 2)
  ctx.fillStyle = "rgba(14,20,17,0.72)"
  ctx.fill()
  ctx.fillStyle = IVORY
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(name, tag.x + size * 0.7, tag.y + h / 2 + 1)
}

function drawGuestPanel(ctx: CanvasRenderingContext2D, s: StageState, r: Rect) {
  ctx.save()
  roundRect(ctx, r, 28)
  ctx.clip()
  ctx.fillStyle = "#16221C"
  ctx.fillRect(r.x, r.y, r.w, r.h)
  const v = s.video
  if (v && v.readyState >= 2 && v.videoWidth > 0) {
    // Cover-crop the camera into the panel.
    const scale = Math.max(r.w / v.videoWidth, r.h / v.videoHeight)
    const w = v.videoWidth * scale
    const h = v.videoHeight * scale
    ctx.drawImage(v, r.x + (r.w - w) / 2, r.y + (r.h - h) / 2, w, h)
  } else {
    ctx.fillStyle = "rgba(250,246,238,0.12)"
    ctx.beginPath()
    ctx.arc(r.x + r.w / 2, r.y + r.h * 0.42, Math.min(r.w, r.h) * 0.16, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(r.x + r.w / 2, r.y + r.h * 0.92, Math.min(r.w, r.h) * 0.32, Math.min(r.w, r.h) * 0.26, 0, Math.PI, 0)
    ctx.fill()
  }
  ctx.restore()

  // A warm rim lights up while the guest is talking.
  const talk = Math.min(1, s.guestLevel * 2.2)
  roundRect(ctx, r, 28)
  ctx.lineWidth = 3 + talk * 5
  ctx.strokeStyle = `rgba(242,193,78,${0.18 + talk * 0.6})`
  ctx.stroke()
  nameTag(ctx, s, r, s.guestName, false)
}

function drawHostPanel(ctx: CanvasRenderingContext2D, s: StageState, r: Rect, t: number, small: boolean) {
  ctx.save()
  roundRect(ctx, r, small ? 22 : 28)
  ctx.clip()
  const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h)
  g.addColorStop(0, shade(s.look.outfit, -0.55))
  g.addColorStop(1, shade(s.look.outfit, -0.78))
  ctx.fillStyle = g
  ctx.fillRect(r.x, r.y, r.w, r.h)
  // Halo behind the host's head.
  const rg = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h * 0.45, 0, r.x + r.w / 2, r.y + r.h * 0.45, r.h * 0.6)
  rg.addColorStop(0, "rgba(250,246,238,0.16)")
  rg.addColorStop(1, "rgba(250,246,238,0)")
  ctx.fillStyle = rg
  ctx.fillRect(r.x, r.y, r.w, r.h)

  if (s.portrait) {
    drawPortrait(ctx, s, r, t)
  } else {
    const scale = Math.min(r.w / 430, r.h / 430)
    drawAvatar(ctx, r.x + r.w / 2, r.y + r.h, scale, s.look, s.hostMode, s.hostLevel, s.guestLevel, t)
  }
  ctx.restore()

  const speak = s.hostMode === "speaking" ? Math.min(1, 0.4 + s.hostLevel * 1.6) : 0
  roundRect(ctx, r, small ? 22 : 28)
  ctx.lineWidth = 3 + speak * 5
  ctx.strokeStyle = `rgba(242,193,78,${0.18 + speak * 0.6})`
  ctx.stroke()
  nameTag(ctx, s, r, s.hostName, small)
}

function drawPortrait(ctx: CanvasRenderingContext2D, s: StageState, r: Rect, t: number) {
  const img = s.portrait!
  const radius = Math.min(r.w, r.h) * 0.34
  const cx = r.x + r.w / 2
  const cy = r.y + r.h * 0.46 + Math.sin(t * 1.6) * radius * 0.01
  const level = s.hostMode === "speaking" ? s.hostLevel : 0
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 10 + i * 14 + level * 40, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(242,193,78,${(0.35 - i * 0.1) * (0.3 + level * 2)})`
    ctx.lineWidth = 4
    ctx.stroke()
  }
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()
  const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height)
  ctx.drawImage(img, cx - (img.width * scale) / 2, cy - (img.height * scale) / 2, img.width * scale, img.height * scale)
  ctx.restore()
  if (s.hostMode === "thinking") drawThinkingDots(ctx, cx + radius * 0.9, cy - radius * 0.9, radius / 160, t)
}

function drawThinkingDots(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, t: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(k, k)
  ctx.beginPath()
  ctx.roundRect(-58, -30, 116, 60, 30)
  ctx.fillStyle = "rgba(250,246,238,0.92)"
  ctx.fill()
  for (let i = 0; i < 3; i++) {
    const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 5 - i * 0.7))
    ctx.beginPath()
    ctx.arc(-30 + i * 30, 0, 9, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,50,25,${a})`
    ctx.fill()
  }
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

function drawCaption(ctx: CanvasRenderingContext2D, s: StageState) {
  if (!s.caption) return
  ctx.font = `500 36px ${s.fonts.body}`
  const lines = wrapLines(ctx, s.caption, 1560, 2)
  const h = 56 + lines.length * 46
  const r: Rect = { x: 140, y: STAGE_H - h - 28, w: STAGE_W - 280, h }
  roundRect(ctx, r, 24)
  ctx.fillStyle = "rgba(14,20,17,0.86)"
  ctx.fill()
  ctx.strokeStyle = "rgba(242,193,78,0.35)"
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = "#F2C14E"
  ctx.font = `700 22px ${s.fonts.body}`
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillText(s.hostName.toUpperCase(), r.x + 36, r.y + 40)
  ctx.fillStyle = IVORY
  ctx.font = `500 36px ${s.fonts.body}`
  lines.forEach((line, i) => ctx.fillText(line, r.x + 36, r.y + 86 + i * 46))
}

export function drawStage(ctx: CanvasRenderingContext2D, s: StageState, t: number, dt: number) {
  // Smooth the layout towards its target (~0.6 s) and the levels a little.
  const step = Math.min(1, dt * 3.2)
  s.layout += (s.layoutTarget - s.layout) * step
  const k = ease(Math.max(0, Math.min(1, s.layout)))

  ctx.save()
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)
  drawBackdrop(ctx, s, t)

  const guest = lerpRect(SPLIT_GUEST, FOCUS_GUEST, k)
  const host = lerpRect(SPLIT_HOST, FOCUS_HOST, k)
  drawGuestPanel(ctx, s, guest)
  // A drop shadow keeps the picture-in-picture host readable over the camera.
  if (k > 0.05) {
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.5)"
    ctx.shadowBlur = 40 * k
    roundRect(ctx, host, 22)
    ctx.fillStyle = PINE
    ctx.fill()
    ctx.restore()
  }
  drawHostPanel(ctx, s, host, t, k > 0.5)
  drawCaption(ctx, s)
  ctx.restore()
}
