"use client"

import { useEffect, useRef } from "react"
import type { AvatarLook } from "@/lib/studio/types"
import { drawAvatar, shade } from "../stage"

// A small live render of the host avatar (idle, blinking) for the screens
// around the camera.
export default function AvatarPreview({
  look,
  portrait,
  size = 96,
  speaking = false,
}: {
  look: AvatarLook
  portrait?: string | null
  size?: number
  speaking?: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const lookRef = useRef(look)
  lookRef.current = look
  const speakingRef = useRef(speaking)
  speakingRef.current = speaking

  useEffect(() => {
    if (portrait) return
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      const c = ref.current
      const ctx = c?.getContext("2d")
      if (c && ctx) {
        const t = (now - start) / 1000
        const px = c.width
        ctx.clearRect(0, 0, px, px)
        ctx.save()
        ctx.beginPath()
        ctx.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2)
        ctx.clip()
        const g = ctx.createLinearGradient(0, 0, 0, px)
        g.addColorStop(0, shade(lookRef.current.outfit, -0.45))
        g.addColorStop(1, shade(lookRef.current.outfit, -0.8))
        ctx.fillStyle = g
        ctx.fillRect(0, 0, px, px)
        const level = speakingRef.current ? 0.3 + 0.3 * Math.abs(Math.sin(t * 11)) : 0
        drawAvatar(ctx, px / 2, px, px / 400, lookRef.current, speakingRef.current ? "speaking" : "idle", level, 0, t)
        ctx.restore()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [portrait])

  if (portrait) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={portrait} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    )
  }
  return <canvas ref={ref} width={size * 2} height={size * 2} className="shrink-0 rounded-full" style={{ width: size, height: size }} />
}
