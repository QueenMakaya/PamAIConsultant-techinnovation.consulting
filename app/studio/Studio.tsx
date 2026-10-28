"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { LearnedMove } from "@/lib/studio/craft"
import { TOPICS, fillBrief } from "@/lib/studio/topics"
import type {
  AvatarLook,
  Bilingual,
  Brief,
  ContentPack,
  EpisodeLang,
  Format,
  Lang,
  PastEpisode,
  PlanQuestion,
  StudioSession,
  Turn,
} from "@/lib/studio/types"
import { BeautyFilter, DEFAULT_FILTER, type FilterSettings } from "./beauty"
import { lines, ui } from "./copy"
import { EpisodeClock, HostVoice, Listener, StageRecorder, StudioAudio, listeningSupported } from "./engine"
import { Interview, type InterviewItem, type InterviewView } from "./interview"
import CameraScreen, { type CameraPhase } from "./screens/Camera"
import { Home, PlanScreen, TopicScreen, type TopicChoice } from "./screens/Episode"
import { BriefForm, Welcome } from "./screens/Onboarding"
import ReviewScreen, { type ContentState } from "./screens/Review"
import SettingsSheet, { type HostSettings } from "./screens/SettingsSheet"
import { drawStage, type StageState } from "./stage"
import { Button, display, inputCls } from "./ui"

// ---- Persistence -------------------------------------------------------------

type Screen = "loading" | "gate" | "welcome" | "brief" | "home" | "topic" | "plan" | "camera" | "review"

type Settings = { uiLang: Lang; host: HostSettings; look: AvatarLook; format: Format; filter: FilterSettings }

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value))
  } catch {
    /* storage full or blocked — the studio still works without it */
  }
}
function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* no storage */
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const EMPTY_BRIEF: Brief = { name: "", business: "", offer: "", audience: "", transformation: "", proof: "", cta: "", link: "", lang: "fr" }

// The spoken theme drops an "Episode 0 — " style prefix.
const spokenTheme = (title: string) => (title.includes(" — ") ? title.split(" — ").slice(1).join(" — ") : title)

const IDLE_VIEW: InterviewView = { mode: "idle", index: 0, total: 0, hostLine: "", heard: "", interim: "", paused: false, minute: false }

// ---- The studio -----------------------------------------------------------------

export default function Studio() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [screen, setScreen] = useState<Screen>("loading")
  const [session, setSession] = useState<StudioSession | null>(null)
  const [gateError, setGateError] = useState("")
  const [keyInput, setKeyInput] = useState("")

  const [settings, setSettings] = useState<Settings | null>(null)
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF)
  const [episodes, setEpisodes] = useState<PastEpisode[]>([])
  const [portrait, setPortrait] = useState<string | null>(null)
  const [learned, setLearned] = useState<LearnedMove[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filterSupported, setFilterSupported] = useState(true)

  // The episode being prepared.
  const [choice, setChoice] = useState<TopicChoice>({ kind: "topic", id: TOPICS[0].id })
  const [note, setNote] = useState("")
  const [epLang, setEpLang] = useState<EpisodeLang>("fr")
  const [planTitle, setPlanTitle] = useState<Bilingual | null>(null)
  const [questions, setQuestions] = useState<PlanQuestion[]>([])
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [includeClosing, setIncludeClosing] = useState(true)
  const [planning, setPlanning] = useState(false)
  const [planNotice, setPlanNotice] = useState("")

  // Camera.
  const [devicesOn, setDevicesOn] = useState(false)
  const [deviceError, setDeviceError] = useState(false)
  const [camCount, setCamCount] = useState(0)
  const [facing, setFacing] = useState<"user" | "environment">("user")
  const [camPhase, setCamPhase] = useState<CameraPhase>("ready")
  const [countdown, setCountdown] = useState(0)
  const [view, setView] = useState<InterviewView>(IDLE_VIEW)
  const [elapsed, setElapsed] = useState(0)

  // Review.
  const [video, setVideo] = useState<{ url: string; ext: string; blob: Blob } | null>(null)
  const [doneTurns, setDoneTurns] = useState<Turn[]>([])
  const [content, setContent] = useState<ContentState>({ state: "idle" })
  const [recordedFormat, setRecordedFormat] = useState<Format>("vertical")

  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<StudioAudio | null>(null)
  const voiceRef = useRef<HostVoice | null>(null)
  const listenerRef = useRef<Listener | null>(null)
  const clockRef = useRef(new EpisodeClock())
  const recorderRef = useRef(new StageRecorder())
  const interviewRef = useRef<Interview | null>(null)
  const beautyRef = useRef<BeautyFilter | null>(null)
  const filterRef = useRef<FilterSettings>(DEFAULT_FILTER)
  const wakeRef = useRef<{ release(): Promise<void> } | null>(null)
  const stage = useRef<StageState>({
    format: "vertical",
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
    look: { skin: "#8D5524", hair: "#1B1410", hairStyle: "puff", outfit: "#B5822B", accent: "#F2C14E", glasses: false, earrings: true },
    portrait: null,
    video: null,
    cameraFrame: null,
    fonts: { display: "Georgia, serif", body: "system-ui, sans-serif" },
  })

  const profile = session?.profile
  const slug = profile?.slug ?? "studio"
  const keys = useMemo(
    () => ({
      settings: `studio:${slug}:settings`,
      brief: `studio:${slug}:brief`,
      episodes: `studio:${slug}:episodes`,
      portrait: `studio:${slug}:portrait`,
      craft: `studio:${slug}:craft`,
    }),
    [slug],
  )
  const uiLang: Lang = settings?.uiLang ?? "fr"
  const t = ui[uiLang]
  const ai = !!session?.ai
  // Stage text and the content pack follow the episode language ("mix" uses the UI's).
  const showLang: Lang = epLang === "fr" || epLang === "en" ? epLang : uiLang
  const guestName = brief.name.trim() || profile?.guest.name || ""

  const topic = choice.kind === "topic" ? TOPICS.find((x) => x.id === choice.id) : undefined
  const series = choice.kind === "series" ? profile?.themes.find((x) => x.id === choice.id) : undefined
  const topicTitle = useCallback(
    (lang: Lang) => planTitle?.[lang] || topic?.title[lang] || series?.title[lang] || "",
    [planTitle, topic, series],
  )

  // ---- Session --------------------------------------------------------------

  useEffect(() => {
    if (!token) {
      setScreen("gate")
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
          setScreen("gate")
          return
        }
        const s = json.session
        const k = `studio:${s.profile.slug}`
        const stored = load<Partial<Settings>>(`${k}:settings`)
        const next: Settings = {
          uiLang: stored?.uiLang ?? "fr",
          host: {
            followUps: s.ai ? 1 : 0,
            autoAdvance: 0,
            captions: true,
            autoLayout: true,
            practice: false,
            nudges: true,
            ...stored?.host,
          },
          look: { ...s.profile.host.avatar, ...stored?.look },
          format: stored?.format ?? "vertical",
          filter: { ...DEFAULT_FILTER, ...stored?.filter },
        }
        const storedBrief = load<Brief>(`${k}:brief`)
        const b = { ...EMPTY_BRIEF, name: s.profile.guest.name, ...storedBrief }
        const eps = load<PastEpisode[]>(`${k}:episodes`)
        const craft = load<LearnedMove[]>(`${k}:craft`)
        setLearned(Array.isArray(craft) ? craft : [])
        setSession(s)
        setSettings(next)
        setBrief(b)
        setEpLang(b.lang)
        setEpisodes(Array.isArray(eps) ? eps : [])
        try {
          setPortrait(localStorage.getItem(`${k}:portrait`))
        } catch {
          /* no storage */
        }
        setScreen(storedBrief?.business ? "home" : "welcome")
      } catch {
        if (!cancelled) {
          setGateError("error")
          setScreen("gate")
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

  const updateHost = (patch: Partial<HostSettings>) => setSettings((s) => (s ? { ...s, host: { ...s.host, ...patch } } : s))
  const updateLook = (patch: Partial<AvatarLook>) => setSettings((s) => (s ? { ...s, look: { ...s.look, ...patch } } : s))
  const format = settings?.format ?? "vertical"
  filterRef.current = settings?.filter ?? DEFAULT_FILTER

  useEffect(() => {
    try {
      setFilterSupported(!!document.createElement("canvas").getContext("webgl"))
    } catch {
      setFilterSupported(false)
    }
  }, [])

  // ---- Stage sync -----------------------------------------------------------

  useEffect(() => {
    if (!profile || !settings) return
    const s = stage.current
    s.format = format
    s.showName = profile.showName[showLang]
    s.themeTitle = spokenTheme(topicTitle(showLang))
    s.hostName = profile.host.name[showLang]
    s.guestName = guestName
    s.look = settings.look
  }, [profile, settings, format, showLang, topicTitle, guestName])

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
    const d = css.getPropertyValue("--font-fraunces").trim()
    const b = css.getPropertyValue("--font-hanken").trim()
    stage.current.fonts = {
      display: d ? `${d}, Georgia, serif` : "Georgia, serif",
      body: b ? `${b}, system-ui, sans-serif` : "system-ui, sans-serif",
    }
  }, [screen])

  // ---- Audio, devices ---------------------------------------------------------

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new StudioAudio()
    if (!voiceRef.current && session) voiceRef.current = new HostVoice(audioRef.current, session.voice, token)
    if (!listenerRef.current) {
      listenerRef.current = new Listener(
        () => clockRef.current.now(),
        (finalText, interim) => setView((v) => ({ ...v, heard: finalText, interim })),
      )
    }
    return audioRef.current
  }, [session, token])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
    audioRef.current?.setMic(null)
    setDevicesOn(false)
  }, [])

  const enableDevices = useCallback(
    async (nextFacing: "user" | "environment" = facing) => {
      setDeviceError(false)
      try {
        const audio = ensureAudio()
        await audio.resume()
        streamRef.current?.getTracks().forEach((tr) => tr.stop())
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          await v.play().catch(() => {})
        }
        audio.setMic(stream)
        const all = await navigator.mediaDevices.enumerateDevices()
        setCamCount(all.filter((d) => d.kind === "videoinput").length)
        setFacing(nextFacing)
        setDevicesOn(true)
      } catch {
        setDeviceError(true)
      }
    },
    [ensureAudio, facing],
  )

  // Skip the permission primer when the browser already said yes.
  useEffect(() => {
    if (screen !== "camera" || devicesOn) return
    const perms = navigator.permissions as Permissions | undefined
    perms
      ?.query({ name: "camera" as PermissionName })
      .then((p) => {
        if (p.state === "granted") void enableDevices()
      })
      .catch(() => {})
  }, [screen, devicesOn, enableDevices])

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      voiceRef.current?.stop()
      listenerRef.current?.stop()
      audioRef.current?.close()
    },
    [],
  )

  // ---- Render loop (camera screen only) --------------------------------------------

  useEffect(() => {
    if (screen !== "camera") return
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
      if (s.video) {
        beautyRef.current ??= new BeautyFilter()
        s.cameraFrame = beautyRef.current.process(s.video, filterRef.current)
      }
      const ctx = canvasRef.current?.getContext("2d")
      if (ctx) drawStage(ctx, s, (now - start) / 1000, dt)
      const iv = interviewRef.current
      if (iv) {
        iv.tick(now)
        const tick = Math.floor(clockRef.current.now() / 500)
        if (tick !== lastTick) {
          lastTick = tick
          setElapsed(clockRef.current.now())
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [screen])

  const micLevel = useCallback(() => stage.current.guestLevel, [])

  // ---- Host API ---------------------------------------------------------------------

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

  // ---- Planning ---------------------------------------------------------------------

  const langFor = useCallback((i: number): Lang => (epLang === "mix" ? (i % 2 === 0 ? "fr" : "en") : epLang), [epLang])

  const applyPlan = (qs: PlanQuestion[], title: Bilingual | null, notice = "") => {
    setQuestions(qs)
    setEnabled({})
    setPlanTitle(title)
    setPlanNotice(notice)
    setScreen("plan")
  }

  const buildPlan = async () => {
    if (series) {
      applyPlan(
        series.questions.map((q) => ({ id: q.id, text: q.text, kind: "question", deep: q.depth === "deep" })),
        null,
      )
      return
    }
    if (!topic) return
    const fallback = topic.questions.map((q, i) => ({
      id: `${topic.id}-${i}`,
      text: { fr: fillBrief(q.fr, brief, "fr"), en: fillBrief(q.en, brief, "en") },
      kind: "question" as const,
    }))
    if (!ai) {
      applyPlan(fallback, null)
      return
    }
    setPlanning(true)
    const lang = epLang === "mix" ? uiLang : epLang
    const res = await callHost<{ plan?: { title: Bilingual; questions: Bilingual[] } }>(
      { action: "plan", lang, themeTitle: topic.title[lang], intent: topic.intent, note, past: episodes, brief, learned },
      60000,
    )
    setPlanning(false)
    if (res?.plan?.questions.length) {
      const stamp = Date.now()
      applyPlan(
        res.plan.questions.map((q, i) => ({ id: `ai-${stamp}-${i}`, text: q, kind: "question" })),
        res.plan.title,
      )
    } else {
      applyPlan(fallback, null, t.planFailed)
    }
  }

  // ---- Recording ----------------------------------------------------------------------

  const releaseWake = () => {
    void wakeRef.current?.release().catch(() => {})
    wakeRef.current = null
  }

  const generateContent = useCallback(
    async (turns: Turn[]) => {
      if (!ai) return setContent({ state: "noai" })
      if (!turns.some((tn) => tn.answer.trim())) return setContent({ state: "empty" })
      setContent({ state: "loading" })
      const res = await callHost<{ content?: ContentPack }>(
        { action: "content", lang: showLang, themeTitle: topicTitle(showLang), turns, brief },
        280000,
      )
      if (!res?.content) return setContent({ state: "error" })
      const pack = res.content
      const entry: PastEpisode = {
        id: String(Date.now()),
        date: new Date().toISOString().slice(0, 10),
        themeId: choice.id,
        lang: epLang,
        title: pack.youtube.titles[0] ?? topicTitle(showLang),
        summary: pack.summary,
      }
      setEpisodes((list) => {
        const next = [...list, entry].slice(-30)
        save(keys.episodes, next)
        return next
      })
      setContent({ state: "ready", data: pack, saved: true })
    },
    [ai, callHost, showLang, topicTitle, brief, choice.id, epLang, keys],
  )

  const finishRecording = async (turns: Turn[], blob: Blob | null) => {
    releaseWake()
    interviewRef.current = null
    stopCamera()
    setCamPhase("ready")
    setView(IDLE_VIEW)
    setVideo((old) => {
      if (old) URL.revokeObjectURL(old.url)
      return blob ? { url: URL.createObjectURL(blob), ext: recorderRef.current.extension, blob } : null
    })
    setDoneTurns(turns)
    setScreen("review")
    void generateContent(turns)
  }

  const startRecording = async () => {
    if (!session || !settings || !profile || !canvasRef.current || camPhase !== "ready") return
    const items: InterviewItem[] = questions.filter((q) => enabled[q.id] !== false).map((q) => ({ text: q.text, kind: "question" }))
    if (includeClosing) items.push({ text: profile.closingQuestion, kind: "closing" })
    if (items.length === 0) return

    const audio = ensureAudio()
    await audio.resume()
    stage.current.layout = 0
    stage.current.layoutTarget = 0
    setView({ ...IDLE_VIEW, total: items.length })
    setElapsed(0)
    setRecordedFormat(format)

    const interview = new Interview(
      {
        items,
        epLang,
        followUps: ai ? settings.host.followUps : 0,
        autoAdvance: settings.host.autoAdvance,
        captions: settings.host.captions,
        autoLayout: settings.host.autoLayout,
        practice: settings.host.practice,
        ai,
        themeTitle: topicTitle,
        vars: (lang) => ({
          show: profile.showName[lang],
          host: profile.host.name[lang],
          guest: guestName,
          theme: spokenTheme(topicTitle(lang)),
        }),
        brief,
        past: episodes,
        nudges: settings.host.nudges,
        learned,
      },
      {
        stage: stage.current,
        audio,
        voice: voiceRef.current!,
        listener: listenerRef.current!,
        clock: clockRef.current,
        recorder: recorderRef.current,
        canvas: canvasRef.current,
        callHost,
        onView: (patch) => setView((v) => ({ ...v, ...patch })),
        onDone: (turns, blob) => void finishRecording(turns, blob),
      },
    )
    interviewRef.current = interview
    interview.prefetchOpening()

    setCamPhase("countdown")
    for (let n = 3; n > 0; n--) {
      setCountdown(n)
      await sleep(1000)
    }
    setCountdown(0)
    if (interviewRef.current !== interview) return
    try {
      const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } }
      wakeRef.current = (await nav.wakeLock?.request("screen")) ?? null
    } catch {
      wakeRef.current = null
    }
    setCamPhase("live")
    await interview.start()
  }

  const closeCamera = async () => {
    const iv = interviewRef.current
    if (iv) {
      if (!window.confirm(t.leaveConfirm)) return
      interviewRef.current = null
      await iv.abort()
      releaseWake()
    }
    setCamPhase("ready")
    setCountdown(0)
    setView(IDLE_VIEW)
    stopCamera()
    setScreen("plan")
  }

  // Keyboard shortcuts while recording.
  useEffect(() => {
    if (screen !== "camera" || camPhase !== "live") return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return
      const iv = interviewRef.current
      if (!iv) return
      const k = e.key.toLowerCase()
      if (k === " " || k === "arrowright") {
        e.preventDefault()
        if (iv.isPaused) iv.togglePause()
        else void iv.next()
      } else if (k === "s") void iv.skip()
      else if (k === "r") void iv.rephrase()
      else if (k === "q") void iv.repeat()
      else if (k === "p") iv.togglePause()
      else if (k === "m") void iv.needMinute()
    }
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("keydown", onKey)
    window.addEventListener("beforeunload", onLeave)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("beforeunload", onLeave)
    }
  }, [screen, camPhase])

  // ---- Settings helpers --------------------------------------------------------------------

  const onPortrait = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Downscale so it fits in browser storage.
        const k = Math.min(1, 720 / Math.max(img.width, img.height))
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

  const exportMemory = () => {
    const blob = new Blob([JSON.stringify(episodes, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `studio-memory-${slug}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const importMemory = (file: File | undefined) => {
    file
      ?.text()
      .then((txt) => {
        const v = JSON.parse(txt)
        if (!Array.isArray(v)) return
        const list = v.filter((e) => e && typeof e.summary === "string" && typeof e.title === "string") as PastEpisode[]
        setEpisodes(list)
        save(keys.episodes, list)
      })
      .catch(() => {})
  }

  const testVoice = async () => {
    const audio = ensureAudio()
    await audio.resume()
    const lang = epLang === "mix" ? uiLang : epLang
    await voiceRef.current?.speak(lines[lang].voiceTest, lang)
  }

  // ---- Render ------------------------------------------------------------------------------

  const hiddenVideo = <video ref={videoRef} muted playsInline className="hidden" />

  if (screen === "loading" || screen === "gate" || !settings || !profile || !session) {
    return (
      <div ref={rootRef} className="flex min-h-dvh items-center justify-center px-6">
        {hiddenVideo}
        {screen === "gate" ? (
          <form
            className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (keyInput.trim()) router.replace(`/studio?token=${encodeURIComponent(keyInput.trim())}`)
            }}
          >
            <h1 className="text-3xl text-[#F7F3EA]" style={display}>
              {ui.fr.gateTitle}
            </h1>
            <p className="mb-6 mt-2 text-sm text-[#F7F3EA]/60">
              {ui.fr.gateText} · {ui.en.gateText}
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={`${ui.fr.gateKey} / ${ui.en.gateKey}`}
              className={inputCls}
              autoFocus
            />
            {gateError && (
              <p className="mt-3 text-sm text-[#FF8A80]">
                {gateError === "wrong" ? `${ui.fr.gateWrong} · ${ui.en.gateWrong}` : `${ui.fr.gateError} · ${ui.en.gateError}`}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-4 w-full">
              {ui.fr.gateOpen}
            </Button>
          </form>
        ) : (
          <p className="animate-pulse text-lg text-[#F7F3EA]/60" style={display}>
            {ui.fr.loading}
          </p>
        )}
      </div>
    )
  }

  const warnings = [
    ...(listeningSupported() ? [] : [t.noListening]),
    ...(session.voice === "browser" && !settings.host.practice ? [t.voiceBrowserShort] : []),
  ]

  return (
    <div ref={rootRef}>
      {hiddenVideo}

      {screen === "welcome" && <Welcome t={t} look={settings.look} portrait={portrait} onStart={() => setScreen("brief")} />}

      {screen === "brief" && (
        <BriefForm
          t={t}
          brief={brief}
          onChange={setBrief}
          onExit={() => setScreen(brief.business ? "home" : "welcome")}
          onDone={() => {
            save(keys.brief, brief)
            setEpLang(brief.lang)
            setScreen("home")
          }}
        />
      )}

      {screen === "home" && (
        <Home
          t={t}
          name={guestName}
          look={settings.look}
          portrait={portrait}
          episodes={episodes}
          showName={profile.showName[uiLang]}
          onNew={() => {
            setNote("")
            setEpLang(brief.lang)
            setScreen("topic")
          }}
          onProfile={() => setScreen("brief")}
          onSettings={() => setSettingsOpen(true)}
        />
      )}

      {screen === "topic" && (
        <TopicScreen
          t={t}
          uiLang={uiLang}
          topics={TOPICS}
          profile={profile}
          choice={choice}
          onChoice={setChoice}
          note={note}
          onNote={setNote}
          epLang={epLang}
          onLang={setEpLang}
          format={format}
          onFormat={(f) => setSettings((s) => (s ? { ...s, format: f } : s))}
          ai={ai}
          busy={planning}
          onBack={() => setScreen("home")}
          onContinue={() => void buildPlan()}
        />
      )}

      {screen === "plan" && (
        <PlanScreen
          t={t}
          questions={questions}
          enabled={enabled}
          onToggle={(id) => setEnabled((m) => ({ ...m, [id]: m[id] === false }))}
          onAdd={(text) => setQuestions((qs) => [...qs, { id: `custom-${Date.now()}`, text: { fr: text, en: text }, kind: "question" }])}
          includeClosing={includeClosing}
          onClosing={setIncludeClosing}
          closingText={profile.closingQuestion[showLang]}
          langFor={langFor}
          notice={planNotice}
          canRegenerate={ai && choice.kind === "topic"}
          onRegenerate={() => void buildPlan()}
          onBack={() => setScreen("topic")}
          onContinue={() => {
            setCamPhase("ready")
            setView(IDLE_VIEW)
            setScreen("camera")
          }}
        />
      )}

      {screen === "camera" && (
        <CameraScreen
          t={t}
          format={format}
          canvasRef={canvasRef}
          level={micLevel}
          devicesOn={devicesOn}
          deviceError={deviceError}
          onAllow={() => void enableDevices()}
          phase={camPhase}
          countdown={countdown}
          view={view}
          elapsed={elapsed}
          total={questions.filter((q) => enabled[q.id] !== false).length + (includeClosing ? 1 : 0)}
          practice={settings.host.practice}
          warnings={warnings}
          canFlip={camCount > 1}
          onFlip={() => void enableDevices(facing === "user" ? "environment" : "user")}
          onStart={() => void startRecording()}
          onNext={() => void interviewRef.current?.next()}
          onSkip={() => void interviewRef.current?.skip()}
          onRephrase={() => void interviewRef.current?.rephrase()}
          onRepeat={() => void interviewRef.current?.repeat()}
          onPause={() => interviewRef.current?.togglePause()}
          onMinute={() => void interviewRef.current?.needMinute()}
          onEnd={() => {
            if (window.confirm(t.endConfirm)) void interviewRef.current?.end()
          }}
          onClose={() => void closeCamera()}
          onSettings={() => setSettingsOpen(true)}
          filter={settings.filter}
          onFilter={(f) => setSettings((s) => (s ? { ...s, filter: f } : s))}
          filterSupported={filterSupported}
        />
      )}

      {screen === "review" && (
        <ReviewScreen
          t={t}
          format={recordedFormat}
          video={video}
          turns={doneTurns}
          content={content}
          hostName={profile.host.name[showLang]}
          guestName={guestName}
          showName={profile.showName[uiLang]}
          fileBase={`${new Date().toISOString().slice(0, 10)}-${choice.id}`}
          onRetry={() => void generateContent(doneTurns)}
          onDone={() => setScreen("home")}
        />
      )}

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        t={t}
        uiLang={uiLang}
        onUiLang={(l) => setSettings((s) => (s ? { ...s, uiLang: l } : s))}
        ai={ai}
        voice={session.voice}
        host={settings.host}
        onHost={updateHost}
        look={settings.look}
        onLook={updateLook}
        portrait={portrait}
        onPortrait={onPortrait}
        onClearPortrait={() => {
          setPortrait(null)
          remove(keys.portrait)
        }}
        onTestVoice={() => void testVoice()}
        episodesCount={episodes.length}
        onExport={exportMemory}
        onImport={importMemory}
        onClearMemory={() => {
          if (!window.confirm(t.memoryClearConfirm)) return
          setEpisodes([])
          save(keys.episodes, [])
        }}
        learned={learned}
        onLearn={async (transcript) => {
          const res = await callHost<{ moves?: LearnedMove[] }>({ action: "learn", lang: uiLang, transcript }, 120000)
          if (!res?.moves?.length) return false
          setLearned((list) => {
            const next = [...list, ...res.moves!].slice(-20)
            save(keys.craft, next)
            return next
          })
          return true
        }}
        onRemoveLearned={(i) =>
          setLearned((list) => {
            const next = list.filter((_, j) => j !== i)
            save(keys.craft, next)
            return next
          })
        }
      />
    </div>
  )
}
