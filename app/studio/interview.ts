import { TECHNIQUES, type LearnedMove } from "@/lib/studio/craft"
import type { Bilingual, Brief, EpisodeLang, Lang, PastEpisode, Turn, TurnKind } from "@/lib/studio/types"
import { fill, lines } from "./copy"
import type { EpisodeClock, HostVoice, Listener, StageRecorder, StudioAudio } from "./engine"
import type { HostMode, StageState } from "./stage"

// The interview as a conversation, independent of React. AVA speaks, then
// listens; when the guest has finished a thought she takes her turn by herself
// (a follow-up or the next question), helps when the guest goes quiet, and
// never leaves a silence hanging. The page can still drive it by hand with
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
  // Pause was asked while AVA was talking; it starts when she's done.
  pausePending: boolean
  minute: boolean
}

export type InterviewConfig = {
  items: InterviewItem[]
  epLang: EpisodeLang
  followUps: number
  autoAdvance: number
  // Burns AVA's lines into the video as captions (off: the video stays clean).
  videoCaptions: boolean
  practice: boolean
  ai: boolean
  themeTitle: (lang: Lang) => string
  vars: (lang: Lang) => Record<string, string>
  brief: Brief | null
  past: PastEpisode[]
  // AVA speaks up when the guest goes quiet.
  nudges: boolean
  // AVA takes her turn by herself when the guest has finished speaking.
  handsFree: boolean
  // How long a pause after a real answer counts as "done", in ms.
  patienceMs: number
  learned: LearnedMove[]
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

// A pause before answering gets an easy way in, and if the silence goes on,
// AVA moves on. A short answer followed by a pause gets "say more"; a real
// answer followed by a pause is the end of the guest's turn.
const START_SILENCE_MS = 8000
const SHORT_ANSWER_SILENCE_MS = 5500
const REAL_ANSWER_WORDS = 10
// If AVA's reply takes longer than this, she says "mmh" first, like people do.
const FILLER_AFTER_MS = 900

const FILLERS: Record<Lang, string[]> = {
  fr: ["Mmh.", "Je vois.", "D'accord.", "Intéressant."],
  en: ["Mm-hmm.", "I see.", "Okay.", "Interesting."],
}
const ACKS: Record<Lang, string[]> = {
  fr: ["Merci.", "J'adore.", "C'est fort.", "Très clair."],
  en: ["Thank you.", "Love that.", "That's powerful.", "Very clear."],
}
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length

// Words a thought doesn't end on: after "et…", "parce que…" or "euh…" the guest
// is searching for the rest, not done, so AVA waits longer.
const UNFINISHED: Record<Lang, RegExp> = {
  fr: /(?:^|\s)(euh+|heu+|hum+|hmm+|bah|ben|bon|et|mais|ou|donc|alors|puis|parce que|car|genre|en fait|du coup|comme|que|qui|où|si|quand|le|la|les|un|une|des|de|du|au|aux|à|avec|pour|dans|sur|par|sans|mon|ma|mes|son|sa|ses|notre|nos|leur|ce|cette|ces|c'est|j'ai|je|on|il|elle|nous|vous|ils|elles|très|plus|tellement|vraiment)$/i,
  en: /(?:^|\s)(uh+|um+|er+|hmm+|and|but|or|so|because|like|then|the|a|an|to|of|with|for|in|on|at|by|from|my|your|our|their|his|her|that|which|who|when|if|i|i'm|i've|it's|we|they|really|very|just)$/i,
}
function endsUnfinished(text: string, lang: Lang): boolean {
  const t = text.trim()
  if (!t || /[.!?…]$/.test(t)) return false
  return UNFINISHED[lang].test(t.replace(/[,;:\s-]+$/, ""))
}
// A gap this long inside an answer counts as one of the guest's own pauses.
const MIN_PAUSE_MS = 700
// How long after the last transcribed word the mic level alone may still count
// as talking (recognition lags behind speech; steady room noise must not).
const VOICE_TRUST_MS = 4000

export class Interview {
  turns: Turn[] = []
  private index = 0
  private questionTurn = 0
  private followUps: string[] = []
  private busy = true
  private paused = false
  private stopping = false
  private finishing = false
  private listenStartedAt = 0
  private lastVoiceAt = 0
  private voiceMs = 0
  private noiseFloor = 0.02
  private nudgedStart = false
  private nudgedMid = false
  private pauseRequested = false
  // The guest's pauses inside their answers this episode: AVA learns their rhythm.
  private pauses: number[] = []
  private lastActivitySeen = 0

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

  private async say(kind: TurnKind, text: string, lang: Lang, technique?: string) {
    if (this.stopping && kind !== "outro") return
    const turn: Turn = { kind, text, lang, at: this.d.clock.now(), endAt: 0, answer: "", segments: [], technique }
    this.turns.push(turn)
    const s = this.d.stage
    s.caption = this.cfg.videoCaptions ? text : null
    this.d.onView({ hostLine: text, heard: "", interim: "" })
    this.setMode("speaking")
    await this.d.voice.speak(text, lang)
    turn.endAt = this.d.clock.now()
    s.caption = null
  }

  private listen(lang: Lang) {
    if (this.stopping) return
    if (this.pauseRequested) {
      this.pauseNow(false)
      return
    }
    this.setMode("listening")
    this.listenStartedAt = performance.now()
    this.lastVoiceAt = 0
    this.voiceMs = 0
    this.lastActivitySeen = 0
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

  // This question's exchange so far, as a transcript for the host's brain.
  // `pending` is what the listener holds that isn't on a turn yet.
  private thread(pending: string): string {
    const turns = this.turns.slice(this.questionTurn)
    return turns
      .flatMap((t, i) => {
        const answer = [t.answer, i === turns.length - 1 ? pending : ""].filter(Boolean).join(" ")
        return answer ? [`AVA: ${t.text}`, `Guest: ${answer}`] : [`AVA: ${t.text}`]
      })
      .join("\n")
  }

  // How long a silence ends the guest's turn right now.
  private patienceFor(text: string, lang: Lang): number {
    const base = this.cfg.patienceMs
    let p = base
    if (this.pauses.length >= 3) {
      const sorted = [...this.pauses].sort((a, b) => a - b)
      const usual = sorted[Math.floor(sorted.length * 0.8)]
      p = Math.min(base + 2500, Math.max(base, usual + 600))
    }
    if (endsUnfinished(text, lang)) p = Math.min(p * 1.8, p + 3500)
    return p
  }

  // Polls `work` while watching the guest: "resumed" if they started talking
  // again, "pending" if it's still running after `ms`.
  private async unlessResumed<T>(work: Promise<T>, resumed: () => boolean, ms: number): Promise<{ value: T } | "resumed" | "pending"> {
    const box: { out?: { value: T } } = {}
    void work.then((value) => {
      box.out = { value }
    })
    const until = performance.now() + ms
    while (!box.out) {
      if (resumed()) return "resumed"
      if (performance.now() >= until) return "pending"
      await sleep(80)
    }
    return resumed() ? "resumed" : box.out
  }

  private answerSoFar(): string {
    return this.turns
      .slice(this.questionTurn)
      .map((t) => t.answer)
      .filter(Boolean)
      .join(" ")
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
    const langs: Lang[] = this.cfg.epLang === "mix" ? ["fr", "en"] : [this.cfg.epLang]
    for (const l of langs) [...FILLERS[l], ...ACKS[l]].forEach((x) => this.d.voice.prefetch(x))
  }

  private async askCurrent() {
    const item = this.cfg.items[this.index]
    const lang = this.langFor(this.index)
    this.questionTurn = this.turns.length
    this.nudgedStart = false
    this.nudgedMid = false
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

  // Waits for AVA's brain; if it's slow, she says "mmh" meanwhile. Returns the
  // result and whether a filler was spoken.
  private async withFiller<T>(lang: Lang, work: Promise<T>): Promise<{ result: T; filled: boolean }> {
    let settled = false
    const tracked = work.finally(() => {
      settled = true
    })
    await Promise.race([tracked, sleep(FILLER_AFTER_MS)])
    if (settled) return { result: await tracked, filled: false }
    this.setMode("speaking")
    await this.d.voice.speak(pick(FILLERS[lang]), lang)
    this.setMode("thinking")
    return { result: await tracked, filled: true }
  }

  // The guest's turn is over (they tapped, or finished speaking): follow up
  // on what they said, or acknowledge it and move to the next question.
  // `auto`: AVA decided by herself that the guest was done. She then keeps
  // listening while she thinks; if the guest picks up again, it was a pause,
  // not the end of their turn, and she lets them talk.
  async next(auto = false) {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    try {
      const listener = this.d.listener
      const speculative = auto && listener.supported && !listener.blocked
      const heardWords = wordCount(listener.text)
      const resumed = () => speculative && wordCount(listener.text) > heardWords + 1
      const pending = speculative ? listener.text : ""
      if (!speculative) this.collect()
      const lang = this.langFor(this.index)
      const item = this.cfg.items[this.index]
      const answer = [this.answerSoFar(), pending].filter(Boolean).join(" ")
      let transition = ""
      if (this.cfg.ai && this.cfg.followUps > 0 && answer.trim().length > 12) {
        this.setMode("thinking")
        const call = this.d.callHost<{ decision?: { action: string; technique?: string; line: string } }>(
          {
            action: "followup",
            lang,
            themeTitle: this.cfg.themeTitle(lang),
            question: item.text[lang],
            answer,
            thread: this.thread(pending),
            followUpsSoFar: this.followUps,
            followUpsLeft: this.cfg.followUps - this.followUps.length,
            past: this.cfg.past,
            brief: this.cfg.brief,
            learned: this.cfg.learned,
          },
          15000,
        )
        let res: Awaited<typeof call>
        let filled = false
        if (speculative) {
          const first = await this.unlessResumed(call, resumed, FILLER_AFTER_MS)
          if (first === "resumed") {
            this.setMode("listening")
            return
          }
          this.collect()
          if (first === "pending") {
            this.setMode("speaking")
            await this.d.voice.speak(pick(FILLERS[lang]), lang)
            this.setMode("thinking")
            filled = true
            res = await call
          } else {
            res = first.value
          }
        } else {
          ;({ result: res, filled } = await this.withFiller(lang, call))
        }
        const decision = res?.decision
        if (decision?.action === "follow_up" && decision.line && this.followUps.length < this.cfg.followUps) {
          this.followUps.push(decision.line)
          this.nudgedMid = false
          await this.say("followup", decision.line, lang, decision.technique)
          this.listen(lang)
          return
        }
        // A filler already acknowledged the answer; don't stack a second one.
        transition = filled ? "" : (decision?.line ?? "")
      } else {
        if (speculative) this.collect()
        if (answer.trim()) transition = pick(ACKS[lang])
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
        const { result: res } = await this.withFiller(
          lang,
          this.d.callHost<{ line?: string }>(
            { action: "rephrase", lang, themeTitle: this.cfg.themeTitle(lang), question, brief: this.cfg.brief, learned: this.cfg.learned },
            12000,
          ),
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

  // Pause works at any moment: if AVA is talking or thinking, the pause starts
  // as soon as she's done (tap again to cancel it).
  togglePause(minute = false) {
    if (this.stopping) return
    if (this.paused) {
      this.paused = false
      this.d.recorder.resume()
      this.d.clock.resume()
      this.d.onView({ paused: false, minute: false })
      this.listen(this.langFor(this.index))
      return
    }
    if (this.busy) {
      this.pauseRequested = !this.pauseRequested
      this.d.onView({ pausePending: this.pauseRequested })
      return
    }
    this.pauseNow(minute)
  }

  private pauseNow(minute: boolean) {
    this.pauseRequested = false
    this.collect()
    this.paused = true
    this.d.recorder.pause()
    this.d.clock.pause()
    this.setMode("idle")
    this.d.onView({ paused: true, pausePending: false, minute })
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
    this.pauseRequested = false
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

  // AVA speaks up after a silence, using the playbook.
  private async nudge(kind: "start" | "mid") {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    if (kind === "start") this.nudgedStart = true
    else this.nudgedMid = true
    try {
      this.collect()
      const lang = this.langFor(this.index)
      const question = this.cfg.items[this.index].text[lang]
      let line = ""
      let technique = kind === "start" ? "easy_entry" : "say_more"
      if (this.cfg.ai) {
        this.setMode("thinking")
        const res = await this.d.callHost<{ nudge?: { technique: string; line: string } }>(
          {
            action: "nudge",
            kind,
            lang,
            themeTitle: this.cfg.themeTitle(lang),
            question,
            answer: this.answerSoFar(),
            brief: this.cfg.brief,
            learned: this.cfg.learned,
          },
          9000,
        )
        if (res?.nudge?.line) {
          line = res.nudge.line
          technique = res.nudge.technique
        }
      }
      if (!line) line = TECHNIQUES.find((t) => t.id === technique)?.example[lang] ?? ""
      await this.say("nudge", line, lang, technique)
      this.listen(lang)
    } finally {
      this.busy = false
    }
  }

  // Silence after a nudge that didn't help: AVA moves on gently.
  private async moveOnGently() {
    if (this.busy || this.paused || this.stopping) return
    this.busy = true
    try {
      this.collect()
      await this.advance(lines[this.langFor(this.index)].moveOn)
    } finally {
      this.busy = false
    }
  }

  // Called every frame: decides when the guest's turn is over.
  tick(now: number) {
    if (this.d.stage.hostMode !== "listening" || this.busy || this.paused || this.stopping) return
    const listener = this.d.listener
    const lang = this.langFor(this.index)

    // Speech activity: the transcript when the browser transcribes, the mic
    // level otherwise — against a noise floor learned while listening, so a
    // fan or street noise isn't mistaken for talking.
    const level = this.d.stage.guestLevel
    if (level < this.noiseFloor * 1.5) this.noiseFloor += (level - this.noiseFloor) * 0.02
    const transcribing = !listener.blocked && listener.supported
    const voiceNow = level > Math.max(0.15, this.noiseFloor * 3)
    if (voiceNow) {
      if (this.lastVoiceAt) this.voiceMs += Math.min(100, now - this.lastVoiceAt)
      this.lastVoiceAt = now
    }
    const spoken = transcribing ? listener.heardAnything : this.voiceMs > 600
    // Once the guest is talking, the mic level also counts for a few seconds
    // past the last transcribed word: recognition lags behind the voice.
    const voiceTrusted = this.lastVoiceAt && this.lastVoiceAt - listener.lastHeardAt < VOICE_TRUST_MS ? this.lastVoiceAt : 0
    const lastActivity = transcribing
      ? Math.max(this.listenStartedAt, listener.lastHeardAt, spoken ? voiceTrusted : 0)
      : Math.max(this.listenStartedAt, this.lastVoiceAt)
    const silence = now - lastActivity
    const words = transcribing ? wordCount(listener.text) + wordCount(this.answerSoFar()) : Math.round(this.voiceMs / 400)

    // Learn the guest's own pauses: a gap that ended because they went on.
    if (spoken && this.lastActivitySeen && lastActivity - this.lastActivitySeen >= MIN_PAUSE_MS) {
      this.pauses.push(lastActivity - this.lastActivitySeen)
      if (this.pauses.length > 30) this.pauses.shift()
    }
    this.lastActivitySeen = spoken ? lastActivity : 0

    if (!spoken) {
      if (silence < START_SILENCE_MS) return
      if (this.cfg.nudges && !this.nudgedStart) void this.nudge("start")
      else if (this.cfg.handsFree) void this.moveOnGently()
      return
    }

    if (this.cfg.handsFree) {
      const patience = this.patienceFor(transcribing ? listener.text : "", lang)
      if (words >= REAL_ANSWER_WORDS && silence >= patience) {
        void this.next(true)
      } else if (words < REAL_ANSWER_WORDS && silence >= Math.max(SHORT_ANSWER_SILENCE_MS, patience)) {
        if (this.cfg.nudges && !this.nudgedMid) void this.nudge("mid")
        else void this.next(true)
      }
      return
    }

    // Hands-free off: nudges only, then the optional auto-advance.
    if (this.cfg.nudges && !this.nudgedMid && silence >= SHORT_ANSWER_SILENCE_MS + 1000) {
      void this.nudge("mid")
      return
    }
    const wait = this.cfg.autoAdvance
    if (wait > 0 && silence > wait * 1000) void this.next(true)
  }
}
