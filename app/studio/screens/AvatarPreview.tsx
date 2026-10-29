"use client"

import { useEffect, useRef } from "react"
import type { AvatarLook, AvatarStyle } from "@/lib/studio/types"
import { drawAvatar, drawOrb, shade } from "../stage"

// Canvas size relative to the orb, leaving room for the glow and ripples.
const ORB_PAD = 2.8

// A small live render of AVA (breathing, blinking, or "speaking") for the
// screens around the camera, in the style the guest picked.
export default function AvatarPreview({
  look,
  portrait,
  avatarStyle = "orb",
  size = 96,
  speaking = false,
}: {
  look: AvatarLook
  portrait?: string | null
  avatarStyle?: AvatarStyle
  size?: number
  speaking?: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const lookRef = useRef(look)
  lookRef.current = look
  const speakingRef = useRef(speaking)
  speakingRef.current = speaking
  const usePhoto = avatarStyle === "photo" && !!portrait

  useEffect(() => {
    if (usePhoto) return
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      const c = ref.current
      const ctx = c?.getContext("2d")
      if (c && ctx) {
        const t = (now - start) / 1000
        const px = c.width
        const level = speakingRef.current ? 0.3 + 0.3 * Math.abs(Math.sin(t * 11)) : 0
        const mode = speakingRef.current ? "speaking" : "idle"
        ctx.clearRect(0, 0, px, px)
        if (avatarStyle === "illustration") {
          ctx.save()
          ctx.beginPath()
          ctx.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2)
          ctx.clip()
          const g = ctx.createLinearGradient(0, 0, 0, px)
          g.addColorStop(0, shade(lookRef.current.outfit, -0.45))
          g.addColorStop(1, shade(lookRef.current.outfit, -0.8))
          ctx.fillStyle = g
          ctx.fillRect(0, 0, px, px)
          drawAvatar(ctx, px / 2, px, px / 400, lookRef.current, mode, level, 0, t)
          ctx.restore()
        } else {
          // The canvas is larger than the orb so its glow fades out fully.
          drawOrb(ctx, px / 2, px / 2, px / (2 * ORB_PAD), mode, level, t)
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [usePhoto, avatarStyle])

  if (usePhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={portrait!}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2 ring-[var(--ava-coral)]/70"
        style={{ width: size, height: size }}
      />
    )
  }
  if (avatarStyle === "illustration") {
    return <canvas ref={ref} width={size * 2} height={size * 2} className="shrink-0" style={{ width: size, height: size }} />
  }
  // The orb occupies a size × size box; its glow spills around it.
  const box = size * ORB_PAD
  return (
    <canvas
      ref={ref}
      width={box * 2}
      height={box * 2}
      className="pointer-events-none shrink-0"
      style={{ width: box, height: box, margin: -(box - size) / 2 }}
    />
  )
}
