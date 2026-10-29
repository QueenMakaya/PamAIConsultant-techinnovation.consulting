import type { Lang } from "@/lib/studio/types"

// Browser plumbing for the studio: the recording clock, the host's voice, live
// speech-to-text for the guest, and the recorder that captures the stage.

// ---- Clock -------------------------------------------------------------------

// Time on the recording, with pauses taken out, so markers line up with the file.
export class EpisodeClock {
  private startedAt = 0
  private pausedAt = 0
  private pausedTotal = 0
  private running = false

  start() {
    this.startedAt = performance.now()
    this.pausedTotal = 0
    this.pausedAt = 0
    this.running = true
  }
  pause() {
    if (this.running && !this.pausedAt) this.pausedAt = performance.now()
  }
  resume() {
    if (this.pausedAt) {
      this.pausedTotal += performance.now() - this.pausedAt
      this.pausedAt = 0
    }
  }
  now(): number {
    if (!this.running) return 0
    const end = this.pausedAt || performance.now()
    return Math.max(0, end - this.startedAt - this.pausedTotal)
  }
}

// ---- Audio graph -------------------------------------------------------------

// One AudioContext mixes the guest's mic and the host's voice into the stream
// the recorder captures. The mic is never routed to the speakers (no feedback).
export class StudioAudio {
  readonly ctx: AudioContext
  readonly recordDest: MediaStreamAudioDestinationNode
  readonly hostBus: GainNode
  private readonly hostAnalyser: AnalyserNode
  private readonly micAnalyser: AnalyserNode
  private micSource: MediaStreamAudioSourceNode | null = null
  private readonly buf = new Float32Array(1024)

  constructor() {
    this.ctx = new AudioContext()
    this.recordDest = this.ctx.createMediaStreamDestination()
    this.hostBus = this.ctx.createGain()
    this.hostAnalyser = this.ctx.createAnalyser()
    this.hostAnalyser.fftSize = 1024
    this.hostBus.connect(this.hostAnalyser)
    this.hostBus.connect(this.ctx.destination)
    this.hostBus.connect(this.recordDest)
    this.micAnalyser = this.ctx.createAnalyser()
    this.micAnalyser.fftSize = 1024
  }

  setMic(stream: MediaStream | null) {
    this.micSource?.disconnect()
    this.micSource = null
    if (!stream || stream.getAudioTracks().length === 0) return
    this.micSource = this.ctx.createMediaStreamSource(stream)
    this.micSource.connect(this.micAnalyser)
    this.micSource.connect(this.recordDest)
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume()
  }

  private rms(analyser: AnalyserNode): number {
    analyser.getFloatTimeDomainData(this.buf)
    let sum = 0
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i]
    return Math.sqrt(sum / this.buf.length)
  }
  hostLevel(): number {
    return Math.min(1, this.rms(this.hostAnalyser) * 4)
  }
  micLevel(): number {
    return Math.min(1, this.rms(this.micAnalyser) * 6)
  }

  close() {
    this.micSource?.disconnect()
    void this.ctx.close()
  }
}

// ---- Host voice --------------------------------------------------------------

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null
  const voices = speechSynthesis.getVoices()
  const prefs = lang === "fr" ? ["fr-CA", "fr-FR", "fr"] : ["en-CA", "en-US", "en-GB", "en"]
  for (const p of prefs) {
    const matches = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(p.toLowerCase()))
    // Prefer the natural-sounding network voices when the browser has them.
    const best = matches.find((v) => /natural|google|premium|enhanced/i.test(v.name)) ?? matches[0]
    if (best) return best
  }
  return null
}

// Speaks host lines with the cloned voice (via /api/studio/voice, mixed into the
// recording) or, when none is configured, with the browser's own voice.
export class HostVoice {
  private source: AudioBufferSourceNode | null = null
  private speakingSince = 0
  private browserSpeaking = false
  private cache = new Map<string, Promise<AudioBuffer>>()

  constructor(
    private readonly audio: StudioAudio,
    private readonly mode: "cloned" | "browser",
    private readonly token: string,
  ) {}

  get usesClonedVoice() {
    return this.mode === "cloned"
  }

  private fetchClip(text: string): Promise<AudioBuffer> {
    let clip = this.cache.get(text)
    if (!clip) {
      clip = (async () => {
        const res = await fetch("/api/studio/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: this.token, text }),
        })
        if (!res.ok) throw new Error(`voice_${res.status}`)
        return this.audio.ctx.decodeAudioData(await res.arrayBuffer())
      })()
      clip.catch(() => this.cache.delete(text))
      this.cache.set(text, clip)
    }
    return clip
  }

  // Warm the cache for a line we know is coming (the next question).
  prefetch(text: string) {
    if (this.mode === "cloned" && text) void this.fetchClip(text).catch(() => {})
  }

  async speak(text: string, lang: Lang): Promise<void> {
    this.stop()
    if (this.mode === "cloned") {
      try {
        const buffer = await this.fetchClip(text)
        await this.audio.resume()
        await new Promise<void>((resolve) => {
          const src = this.audio.ctx.createBufferSource()
          src.buffer = buffer
          src.connect(this.audio.hostBus)
          src.onended = () => {
            if (this.source === src) this.source = null
            resolve()
          }
          this.source = src
          src.start()
        })
        return
      } catch {
        // Fall through to the browser voice so the episode keeps going.
      }
    }
    await this.speakWithBrowser(text, lang)
  }

  private speakWithBrowser(text: string, lang: Lang): Promise<void> {
    return new Promise((resolve) => {
      if (typeof speechSynthesis === "undefined") return resolve()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang === "fr" ? "fr-CA" : "en-US"
      const voice = pickVoice(lang)
      if (voice) u.voice = voice
      u.rate = 1
      u.pitch = 1.05
      // Some voice engines never fire onend; don't let the episode hang on it.
      const guard = setTimeout(() => done(), 2500 + text.split(/\s+/).length * 600)
      const done = () => {
        clearTimeout(guard)
        this.browserSpeaking = false
        resolve()
      }
      u.onend = done
      u.onerror = done
      this.browserSpeaking = true
      this.speakingSince = performance.now()
      speechSynthesis.speak(u)
    })
  }

  // Mouth-driving level. The browser voice can't be measured, so it is mimed.
  level(): number {
    if (this.source) return this.audio.hostLevel()
    if (this.browserSpeaking) {
      const t = (performance.now() - this.speakingSince) / 1000
      return 0.25 + 0.35 * Math.abs(Math.sin(t * 11)) * (0.6 + 0.4 * Math.sin(t * 2.7))
    }
    return 0
  }

  stop() {
    if (this.source) {
      const src = this.source
      this.source = null
      try {
        src.stop()
      } catch {
        /* already stopped */
      }
    }
    if (this.browserSpeaking && typeof speechSynthesis !== "undefined") speechSynthesis.cancel()
    this.browserSpeaking = false
  }
}

// ---- Listener (speech-to-text) -----------------------------------------------

type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } }
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function recognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const listeningSupported = () => recognitionCtor() !== null

export type Segment = { start: number; end: number; text: string }

// Continuous recognition that survives the browser's habit of ending sessions
// after a silence: while active, it restarts itself.
export class Listener {
  private rec: SpeechRecognitionLike | null = null
  private active = false
  private finalText = ""
  private interim = ""
  private segmentStart = 0
  segments: Segment[] = []
  lastHeardAt = 0
  // True once anything at all (even an interim guess) was heard since start().
  heardAnything = false
  blocked = false

  constructor(
    private readonly clock: () => number,
    private readonly onUpdate: (finalText: string, interim: string) => void,
  ) {}

  get supported(): boolean {
    return recognitionCtor() !== null
  }

  // Everything heard since start(), including the current unfinished guess.
  get text(): string {
    return this.interim ? `${this.finalText} ${this.interim}`.trim() : this.finalText
  }

  start(lang: Lang, carryOver = "") {
    this.stop()
    const Ctor = recognitionCtor()
    if (!Ctor || this.blocked) return
    this.finalText = carryOver
    this.interim = ""
    this.segments = []
    this.segmentStart = this.clock()
    this.lastHeardAt = performance.now()
    this.heardAnything = false
    this.active = true
    const rec = new Ctor()
    rec.lang = lang === "fr" ? "fr-CA" : "en-US"
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const text = r[0].transcript.trim()
        if (!text) continue
        if (r.isFinal) {
          const now = this.clock()
          this.segments.push({ start: this.segmentStart, end: now, text })
          this.segmentStart = now
          this.finalText = this.finalText ? `${this.finalText} ${text}` : text
        } else {
          interim += `${text} `
        }
      }
      this.lastHeardAt = performance.now()
      this.interim = interim.trim()
      if (this.finalText || interim) this.heardAnything = true
      this.onUpdate(this.finalText, this.interim)
    }
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.blocked = true
        this.active = false
      }
    }
    rec.onend = () => {
      if (this.active && this.rec === rec) {
        try {
          rec.start()
        } catch {
          this.active = false
        }
      }
    }
    this.rec = rec
    try {
      rec.start()
    } catch {
      this.active = false
    }
  }

  // Stops listening and returns everything heard since start().
  stop(): string {
    this.active = false
    const rec = this.rec
    this.rec = null
    if (rec) {
      rec.onresult = null
      rec.onend = null
      try {
        rec.abort()
      } catch {
        /* not running */
      }
    }
    return this.finalText
  }
}

// ---- Recorder ----------------------------------------------------------------

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.640028,mp4a.40.2",
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
]

export class StageRecorder {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  mimeType = ""

  start(canvas: HTMLCanvasElement, audio: MediaStream) {
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...audio.getAudioTracks()])
    this.mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ""
    this.chunks = []
    this.recorder = new MediaRecorder(stream, {
      mimeType: this.mimeType || undefined,
      videoBitsPerSecond: 6_000_000,
      audioBitsPerSecond: 192_000,
    })
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.recorder.start(1000)
  }

  get extension(): string {
    return this.mimeType.startsWith("video/mp4") ? "mp4" : "webm"
  }

  pause() {
    if (this.recorder?.state === "recording") this.recorder.pause()
  }
  resume() {
    if (this.recorder?.state === "paused") this.recorder.resume()
  }

  stop(): Promise<Blob | null> {
    const rec = this.recorder
    this.recorder = null
    if (!rec || rec.state === "inactive") return Promise.resolve(null)
    return new Promise((resolve) => {
      rec.onstop = () => {
        // Only the canvas track is ours to stop; the audio mix is reused.
        rec.stream.getVideoTracks().forEach((t) => t.stop())
        resolve(new Blob(this.chunks, { type: this.mimeType || "video/webm" }))
      }
      rec.stop()
    })
  }
}
