import type { Bilingual, Brief, EpisodeLang, Lang, PastEpisode, Turn, TurnKind } from "@/lib/studio/types"
import { fill, lines } from "./copy"
import type { EpisodeClock, HostVoice, Listener, StageRecorder, StudioAudio } from "./engine"
import type { HostMode, StageState } from "./stage"

// The interview as a little state machine, independent of React: the host
// speaks, listens, decides on a follow-up, moves on. The page drives it with
// next() / skip() / … and renders whatever it reports through onView.

export type InterviewItem = { text: Bilingual; kind: "question" | "closing" }

export type InterviewView = {
  mode: HostMode
  index: number
  total: number
  hostLine: string
  heard: string
  interim: string
  paused: boolean
  minute: boolean
}

export type InterviewConfig = {
  items: InterviewItem[]
  epLang: EpisodeLang
  followUps: number
  autoAdvance: number
  captions: boolean
  autoLayout: boolean
  practice: boolean
  ai: boolean
  themeTitle: (lang: Lang) => string
  vars: (lang: Lang) => Record<string, string>
  brief: Brief | null
  past: PastEpisode[]
}

type CallHost = <T>(body: Record<string, unknown>, timeoutMs: number) => Promise<T | null>

export type InterviewDeps = {
  stage: StageState
  audio: StudioAudio
  voice: HostVoice
  listener: Listener
  clock: EpisodeClock
  recorder: StageRecorder
  canvas: HTMLCanvasElement
  callHost: CallHost
  onView: (patch: Partial<InterviewView>) => void
  onDone: (turns: Turn[], video: Blob | null) => void
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class Interview {
  turns: Turn[] = []
  private index = 0
  private questionTurn = 0
  private followUps: string[] = []
  private busy = true
  private paused = false
  private stopping = false
  private finishing = false

  constructor(
    private readonly cfg: InterviewConfig,
    private readonly d: InterviewDeps,
  ) {}

  get isPaused() {
    return this.paused
  }

  private langFor(i: number): Lang {
    if (this.cfg.epLang === "mix") return i % 2 === 0 ? "fr" : "en"
    return this.cfg.epLang
  }

  private setMode(mode: HostMode) {
    this.d.stage.hostMode = mode
    this.d.onView({ mode })
  }

  private async say(kind: TurnKind, text: string, lang: Lang) {
    if (this.stopping && kind !== "outro") return
    const turn: Turn = { kind, text, lang, at: this.d.clock.now(), endAt: 0, answer: "", segments: [] }
    this.turns.push(turn)
    const s = this.d.stage
    s.layoutTarget = 0
    s.caption = this.cfg.captions ? text : null
    this.d.onView({ hostLine: text, heard: "", interim: "" })
    this.setMode("speaking")
    await this.d.voice.speak(text, lang)
    turn.endAt = this.d.clock.now()
    s.caption = null
  }

  private listen(lang: Lang) {
    if (this.stopping) return
    this.d.stage.layoutTarget = this.cfg.autoLayout ? 1 : 0
    this.setMode("listening")
    this.d.listener.start(lang)
  }

  // Moves what the listener heard onto the turn it answers.
  private collect(): string {
    const listener = this.d.listener
    const text = listener.stop()
    const turn = this.turns[this.turns.length - 1]
    if (turn && text) {
      turn.answer = turn.answer ? `${turn.answer} ${text}` : text
      turn.segments.push(...listener.segments)
    }
    listener.segments = []
    return text
  }

  // Called after the countdown: starts the recording and opens the show.
  async start() {
    this.d.clock.start()
    if (!this.cfg.practice) this.d.recorder.start(this.d.canvas, this.d.audio.recordDest.stream)
    const lang = this.langFor(0)
    this.d.onView({ index: 0, total: this.cfg.items.length })
    try {
      await this.say("opener", fill(lines[lang].opener, this.cfg.vars(lang)), lang)
      await this.askCurrent()
    } finally {
      this.busy = false
    }
  }

  // Warms the voice cache before the countdown ends.
  prefetchOpening() {
    const lang = this.langFor(0)
    this.d.voice.prefetch(fill(lines[lang].opener, this.cfg.vars(lang)))
    this.d.voice.prefetch(this.cfg.items[0]?.text[lang] ?? "")
  }

  private async askCurrent() {
    const item = this.cfg.items[this.index]
    const lang = this.langFor(this.index)
    this.questionTurn = this.turns.length
    this.d.onView({ index: this.index, total: this.cfg.items.length })
    await this.say(item.kind, item.text[lang], lang)
    const upcoming = this.cfg.items[this.index + 1]
    if (upcoming) this.d.voice.prefetch(upcoming.text[this.langFor(this.index + 1)])
    this.listen(lang)
  }

  private async advance(transition: string) {
    const prevLang = this.langFor(this.index)
    this.index += 1
    this.followUps = []
    if (transition) await this.say("transition", transition, prevLang)
    if (this.index >= this.cfg.items.length) {
      await this.finish()
      return
    }
    await this.askCurrent()
  }

  private async finish() {
    if (this.finishing) return
    this.finishing = true
    this.stopping = true
    const lang = this.langFor(Math.min(this.index, this.cfg.items.length - 1))
    await this.say("outro", fill(lines[lang].outro, this.cfg.vars(lang)), lang)
    await sleep(600)
    this.d.listener.stop()
    this.d.voice.stop()
    this.setMode("idle")
    const blob = this.cfg.practice ? null : await this.d.recorder.stop()
    this.d.onDone(
      this.turns.map((t) => ({ ...t, segments: [...t.segments] })),
      blob,
    )
  }

  async next() {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    try {
      this.collect()
      const lang = this.langFor(this.index)
      const item = this.cfg.items[this.index]
      const answer = this.turns
        .slice(this.questionTurn)
        .map((t) => t.answer)
        .filter(Boolean)
        .join(" ")
      let transition = ""
      if (this.cfg.ai && this.cfg.followUps > 0 && answer.trim().length > 12) {
        this.setMode("thinking")
        const res = await this.d.callHost<{ decision?: { action: string; line: string } }>(
          {
            action: "followup",
            lang,
            themeTitle: this.cfg.themeTitle(lang),
            question: item.text[lang],
            answer,
            followUpsSoFar: this.followUps,
            followUpsLeft: this.cfg.followUps - this.followUps.length,
            past: this.cfg.past,
            brief: this.cfg.brief,
          },
          15000,
        )
        const decision = res?.decision
        if (decision?.action === "follow_up" && decision.line && this.followUps.length < this.cfg.followUps) {
          this.followUps.push(decision.line)
          await this.say("followup", decision.line, lang)
          this.listen(lang)
          return
        }
        transition = decision?.line ?? ""
      }
      await this.advance(transition)
    } finally {
      this.busy = false
    }
  }

  async skip() {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    try {
      this.collect()
      await this.advance(lines[this.langFor(this.index)].skip)
    } finally {
      this.busy = false
    }
  }

  async rephrase() {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    try {
      this.collect()
      const lang = this.langFor(this.index)
      const question = this.cfg.items[this.index].text[lang]
      let line = ""
      if (this.cfg.ai) {
        this.setMode("thinking")
        const res = await this.d.callHost<{ line?: string }>(
          { action: "rephrase", lang, themeTitle: this.cfg.themeTitle(lang), question, brief: this.cfg.brief },
          12000,
        )
        line = res?.line ?? ""
      }
      await this.say("rephrase", line || `${lines[lang].rephrase}${question}`, lang)
      this.listen(lang)
    } finally {
      this.busy = false
    }
  }

  async repeat() {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    try {
      this.collect()
      const lang = this.langFor(this.index)
      await this.say("rephrase", this.cfg.items[this.index].text[lang], lang)
      this.listen(lang)
    } finally {
      this.busy = false
    }
  }

  togglePause(minute = false) {
    if (this.busy || this.stopping) return
    if (!this.paused) {
      this.collect()
      this.paused = true
      this.d.recorder.pause()
      this.d.clock.pause()
      this.setMode("idle")
      this.d.onView({ paused: true, minute })
    } else {
      this.paused = false
      this.d.recorder.resume()
      this.d.clock.resume()
      this.d.onView({ paused: false, minute: false })
      this.listen(this.langFor(this.index))
    }
  }

  async needMinute() {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    try {
      this.collect()
      const lang = this.langFor(this.index)
      await this.say("comfort", lines[lang].comfort, lang)
    } finally {
      this.busy = false
    }
    this.togglePause(true)
  }

  async end() {
    if (this.finishing) return
    this.collect()
    this.d.voice.stop()
    if (this.paused) {
      this.paused = false
      this.d.recorder.resume()
      this.d.clock.resume()
      this.d.onView({ paused: false, minute: false })
    }
    await this.finish()
  }

  // Throws the episode away without the outro (closing the camera mid-take).
  async abort() {
    this.stopping = true
    this.finishing = true
    this.d.listener.stop()
    this.d.voice.stop()
    this.setMode("idle")
    await this.d.recorder.stop()
  }

  // Called every frame: optional auto-advance after a silence.
  tick(now: number) {
    const wait = this.cfg.autoAdvance
    const listener = this.d.listener
    if (
      wait > 0 &&
      this.d.stage.hostMode === "listening" &&
      !this.busy &&
      !this.paused &&
      listener.segments.length > 0 &&
      now - listener.lastHeardAt > wait * 1000
    ) {
      void this.next()
    }
  }
}
