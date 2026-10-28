"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type {
  AvatarLook,
  Bilingual,
  EpisodeLang,
  HairStyle,
  Lang,
  PastEpisode,
  StudioSession,
  Turn,
  TurnKind,
  WrapUp,
} from "@/lib/studio/types"
import { fill, lines, ui, type UiCopy } from "./copy"
import { EpisodeClock, HostVoice, Listener, StageRecorder, StudioAudio, listeningSupported } from "./engine"
import { STAGE_H, STAGE_W, drawStage, type HostMode, type StageState } from "./stage"

// ---- Types & storage --------------------------------------------------------

type Phase = "loading" | "gate" | "setup" | "countdown" | "live" | "done"

type PlanItem = {
  key: string
  text: Bilingual
  kind: "question" | "closing"
  deep?: boolean
  enabled: boolean
}

type Settings = {
  uiLang: Lang
  epLang: EpisodeLang
  themeId: string
  followUps: number
  autoAdvance: number
  captions: boolean
  autoLayout: boolean
  practice: boolean
  includeClosing: boolean
  look: AvatarLook
}

type LiveView = {
  mode: HostMode
  index: number
  total: number
  hostLine: string
  heard: string
  interim: string
  paused: boolean
  minute: boolean
}

type Pack = { state: "idle" | "loading" | "error" | "ready"; data?: WrapUp; saved?: boolean }

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}
function loadList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    const v = raw ? JSON.parse(raw) : []
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
  } catch {
    /* storage full or blocked — the studio still works without it */
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`
}

function srtTime(ms: number): string {
  const t = Math.max(0, Math.round(ms))
  const h = Math.floor(t / 3600000)
  const m = Math.floor((t % 3600000) / 60000)
  const s = Math.floor((t % 60000) / 1000)
  const msPart = t % 1000
  const p = (n: number, w = 2) => String(n).padStart(w, "0")
  return `${p(h)}:${p(m)}:${p(s)},${p(msPart, 3)}`
}

function download(name: string, content: Blob | string, type = "text/plain;charset=utf-8") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// The spoken theme drops an "Episode 0 — " style prefix.
const spokenTheme = (title: string) => (title.includes(" — ") ? title.split(" — ").slice(1).join(" — ") : title)

const SKINS = ["#F1C7A5", "#D9A47A", "#B97A4E", "#8D5524", "#6B3E1F", "#4A2912"]
const HAIRS = ["#1B1410", "#3B2416", "#6B3E1F", "#A0522D", "#C9A227", "#8E8E8E"]
const OUTFITS = ["#B5822B", "#003219", "#7A1F3D", "#1F3A5F", "#E07A5F", "#F4EBD9"]
const ACCENTS = ["#F2C14E", "#E07A5F", "#2A9D8F", "#FAF6EE", "#C1121F", "#7B2CBF"]
const HAIR_STYLES: HairStyle[] = ["puff", "afro", "braids", "short", "wrap"]

// ---- Small UI pieces ----------------------------------------------------------

function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#17201B] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg text-[#FAF6EE]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            o.value === value ? "bg-[#F2C14E] font-semibold text-[#0E1411]" : "text-[#FAF6EE]/75 hover:bg-white/10"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1.5 text-sm text-[#FAF6EE]/85">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[#F2C14E]" : "bg-white/20"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#0E1411] transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </label>
  )
}

function Swatches({ colors, value, onChange, label }: { colors: string[]; value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => onChange(c)}
            className={`h-8 w-8 rounded-full border-2 transition ${value === c ? "scale-110 border-[#F2C14E]" : "border-white/20"}`}
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-full border-2 border-white/20 bg-transparent"
          aria-label={label}
        />
      </div>
    </div>
  )
}

function CopyButton({ text, t }: { text: string; t: UiCopy }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
      className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-[#FAF6EE]/80 hover:bg-white/10"
    >
      {done ? t.copied : t.copy}
    </button>
  )
}

const btn =
  "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
const btnPrimary = `${btn} bg-[#F2C14E] text-[#0E1411] hover:bg-[#f5cd6c]`
const btnGhost = `${btn} border border-white/15 text-[#FAF6EE] hover:bg-white/10`
const selectCls =
  "w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-[#FAF6EE] outline-none focus:border-[#F2C14E]"

// ---- The studio ---------------------------------------------------------------

export default function Studio() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [phase, setPhase] = useState<Phase>("loading")
  const [session, setSession] = useState<StudioSession | null>(null)
  const [gateError, setGateError] = useState("")
  const [keyInput, setKeyInput] = useState("")

  const [settings, setSettings] = useState<Settings | null>(null)
  const [plan, setPlan] = useState<PlanItem[]>([])
  const [customQ, setCustomQ] = useState("")
  const [episodes, setEpisodes] = useState<PastEpisode[]>([])
  const [portrait, setPortrait] = useState<string | null>(null)

  const [devicesOn, setDevicesOn] = useState(false)
  const [deviceError, setDeviceError] = useState(false)
  const [cams, setCams] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [camId, setCamId] = useState("")
  const [micId, setMicId] = useState("")
  const [notice, setNotice] = useState("")

  const [countdown, setCountdown] = useState(0)
  const [view, setView] = useState<LiveView>({
    mode: "idle",
    index: 0,
    total: 0,
    hostLine: "",
    heard: "",
    interim: "",
    paused: false,
    minute: false,
  })
  const [elapsed, setElapsed] = useState(0)

  const [video, setVideo] = useState<{ url: string; ext: string } | null>(null)
  const [doneTurns, setDoneTurns] = useState<Turn[]>([])
  const [pack, setPack] = useState<Pack>({ state: "idle" })

  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<StudioAudio | null>(null)
  const voiceRef = useRef<HostVoice | null>(null)
  const listenerRef = useRef<Listener | null>(null)
  const clockRef = useRef(new EpisodeClock())
  const recorderRef = useRef(new StageRecorder())
  const turnsRef = useRef<Turn[]>([])
  const wakeRef = useRef<{ release(): Promise<void> } | null>(null)
  const flow = useRef({
    plan: [] as PlanItem[],
    index: 0,
    questionTurn: 0,
    followUps: [] as string[],
    busy: false,
    paused: false,
    stopping: false,
    finishing: false,
  })
  const stage = useRef<StageState>({
    layout: 0,
    layoutTarget: 0,
    hostMode: "idle",
    hostLevel: 0,
    guestLevel: 0,
    caption: null,
    showName: "",
    themeTitle: "",
    hostName: "",
    guestName: "",
    look: {
      skin: SKINS[3],
      hair: HAIRS[0],
      hairStyle: "puff",
      outfit: OUTFITS[0],
      accent: ACCENTS[0],
      glasses: false,
      earrings: true,
    },
    portrait: null,
    video: null,
    fonts: { display: "Georgia, serif", body: "system-ui, sans-serif" },
  })

  // Latest values for the async interview flow, which outlives renders.
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const sessionRef = useRef(session)
  sessionRef.current = session
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const slug = session?.profile.slug ?? "studio"
  const keys = useMemo(
    () => ({
      settings: `studio:${slug}:settings`,
      episodes: `studio:${slug}:episodes`,
      portrait: `studio:${slug}:portrait`,
    }),
    [slug],
  )

  const uiLang: Lang = settings?.uiLang ?? "fr"
  const t = ui[uiLang]
  const profile = session?.profile
  const theme = profile?.themes.find((th) => th.id === settings?.themeId) ?? profile?.themes[0]
  // Stage text and the wrap-up follow the episode language ("mix" uses the UI's).
  const showLang: Lang = settings?.epLang === "fr" || settings?.epLang === "en" ? settings.epLang : uiLang

  // ---- Session --------------------------------------------------------------

  useEffect(() => {
    if (!token) {
      setPhase("gate")
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/studio/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const json = (await res.json().catch(() => null)) as { ok?: boolean; session?: StudioSession } | null
        if (cancelled) return
        if (!res.ok || !json?.ok || !json.session) {
          setGateError(res.status === 401 ? "wrong" : "error")
          setPhase("gate")
          return
        }
        const s = json.session
        const defaults: Settings = {
          uiLang: "fr",
          epLang: "fr",
          themeId: s.profile.themes[0]?.id ?? "",
          followUps: s.ai ? 1 : 0,
          autoAdvance: 0,
          captions: true,
          autoLayout: true,
          practice: false,
          includeClosing: true,
          look: s.profile.host.avatar,
        }
        const k = `studio:${s.profile.slug}`
        const stored = load<Settings>(`${k}:settings`, defaults)
        if (!s.profile.themes.some((th) => th.id === stored.themeId)) stored.themeId = defaults.themeId
        stored.look = { ...defaults.look, ...stored.look }
        setSession(s)
        setSettings(stored)
        setEpisodes(loadList<PastEpisode>(`${k}:episodes`))
        try {
          setPortrait(localStorage.getItem(`${k}:portrait`))
        } catch {
          /* no storage */
        }
        setPhase("setup")
      } catch {
        if (!cancelled) {
          setGateError("error")
          setPhase("gate")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (settings && session) save(keys.settings, settings)
  }, [settings, session, keys])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s))
  }, [])

  // Rebuild the question list when the theme changes.
  useEffect(() => {
    if (!theme) return
    setPlan(
      theme.questions.map((q) => ({
        key: q.id,
        text: q.text,
        kind: "question",
        deep: q.depth === "deep",
        enabled: true,
      })),
    )
  }, [theme])

  // ---- Stage sync -----------------------------------------------------------

  useEffect(() => {
    if (!profile || !settings) return
    const s = stage.current
    s.showName = profile.showName[showLang]
    s.themeTitle = theme?.title[showLang] ?? ""
    s.hostName = profile.host.name[showLang]
    s.guestName = profile.guest.name
    s.look = settings.look
  }, [profile, settings, theme, showLang])

  useEffect(() => {
    if (!portrait) {
      stage.current.portrait = null
      return
    }
    const img = new Image()
    img.onload = () => {
      stage.current.portrait = img
    }
    img.src = portrait
  }, [portrait])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const css = getComputedStyle(el)
    const display = css.getPropertyValue("--font-fraunces").trim()
    const body = css.getPropertyValue("--font-hanken").trim()
    stage.current.fonts = {
      display: display ? `${display}, Georgia, serif` : "Georgia, serif",
      body: body ? `${body}, system-ui, sans-serif` : "system-ui, sans-serif",
    }
  }, [phase])

  // ---- Render loop ------------------------------------------------------------

  const actions = useRef({ next: () => {} })

  useEffect(() => {
    if (phase === "loading" || phase === "gate" || phase === "done") return
    let raf = 0
    let last = performance.now()
    let lastTick = -1
    const start = last
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const s = stage.current
      const hostRaw = voiceRef.current?.level() ?? 0
      s.hostLevel += (hostRaw - s.hostLevel) * Math.min(1, dt * 18)
      const micRaw = audioRef.current?.micLevel() ?? 0
      s.guestLevel += (micRaw - s.guestLevel) * Math.min(1, dt * 10)
      s.video = videoRef.current
      const ctx = canvasRef.current?.getContext("2d")
      if (ctx) drawStage(ctx, s, (now - start) / 1000, dt)

      if (phaseRef.current === "live") {
        const tick = Math.floor(clockRef.current.now() / 500)
        if (tick !== lastTick) {
          lastTick = tick
          setElapsed(clockRef.current.now())
        }
        // Optional auto-advance after a silence.
        const f = flow.current
        const wait = settingsRef.current?.autoAdvance ?? 0
        const listener = listenerRef.current
        // Only count words spoken since the host's latest line.
        const heard = (listener?.segments.length ?? 0) > 0
        if (
          wait > 0 &&
          listener &&
          s.hostMode === "listening" &&
          !f.busy &&
          !f.paused &&
          heard &&
          now - listener.lastHeardAt > wait * 1000
        ) {
          actions.current.next()
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // ---- Devices ----------------------------------------------------------------

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new StudioAudio()
    if (!voiceRef.current && sessionRef.current) {
      voiceRef.current = new HostVoice(audioRef.current, sessionRef.current.voice, token)
    }
    if (!listenerRef.current) {
      listenerRef.current = new Listener(
        () => clockRef.current.now(),
        (finalText, interim) => setView((v) => ({ ...v, heard: finalText, interim })),
      )
    }
    return audioRef.current
  }, [token])

  const enableDevices = useCallback(
    async (nextCam?: string, nextMic?: string) => {
      setDeviceError(false)
      try {
        const audio = ensureAudio()
        await audio.resume()
        streamRef.current?.getTracks().forEach((tr) => tr.stop())
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...(nextCam ? { deviceId: { exact: nextCam } } : {}),
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: {
            ...(nextMic ? { deviceId: { exact: nextMic } } : {}),
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          await v.play().catch(() => {})
        }
        audio.setMic(stream)
        const all = await navigator.mediaDevices.enumerateDevices()
        setCams(all.filter((d) => d.kind === "videoinput"))
        setMics(all.filter((d) => d.kind === "audioinput"))
        setCamId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? "")
        setMicId(stream.getAudioTracks()[0]?.getSettings().deviceId ?? "")
        setDevicesOn(true)
      } catch {
        setDeviceError(true)
      }
    },
    [ensureAudio],
  )

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      voiceRef.current?.stop()
      listenerRef.current?.stop()
      audioRef.current?.close()
    },
    [],
  )

  // ---- Host API ---------------------------------------------------------------

  const callHost = useCallback(
    async <T,>(body: Record<string, unknown>, timeoutMs: number): Promise<T | null> => {
      const ctl = new AbortController()
      const timer = setTimeout(() => ctl.abort(), timeoutMs)
      try {
        const res = await fetch("/api/studio/host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...body }),
          signal: ctl.signal,
        })
        if (!res.ok) return null
        return (await res.json()) as T
      } catch {
        return null
      } finally {
        clearTimeout(timer)
      }
    },
    [token],
  )

  // ---- Interview flow -----------------------------------------------------------

  const langFor = (i: number): Lang => {
    const ep = settingsRef.current?.epLang ?? "fr"
    if (ep === "mix") return i % 2 === 0 ? "fr" : "en"
    return ep
  }

  const vars = (lang: Lang) => {
    const p = sessionRef.current!.profile
    const th = p.themes.find((x) => x.id === settingsRef.current?.themeId) ?? p.themes[0]
    return {
      show: p.showName[lang],
      host: p.host.name[lang],
      guest: p.guest.name,
      theme: spokenTheme(th?.title[lang] ?? ""),
    }
  }

  const setMode = (mode: HostMode) => {
    stage.current.hostMode = mode
    setView((v) => ({ ...v, mode }))
  }

  const say = async (kind: TurnKind, text: string, lang: Lang) => {
    const f = flow.current
    if (f.stopping && kind !== "outro") return
    const turn: Turn = { kind, text, lang, at: clockRef.current.now(), endAt: 0, answer: "", segments: [] }
    turnsRef.current.push(turn)
    const s = stage.current
    s.layoutTarget = 0
    s.caption = settingsRef.current?.captions ? text : null
    setView((v) => ({ ...v, hostLine: text, heard: "", interim: "" }))
    setMode("speaking")
    await voiceRef.current?.speak(text, lang)
    turn.endAt = clockRef.current.now()
    s.caption = null
  }

  const listen = (lang: Lang) => {
    const f = flow.current
    if (f.stopping) return
    stage.current.layoutTarget = settingsRef.current?.autoLayout ? 1 : 0
    setMode("listening")
    listenerRef.current?.start(lang)
  }

  // Moves what the listener heard onto the turn it answers.
  const collect = (): string => {
    const listener = listenerRef.current
    if (!listener) return ""
    const text = listener.stop()
    const turn = turnsRef.current[turnsRef.current.length - 1]
    if (turn && text) {
      turn.answer = turn.answer ? `${turn.answer} ${text}` : text
      turn.segments.push(...listener.segments)
    }
    listener.segments = []
    return text
  }

  const stopEpisode = async () => {
    const f = flow.current
    f.stopping = true
    listenerRef.current?.stop()
    voiceRef.current?.stop()
    setMode("idle")
    const practice = settingsRef.current?.practice
    const blob = practice ? null : await recorderRef.current.stop()
    void wakeRef.current?.release().catch(() => {})
    wakeRef.current = null
    const turns = turnsRef.current.map((tn) => ({ ...tn, segments: [...tn.segments] }))
    setDoneTurns(turns)
    setVideo(blob ? { url: URL.createObjectURL(blob), ext: recorderRef.current.extension } : null)
    setPack({ state: "idle" })
    setPhase("done")
  }

  const finish = async () => {
    const f = flow.current
    if (f.finishing) return
    f.finishing = true
    f.stopping = true
    const lang = langFor(Math.min(f.index, f.plan.length - 1))
    await say("outro", fill(lines[lang].outro, vars(lang)), lang)
    await sleep(600)
    await stopEpisode()
  }

  const askCurrent = async () => {
    const f = flow.current
    const item = f.plan[f.index]
    const lang = langFor(f.index)
    f.questionTurn = turnsRef.current.length
    setView((v) => ({ ...v, index: f.index, total: f.plan.length }))
    await say(item.kind, item.text[lang], lang)
    const upcoming = f.plan[f.index + 1]
    if (upcoming) voiceRef.current?.prefetch(upcoming.text[langFor(f.index + 1)])
    listen(lang)
  }

  const advance = async (transition: string) => {
    const f = flow.current
    const prevLang = langFor(f.index)
    f.index += 1
    f.followUps = []
    if (transition) await say("transition", transition, prevLang)
    if (f.index >= f.plan.length) {
      await finish()
      return
    }
    await askCurrent()
  }

  const next = async () => {
    const f = flow.current
    if (f.busy || f.paused || f.stopping || phaseRef.current !== "live") return
    f.busy = true
    try {
      collect()
      const s = settingsRef.current!
      const sess = sessionRef.current!
      const lang = langFor(f.index)
      const item = f.plan[f.index]
      const answer = turnsRef.current
        .slice(f.questionTurn)
        .map((tn) => tn.answer)
        .filter(Boolean)
        .join(" ")
      let transition = ""
      if (sess.ai && s.followUps > 0 && answer.trim().length > 12) {
        setMode("thinking")
        const res = await callHost<{ decision?: { action: string; line: string } }>(
          {
            action: "followup",
            lang,
            themeTitle: theme?.title[lang] ?? "",
            question: item.text[lang],
            answer,
            followUpsSoFar: f.followUps,
            followUpsLeft: s.followUps - f.followUps.length,
            past: episodes,
          },
          15000,
        )
        const decision = res?.decision
        if (decision?.action === "follow_up" && decision.line && f.followUps.length < s.followUps) {
          f.followUps.push(decision.line)
          await say("followup", decision.line, lang)
          listen(lang)
          return
        }
        transition = decision?.line ?? ""
      }
      await advance(transition)
    } finally {
      f.busy = false
    }
  }
  actions.current.next = () => void next()

  const skip = async () => {
    const f = flow.current
    if (f.busy || f.paused || f.stopping) return
    f.busy = true
    try {
      collect()
      await advance(lines[langFor(f.index)].skip)
    } finally {
      f.busy = false
    }
  }

  const rephrase = async () => {
    const f = flow.current
    if (f.busy || f.paused || f.stopping) return
    f.busy = true
    try {
      collect()
      const lang = langFor(f.index)
      const question = f.plan[f.index].text[lang]
      let line = ""
      if (sessionRef.current?.ai) {
        setMode("thinking")
        const res = await callHost<{ line?: string }>(
          { action: "rephrase", lang, themeTitle: theme?.title[lang] ?? "", question },
          12000,
        )
        line = res?.line ?? ""
      }
      await say("rephrase", line || `${lines[lang].rephrase}${question}`, lang)
      listen(lang)
    } finally {
      f.busy = false
    }
  }

  const repeat = async () => {
    const f = flow.current
    if (f.busy || f.paused || f.stopping) return
    f.busy = true
    try {
      collect()
      const lang = langFor(f.index)
      await say("rephrase", f.plan[f.index].text[lang], lang)
      listen(lang)
    } finally {
      f.busy = false
    }
  }

  const togglePause = (minute = false) => {
    const f = flow.current
    if (f.busy || f.stopping) return
    if (!f.paused) {
      collect()
      f.paused = true
      recorderRef.current.pause()
      clockRef.current.pause()
      setMode("idle")
      setView((v) => ({ ...v, paused: true, minute }))
    } else {
      f.paused = false
      recorderRef.current.resume()
      clockRef.current.resume()
      setView((v) => ({ ...v, paused: false, minute: false }))
      listen(langFor(f.index))
    }
  }

  const needMinute = async () => {
    const f = flow.current
    if (f.busy || f.paused || f.stopping) return
    f.busy = true
    try {
      collect()
      const lang = langFor(f.index)
      await say("comfort", lines[lang].comfort, lang)
    } finally {
      f.busy = false
    }
    togglePause(true)
  }

  const endEarly = async () => {
    const f = flow.current
    if (f.finishing || !window.confirm(t.endConfirm)) return
    collect()
    voiceRef.current?.stop()
    if (f.paused) {
      f.paused = false
      recorderRef.current.resume()
      clockRef.current.resume()
      setView((v) => ({ ...v, paused: false, minute: false }))
    }
    await finish()
  }

  const start = async () => {
    const s = settingsRef.current
    if (!s || !session) return
    const items = plan.filter((p) => p.enabled)
    if (s.includeClosing) {
      items.push({ key: "closing", text: session.profile.closingQuestion, kind: "closing", enabled: true })
    }
    if (!items.length) {
      setNotice(t.needQuestions)
      return
    }
    if (!devicesOn) {
      setNotice(t.needDevices)
      return
    }
    setNotice("")
    const audio = ensureAudio()
    await audio.resume()
    flow.current = {
      plan: items,
      index: 0,
      questionTurn: 0,
      followUps: [],
      busy: true,
      paused: false,
      stopping: false,
      finishing: false,
    }
    turnsRef.current = []
    stage.current.layout = 0
    stage.current.layoutTarget = 0
    setView({ mode: "idle", index: 0, total: items.length, hostLine: "", heard: "", interim: "", paused: false, minute: false })
    setElapsed(0)
    const lang = langFor(0)
    voiceRef.current?.prefetch(fill(lines[lang].opener, vars(lang)))
    voiceRef.current?.prefetch(items[0].text[lang])

    setPhase("countdown")
    for (let n = 3; n > 0; n--) {
      setCountdown(n)
      await sleep(1000)
    }
    setCountdown(0)
    try {
      const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } }
      wakeRef.current = (await nav.wakeLock?.request("screen")) ?? null
    } catch {
      wakeRef.current = null
    }
    clockRef.current.start()
    if (!s.practice && canvasRef.current) recorderRef.current.start(canvasRef.current, audio.recordDest.stream)
    setPhase("live")
    try {
      await say("opener", fill(lines[lang].opener, vars(lang)), lang)
      await askCurrent()
    } finally {
      flow.current.busy = false
    }
  }

  // Keyboard shortcuts during the episode.
  useEffect(() => {
    if (phase !== "live") return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return
      const k = e.key.toLowerCase()
      if (k === " " || k === "arrowright") {
        e.preventDefault()
        if (flow.current.paused) togglePause()
        else void next()
      } else if (k === "s") void skip()
      else if (k === "r") void rephrase()
      else if (k === "q") void repeat()
      else if (k === "p") togglePause()
      else if (k === "m") void needMinute()
    }
    const onLeave = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("beforeunload", onLeave)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("beforeunload", onLeave)
    }
  })

  // ---- After the episode ----------------------------------------------------------

  const generatePack = useCallback(async () => {
    if (!session?.ai || !doneTurns.some((tn) => tn.answer)) return
    setPack({ state: "loading" })
    const res = await callHost<{ wrapUp?: WrapUp }>(
      { action: "wrapup", lang: showLang, themeTitle: theme?.title[showLang] ?? "", turns: doneTurns },
      120000,
    )
    if (!res?.wrapUp) {
      setPack({ state: "error" })
      return
    }
    const wrap = res.wrapUp
    const entry: PastEpisode = {
      id: String(Date.now()),
      date: new Date().toISOString().slice(0, 10),
      themeId: settings?.themeId ?? "",
      lang: settings?.epLang ?? "fr",
      title: wrap.titles[0] ?? theme?.title[showLang] ?? "",
      summary: wrap.summary,
    }
    setEpisodes((list) => {
      const nextList = [...list, entry].slice(-30)
      save(keys.episodes, nextList)
      return nextList
    })
    setPack({ state: "ready", data: wrap, saved: true })
  }, [session, doneTurns, callHost, showLang, theme, settings, keys])

  useEffect(() => {
    if (phase === "done" && pack.state === "idle") void generatePack()
  }, [phase, pack.state, generatePack])

  const guestName = profile?.guest.name ?? "Guest"
  const hostName = profile?.host.name[showLang] ?? "Host"

  const transcriptText = useMemo(
    () =>
      doneTurns
        .map(
          (tn) =>
            `[${clock(tn.at)}] ${hostName.toUpperCase()}: ${tn.text}${tn.answer ? `\n[${clock(tn.endAt)}] ${guestName.toUpperCase()}: ${tn.answer}` : ""}`,
        )
        .join("\n\n"),
    [doneTurns, hostName, guestName],
  )

  const srtText = useMemo(() => {
    const cues: { start: number; end: number; text: string }[] = []
    for (const tn of doneTurns) {
      cues.push({ start: tn.at, end: Math.max(tn.endAt, tn.at + 1500), text: `${hostName}: ${tn.text}` })
      for (const seg of tn.segments) cues.push({ start: seg.start, end: Math.max(seg.end, seg.start + 800), text: seg.text })
    }
    cues.sort((a, b) => a.start - b.start)
    return cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n")
  }, [doneTurns, hostName])

  const chapterLines = useMemo(() => {
    const data = pack.data
    if (!data) return ""
    return [...data.chapters]
      .sort((a, b) => a.turn - b.turn)
      .map((c, i) => `${i === 0 ? "0:00" : clock(doneTurns[c.turn]?.at ?? 0)} ${c.title}`)
      .join("\n")
  }, [pack.data, doneTurns])

  const packMarkdown = useMemo(() => {
    const d = pack.data
    if (!d) return ""
    return [
      `# ${d.titles[0] ?? ""}`,
      "",
      `## ${t.titles}`,
      ...d.titles.map((x) => `- ${x}`),
      "",
      `## ${t.description}`,
      d.description,
      "",
      chapterLines,
      "",
      `## ${t.shorts}`,
      ...d.shorts.map((s) => `- [${clock(doneTurns[s.turn]?.at ?? 0)}] **${s.hook}** — « ${s.quote} »`),
      "",
      `## ${t.tags}`,
      d.tags.join(", "),
      "",
      `## ${t.thumbnail}`,
      d.thumbnailText,
      "",
    ].join("\n")
  }, [pack.data, chapterLines, doneTurns, t])

  // ---- Avatar & memory helpers ----------------------------------------------------

  const setLook = (patch: Partial<AvatarLook>) => {
    setSettings((s) => (s ? { ...s, look: { ...s.look, ...patch } } : s))
  }

  const onPortrait = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Downscale so it fits in browser storage.
        const max = 720
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement("canvas")
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height)
        const url = c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9)
        setPortrait(url)
        save(keys.portrait, url)
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const clearPortrait = () => {
    setPortrait(null)
    try {
      localStorage.removeItem(keys.portrait)
    } catch {
      /* no storage */
    }
  }

  const importMemory = (file: File | undefined) => {
    if (!file) return
    file
      .text()
      .then((txt) => {
        const v = JSON.parse(txt)
        if (!Array.isArray(v)) return
        const list = v.filter((e) => e && typeof e.summary === "string" && typeof e.title === "string") as PastEpisode[]
        setEpisodes(list)
        save(keys.episodes, list)
      })
      .catch(() => {})
  }

  const movePlan = (i: number, dir: -1 | 1) => {
    setPlan((p) => {
      const j = i + dir
      if (j < 0 || j >= p.length) return p
      const copy = [...p]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  const addCustom = () => {
    const text = customQ.trim()
    if (!text) return
    setPlan((p) => [...p, { key: `custom-${Date.now()}`, text: { fr: text, en: text }, kind: "question", enabled: true }])
    setCustomQ("")
  }

  const resetForNext = () => {
    if (video) URL.revokeObjectURL(video.url)
    setVideo(null)
    setDoneTurns([])
    setPack({ state: "idle" })
    setPhase("setup")
  }

  // ---- Render ---------------------------------------------------------------------

  const hiddenVideo = <video ref={videoRef} muted playsInline className="hidden" />
  const display = { fontFamily: "var(--font-fraunces), serif" }

  if (phase === "loading" || phase === "gate" || !settings || !profile) {
    return (
      <div ref={rootRef} className="flex min-h-dvh items-center justify-center px-6">
        {hiddenVideo}
        {phase === "gate" ? (
          <form
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#17201B] p-6"
            onSubmit={(e) => {
              e.preventDefault()
              if (keyInput.trim()) router.replace(`/studio?token=${encodeURIComponent(keyInput.trim())}`)
            }}
          >
            <h1 className="mb-2 text-2xl" style={display}>
              {ui.fr.gateTitle} · {ui.en.gateTitle}
            </h1>
            <p className="mb-5 text-sm text-[#FAF6EE]/70">
              {ui.fr.gateText}
              <br />
              {ui.en.gateText}
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={`${ui.fr.gateKey} / ${ui.en.gateKey}`}
              className={`${selectCls} mb-3`}
              autoFocus
            />
            {gateError && (
              <p className="mb-3 text-sm text-[#E07A5F]">
                {gateError === "wrong" ? `${ui.fr.gateWrong} ${ui.en.gateWrong}` : `${ui.fr.gateError} ${ui.en.gateError}`}
              </p>
            )}
            <button type="submit" className={`${btnPrimary} w-full`}>
              {ui.fr.gateOpen} · {ui.en.gateOpen}
            </button>
          </form>
        ) : (
          <p className="text-lg text-[#FAF6EE]/70" style={display}>
            {ui.fr.loading}
          </p>
        )}
      </div>
    )
  }

  const canvas = (
    <canvas
      ref={canvasRef}
      width={STAGE_W}
      height={STAGE_H}
      className="block aspect-video w-full rounded-2xl bg-[#0E1411] shadow-2xl shadow-black/50"
    />
  )

  const langToggle = (
    <Segmented
      value={settings.uiLang}
      options={[
        { value: "fr", label: "FR" },
        { value: "en", label: "EN" },
      ]}
      onChange={(v) => update("uiLang", v)}
    />
  )

  // ---- Setup ----
  if (phase === "setup") {
    const listenOk = listeningSupported()
    return (
      <div ref={rootRef} className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6">
        {hiddenVideo}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#F2C14E]">Studio</p>
            <h1 className="text-3xl sm:text-4xl" style={display}>
              {profile.showName[uiLang]}
            </h1>
            <p className="mt-1 text-sm text-[#FAF6EE]/65">{profile.tagline[uiLang]}</p>
          </div>
          {langToggle}
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-6 lg:self-start">
            <div className="relative">
              {canvas}
              {!devicesOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/45 p-4 text-center">
                  <button type="button" className={btnPrimary} onClick={() => void enableDevices()}>
                    {t.enableDevices}
                  </button>
                  {deviceError && <p className="max-w-sm text-sm text-[#E07A5F]">{t.cameraError}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <p className={`rounded-xl px-4 py-2.5 ${session!.voice === "cloned" ? "bg-[#003219] text-[#FAF6EE]" : "bg-[#F2C14E]/10 text-[#F2C14E]"}`}>
                {session!.voice === "cloned" ? t.voiceCloned : t.voiceBrowser}
              </p>
              {!session!.ai && <p className="rounded-xl bg-white/5 px-4 py-2.5 text-[#FAF6EE]/75">{t.noAi}</p>}
              {!listenOk && <p className="rounded-xl bg-[#E07A5F]/15 px-4 py-2.5 text-[#E07A5F]">{t.noListening}</p>}
              <p className="px-1 text-[#FAF6EE]/55">{t.tips}</p>
            </div>

            <Card title={t.devices}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-wider text-[#FAF6EE]/55">
                  {t.camera}
                  <select
                    className={`${selectCls} mt-1.5 normal-case tracking-normal`}
                    value={camId}
                    disabled={!devicesOn}
                    onChange={(e) => void enableDevices(e.target.value, micId)}
                  >
                    {cams.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `${t.camera} ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs uppercase tracking-wider text-[#FAF6EE]/55">
                  {t.mic}
                  <select
                    className={`${selectCls} mt-1.5 normal-case tracking-normal`}
                    value={micId}
                    disabled={!devicesOn}
                    onChange={(e) => void enableDevices(camId, e.target.value)}
                  >
                    {mics.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `${t.mic} ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                type="button"
                className={`${btnGhost} mt-4`}
                onClick={async () => {
                  const audio = ensureAudio()
                  await audio.resume()
                  stage.current.hostMode = "speaking"
                  const lang = langFor(0)
                  await voiceRef.current?.speak(lines[lang].voiceTest, lang)
                  stage.current.hostMode = "idle"
                }}
              >
                {t.testVoice}
              </button>
            </Card>

            <Card title={t.avatarTitle}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Swatches label={t.skin} colors={SKINS} value={settings.look.skin} onChange={(c) => setLook({ skin: c })} />
                <Swatches label={t.hairColor} colors={HAIRS} value={settings.look.hair} onChange={(c) => setLook({ hair: c })} />
                <Swatches label={t.outfit} colors={OUTFITS} value={settings.look.outfit} onChange={(c) => setLook({ outfit: c })} />
                <Swatches label={t.accent} colors={ACCENTS} value={settings.look.accent} onChange={(c) => setLook({ accent: c })} />
              </div>
              <div className="mt-4">
                <p className="mb-1.5 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{t.hairStyle}</p>
                <Segmented
                  value={settings.look.hairStyle}
                  options={HAIR_STYLES.map((h) => ({ value: h, label: t.hair[h] }))}
                  onChange={(v) => setLook({ hairStyle: v })}
                />
              </div>
              <div className="mt-3 grid gap-x-6 sm:grid-cols-2">
                <Toggle label={t.glasses} checked={settings.look.glasses} onChange={(v) => setLook({ glasses: v })} />
                <Toggle label={t.earrings} checked={settings.look.earrings} onChange={(v) => setLook({ earrings: v })} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-sm">
                <label className={`${btnGhost} cursor-pointer`}>
                  {t.portrait}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onPortrait(e.target.files?.[0])} />
                </label>
                {portrait && (
                  <button type="button" className="text-[#FAF6EE]/70 underline" onClick={clearPortrait}>
                    {t.portraitRemove}
                  </button>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title={t.planTitle}>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{t.language}</p>
              <Segmented
                value={settings.epLang}
                options={[
                  { value: "fr", label: t.langFr },
                  { value: "en", label: t.langEn },
                  { value: "mix", label: t.langMix },
                ]}
                onChange={(v) => update("epLang", v)}
              />

              <p className="mb-2 mt-5 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{t.theme}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {profile.themes.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => update("themeId", th.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      th.id === theme?.id ? "border-[#F2C14E] bg-[#F2C14E]/10" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-[#FAF6EE]">{th.title[uiLang]}</span>
                    <span className="mt-1 block text-xs leading-snug text-[#FAF6EE]/60">{th.blurb[uiLang]}</span>
                  </button>
                ))}
              </div>

              <p className="mb-1 mt-5 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{t.questions}</p>
              <p className="mb-3 text-xs text-[#FAF6EE]/50">{t.questionsHint}</p>
              <ol className="space-y-2">
                {plan.map((q, i) => (
                  <li
                    key={q.key}
                    className={`flex items-start gap-3 rounded-xl border border-white/10 p-3 ${q.enabled ? "" : "opacity-45"}`}
                  >
                    <input
                      type="checkbox"
                      checked={q.enabled}
                      onChange={(e) =>
                        setPlan((p) => p.map((x) => (x.key === q.key ? { ...x, enabled: e.target.checked } : x)))
                      }
                      className="mt-1 h-4 w-4 accent-[#F2C14E]"
                    />
                    <span className="flex-1 text-sm leading-snug text-[#FAF6EE]/90">
                      {settings.epLang === "mix" ? (
                        <>
                          {q.text.fr}
                          <span className="mt-0.5 block text-xs text-[#FAF6EE]/50">{q.text.en}</span>
                        </>
                      ) : (
                        q.text[settings.epLang]
                      )}
                      {q.deep && (
                        <span className="ml-2 rounded-full bg-[#7A1F3D]/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#FAF6EE]/85">
                          {t.deep}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 flex-col">
                      <button type="button" aria-label="up" onClick={() => movePlan(i, -1)} className="px-1 text-[#FAF6EE]/50 hover:text-[#F2C14E]">
                        ▲
                      </button>
                      <button type="button" aria-label="down" onClick={() => movePlan(i, 1)} className="px-1 text-[#FAF6EE]/50 hover:text-[#F2C14E]">
                        ▼
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex gap-2">
                <input
                  value={customQ}
                  onChange={(e) => setCustomQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCustom()
                  }}
                  placeholder={t.addQuestion}
                  className={selectCls}
                />
                <button type="button" className={btnGhost} onClick={addCustom}>
                  {t.add}
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 p-3">
                <Toggle label={t.closing} checked={settings.includeClosing} onChange={(v) => update("includeClosing", v)} />
                <p className="text-sm text-[#FAF6EE]/65">{profile.closingQuestion[showLang]}</p>
              </div>
            </Card>

            <Card title={t.host}>
              <p className="mb-1.5 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{t.followUps}</p>
              <Segmented
                value={session!.ai ? settings.followUps : 0}
                options={[
                  { value: 0, label: t.followUpsOff },
                  { value: 1, label: "1" },
                  { value: 2, label: "2" },
                ]}
                onChange={(v) => session!.ai && update("followUps", v)}
              />
              <p className="mb-1.5 mt-4 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{t.autoAdvance}</p>
              <Segmented
                value={settings.autoAdvance}
                options={[
                  { value: 0, label: t.autoAdvanceOff },
                  { value: 8, label: `8 ${t.seconds}` },
                  { value: 12, label: `12 ${t.seconds}` },
                ]}
                onChange={(v) => update("autoAdvance", v)}
              />
              <div className="mt-4 border-t border-white/10 pt-2">
                <Toggle label={t.captions} checked={settings.captions} onChange={(v) => update("captions", v)} />
                <Toggle label={t.autoLayout} checked={settings.autoLayout} onChange={(v) => update("autoLayout", v)} />
                <Toggle label={t.practice} checked={settings.practice} onChange={(v) => update("practice", v)} />
              </div>
            </Card>

            <Card
              title={t.memory}
              aside={
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-[#FAF6EE]/70 underline"
                    onClick={() => download(`studio-memory-${slug}.json`, JSON.stringify(episodes, null, 2), "application/json")}
                  >
                    {t.memoryExport}
                  </button>
                  <label className="cursor-pointer text-xs text-[#FAF6EE]/70 underline">
                    {t.memoryImport}
                    <input type="file" accept="application/json" className="hidden" onChange={(e) => importMemory(e.target.files?.[0])} />
                  </label>
                  {episodes.length > 0 && (
                    <button
                      type="button"
                      className="text-xs text-[#E07A5F] underline"
                      onClick={() => {
                        if (!window.confirm(t.memoryClearConfirm)) return
                        setEpisodes([])
                        save(keys.episodes, [])
                      }}
                    >
                      {t.memoryClear}
                    </button>
                  )}
                </div>
              }
            >
              {episodes.length === 0 ? (
                <p className="text-sm text-[#FAF6EE]/55">{t.memoryEmpty}</p>
              ) : (
                <ul className="space-y-3">
                  {[...episodes].reverse().slice(0, 6).map((e) => (
                    <li key={e.id} className="text-sm">
                      <p className="font-semibold text-[#FAF6EE]">
                        <span className="mr-2 text-[#FAF6EE]/45">{e.date}</span>
                        {e.title}
                      </p>
                      <p className="mt-0.5 text-[#FAF6EE]/60">{e.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-[#FAF6EE]/40">{t.memoryHint}</p>
            </Card>

            <div className="sticky bottom-4 z-10 rounded-2xl border border-white/10 bg-[#0E1411]/90 p-3 backdrop-blur">
              {notice && <p className="mb-2 text-center text-sm text-[#E07A5F]">{notice}</p>}
              <button type="button" className={`${btnPrimary} w-full py-3.5 text-base`} onClick={() => void start()}>
                {settings.practice ? t.startPractice : t.start}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- Live (and countdown) ----
  if (phase === "countdown" || phase === "live") {
    const stateLabel =
      view.mode === "speaking"
        ? t.stateSpeaking
        : view.mode === "listening"
          ? t.stateListening
          : view.mode === "thinking"
            ? t.stateThinking
            : t.stateIdle
    const live = phase === "live"
    return (
      <div ref={rootRef} className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
        {hiddenVideo}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            {settings.practice ? (
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold tracking-wider">{t.practiceBadge}</span>
            ) : (
              <span className="flex items-center gap-2 rounded-full bg-[#C1121F]/20 px-3 py-1 font-semibold tracking-wider text-[#ff6b6b]">
                <span className={`h-2.5 w-2.5 rounded-full bg-[#ff4d4d] ${view.paused ? "" : "animate-pulse"}`} />
                {view.paused ? t.paused : t.rec}
              </span>
            )}
            <span className="font-mono text-[#FAF6EE]/80">{clock(elapsed)}</span>
            {view.total > 0 && (
              <span className="text-[#FAF6EE]/60">
                {t.question} {Math.min(view.index + 1, view.total)} {t.of} {view.total}
              </span>
            )}
          </div>
          <span className="rounded-full bg-[#F2C14E]/15 px-3 py-1 text-[#F2C14E]">{stateLabel}</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="relative">
            {canvas}
            {phase === "countdown" && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                <span className="text-[9rem] leading-none text-[#F2C14E]" style={display}>
                  {countdown}
                </span>
              </div>
            )}
            {view.minute && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#0E1411]/85 p-6 text-center">
                <p className="text-4xl" style={display}>
                  {t.minuteTitle}
                </p>
                <p className="max-w-md text-[#FAF6EE]/75">{t.minuteText}</p>
                <button type="button" className={btnPrimary} onClick={() => togglePause()}>
                  {t.resume}
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#17201B] p-5">
              <p className="mb-2 text-xs uppercase tracking-wider text-[#F2C14E]">{hostName}</p>
              <p className="text-xl leading-snug" style={display}>
                {view.hostLine || "…"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#17201B] p-5">
              <p className="mb-2 text-xs uppercase tracking-wider text-[#FAF6EE]/55">{t.heard}</p>
              <p className="max-h-48 overflow-y-auto text-sm leading-relaxed text-[#FAF6EE]/85">
                {view.heard || view.interim ? (
                  <>
                    {view.heard} <span className="text-[#FAF6EE]/45">{view.interim}</span>
                  </>
                ) : (
                  <span className="text-[#FAF6EE]/45">{t.heardEmpty}</span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`${btnPrimary} col-span-2 py-4 text-base`}
                disabled={!live || view.mode !== "listening" || view.paused}
                onClick={() => void next()}
              >
                {t.next} →
              </button>
              <button type="button" className={btnGhost} disabled={!live || view.mode !== "listening"} onClick={() => void skip()}>
                {t.skip}
              </button>
              <button type="button" className={btnGhost} disabled={!live || view.mode !== "listening"} onClick={() => void rephrase()}>
                {t.rephrase}
              </button>
              <button type="button" className={btnGhost} disabled={!live || view.mode !== "listening"} onClick={() => void repeat()}>
                {t.repeat}
              </button>
              <button
                type="button"
                className={btnGhost}
                disabled={!live || (view.mode !== "listening" && !view.paused)}
                onClick={() => togglePause()}
              >
                {view.paused ? t.resume : t.pause}
              </button>
              <button
                type="button"
                className={`${btnGhost} col-span-2`}
                disabled={!live || view.mode !== "listening"}
                onClick={() => void needMinute()}
              >
                {t.minute}
              </button>
              <button
                type="button"
                className={`${btn} col-span-2 mt-2 border border-[#E07A5F]/40 text-[#E07A5F] hover:bg-[#E07A5F]/10`}
                disabled={!live}
                onClick={() => void endEarly()}
              >
                {t.end}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-[#FAF6EE]/45">{t.keys}</p>
          </aside>
        </div>
      </div>
    )
  }

  // ---- Done ----
  const d = pack.data
  const fileBase = `${new Date().toISOString().slice(0, 10)}-${theme?.id ?? "episode"}`
  return (
    <div ref={rootRef} className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6">
      {hiddenVideo}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#F2C14E]">{profile.showName[uiLang]}</p>
          <h1 className="text-3xl sm:text-4xl" style={display}>
            {video ? t.doneTitle : t.donePractice}
          </h1>
        </div>
        <div className="flex gap-3">
          {langToggle}
          <button type="button" className={btnPrimary} onClick={resetForNext}>
            {t.newEpisode}
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {video && <video src={video.url} controls className="aspect-video w-full rounded-2xl bg-black" />}
          <div className="flex flex-wrap gap-2">
            {video && (
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  void fetch(video.url)
                    .then((r) => r.blob())
                    .then((b) => download(`${fileBase}.${video.ext}`, b))
                }}
              >
                {t.downloadVideo}
              </button>
            )}
            <button type="button" className={btnGhost} onClick={() => download(`${fileBase}-transcript.txt`, transcriptText)}>
              {t.downloadTranscript}
            </button>
            <button type="button" className={btnGhost} onClick={() => download(`${fileBase}.srt`, srtText)}>
              {t.downloadSrt}
            </button>
            {d && (
              <button type="button" className={btnGhost} onClick={() => download(`${fileBase}-youtube.md`, packMarkdown, "text/markdown;charset=utf-8")}>
                {t.downloadPack}
              </button>
            )}
          </div>
          <Card title={t.downloadTranscript.replace(/\s*\(.*\)/, "")}>
            <pre className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#FAF6EE]/80" style={{ fontFamily: "inherit" }}>
              {transcriptText}
            </pre>
          </Card>
        </div>

        <Card title={t.packTitle}>
          {pack.state === "loading" && <p className="text-sm text-[#FAF6EE]/70">{t.packLoading}</p>}
          {pack.state === "error" && (
            <div className="space-y-3">
              <p className="text-sm text-[#E07A5F]">{t.packError}</p>
              <button type="button" className={btnGhost} onClick={() => void generatePack()}>
                {t.retry}
              </button>
            </div>
          )}
          {pack.state === "idle" && !session!.ai && <p className="text-sm text-[#FAF6EE]/60">{t.packNoAi}</p>}
          {d && (
            <div className="space-y-5 text-sm">
              {pack.saved && <p className="rounded-lg bg-[#003219] px-3 py-2 text-[#FAF6EE]/85">{t.savedToMemory}</p>}
              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-[#F2C14E]">{t.titles}</h3>
                <ul className="space-y-2">
                  {d.titles.map((x) => (
                    <li key={x} className="flex items-start justify-between gap-3">
                      <span className="text-[#FAF6EE]">{x}</span>
                      <CopyButton text={x} t={t} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider text-[#F2C14E]">
                    {t.description} + {t.chapters}
                  </h3>
                  <CopyButton text={`${d.description}\n\n${chapterLines}`} t={t} />
                </div>
                <p className="whitespace-pre-wrap text-[#FAF6EE]/80">{d.description}</p>
                <pre className="mt-3 whitespace-pre-wrap text-[#FAF6EE]/70" style={{ fontFamily: "inherit" }}>
                  {chapterLines}
                </pre>
              </div>
              <div>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-[#F2C14E]">{t.shorts}</h3>
                <ul className="space-y-3">
                  {d.shorts.map((s, i) => (
                    <li key={i}>
                      <p className="font-semibold text-[#FAF6EE]">
                        <span className="mr-2 font-mono text-[#FAF6EE]/50">{clock(doneTurns[s.turn]?.at ?? 0)}</span>
                        {s.hook}
                      </p>
                      <p className="mt-0.5 italic text-[#FAF6EE]/65">« {s.quote} »</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs uppercase tracking-wider text-[#F2C14E]">{t.thumbnail}</h3>
                  <p className="text-lg text-[#FAF6EE]" style={display}>
                    {d.thumbnailText}
                  </p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider text-[#F2C14E]">{t.tags}</h3>
                    <CopyButton text={d.tags.join(", ")} t={t} />
                  </div>
                  <p className="text-[#FAF6EE]/70">{d.tags.join(", ")}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
