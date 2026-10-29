"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Captions, Download, FileText, Play, RotateCcw, Sparkles } from "lucide-react"
import type { ContentPack, Format, Turn } from "@/lib/studio/types"
import { techniqueName } from "@/lib/studio/craft"
import type { UiCopy } from "../copy"
import { Button, Card, CopyButton, Eyebrow, SectionLabel, Segmented, Skeleton, cx, display } from "../ui"

export type ContentState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error" }
  | { state: "noai" }
  | { state: "empty" }
  | { state: "ready"; data: ContentPack; saved: boolean }

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, "0")
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`
}

function srtTime(ms: number): string {
  const t = Math.max(0, Math.round(ms))
  const p = (n: number, w = 2) => String(n).padStart(w, "0")
  return `${p(Math.floor(t / 3600000))}:${p(Math.floor((t % 3600000) / 60000))}:${p(Math.floor((t % 60000) / 1000))},${p(t % 1000, 3)}`
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

// The moment a clip covers: from the end of the host's line to the next turn.
function clipRange(turns: Turn[], i: number, total: number) {
  const start = turns[i]?.endAt ?? 0
  const end = turns[i + 1]?.at ?? total
  return { start, end: Math.max(end, start + 1000) }
}

export default function ReviewScreen({
  t,
  format,
  video,
  turns,
  content,
  hostName,
  guestName,
  fileBase,
  showName,
  onRetry,
  onDone,
}: {
  t: UiCopy
  format: Format
  video: { url: string; ext: string; blob: Blob } | null
  turns: Turn[]
  content: ContentState
  hostName: string
  guestName: string
  fileBase: string
  showName: string
  onRetry: () => void
  onDone: () => void
}) {
  const [tab, setTab] = useState<"posts" | "transcript">("posts")
  const [step, setStep] = useState(0)
  const playerRef = useRef<HTMLVideoElement>(null)
  const stopAt = useRef<number | null>(null)
  const total = turns.length ? Math.max(...turns.map((tn) => tn.endAt)) : 0

  useEffect(() => {
    if (content.state !== "loading") return
    setStep(0)
    const id = setInterval(() => setStep((s) => Math.min(s + 1, t.generatingSteps.length - 1)), 4500)
    return () => clearInterval(id)
  }, [content.state, t.generatingSteps.length])

  const watch = (startMs: number, endMs: number) => {
    const v = playerRef.current
    if (!v) return
    v.currentTime = startMs / 1000
    stopAt.current = endMs / 1000
    void v.play()
    v.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const transcriptText = useMemo(
    () =>
      turns
        .map(
          (tn) =>
            `[${clock(tn.at)}] ${hostName.toUpperCase()}: ${tn.text}${tn.answer ? `\n[${clock(tn.endAt)}] ${guestName.toUpperCase()}: ${tn.answer}` : ""}`,
        )
        .join("\n\n"),
    [turns, hostName, guestName],
  )

  const srtText = useMemo(() => {
    const cues: { start: number; end: number; text: string }[] = []
    for (const tn of turns) {
      cues.push({ start: tn.at, end: Math.max(tn.endAt, tn.at + 1500), text: `${hostName}: ${tn.text}` })
      for (const seg of tn.segments) cues.push({ start: seg.start, end: Math.max(seg.end, seg.start + 800), text: seg.text })
    }
    cues.sort((a, b) => a.start - b.start)
    return cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join("\n")
  }, [turns, hostName])

  const data = content.state === "ready" ? content.data : null

  const chapters = useMemo(() => {
    if (!data) return ""
    return [...data.youtube.chapters]
      .sort((a, b) => a.turn - b.turn)
      .map((c, i) => `${i === 0 ? "0:00" : clock(turns[c.turn]?.at ?? 0)} ${c.title}`)
      .join("\n")
  }, [data, turns])

  const postsMarkdown = useMemo(() => {
    if (!data) return ""
    const tags = (h: string[]) => h.map((x) => `#${x.replace(/^#/, "")}`).join(" ")
    return [
      `# ${data.youtube.titles[0] ?? ""}`,
      "",
      `## ${t.clips}`,
      ...data.clips.flatMap((c, i) => {
        const r = clipRange(turns, c.turn, total)
        return [
          `### ${i + 1}. ${c.hook}`,
          `- ${clock(r.start)} → ${clock(r.end)}`,
          `- ${t.onScreen}: ${c.onScreenText}`,
          "",
          c.caption,
          "",
          tags(c.hashtags),
          "",
        ]
      }),
      `## ${t.linkedin}`,
      data.linkedin,
      "",
      `## ${t.instagram}`,
      data.instagram.caption,
      "",
      `### ${t.carousel}`,
      ...data.instagram.carousel.map((s, i) => `${i + 1}. ${s}`),
      "",
      `## ${t.youtube}`,
      ...data.youtube.titles.map((x) => `- ${x}`),
      "",
      data.youtube.description,
      "",
      chapters,
      "",
      `${t.tags}: ${data.youtube.tags.join(", ")}`,
      `${t.thumbnail}: ${data.youtube.thumbnailText}`,
      "",
    ].join("\n")
  }, [data, turns, total, chapters, t])

  const chipBase = "inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition"
  const chip = `${chipBase} bg-[var(--ava-ink)]/[0.07] hover:bg-[var(--ava-ink)]/[0.12]`

  return (
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-[max(1.25rem,env(safe-area-inset-top))] animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Eyebrow>{showName}</Eyebrow>
          <h1 className="mt-1 text-3xl text-[var(--ava-ink)] sm:text-4xl" style={display}>
            {video ? t.wrapTitle : t.practiceDone}
          </h1>
        </div>
        <Button onClick={onDone}>{t.done}</Button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          {video && (
            <video
              ref={playerRef}
              src={video.url}
              controls
              playsInline
              onTimeUpdate={(e) => {
                if (stopAt.current !== null && e.currentTarget.currentTime >= stopAt.current) {
                  e.currentTarget.pause()
                  stopAt.current = null
                }
              }}
              className={cx("mx-auto w-full rounded-3xl bg-black", format === "vertical" ? "aspect-[9/16] max-h-[70dvh] w-auto max-w-full object-contain" : "aspect-video")}
            />
          )}
          <div className="flex flex-wrap gap-2">
            {video && (
              <button type="button" className={`${chipBase} bg-[var(--ava-crimson)] text-[var(--ava-cream)] hover:bg-[var(--ava-crimson-deep)]`} onClick={() => download(`${fileBase}.${video.ext}`, video.blob)}>
                <Download size={16} />
                {t.downloadVideo}
              </button>
            )}
            <button type="button" className={chip} onClick={() => download(`${fileBase}-transcript.txt`, transcriptText)}>
              <FileText size={16} />
              {t.downloadTranscript}
            </button>
            <button type="button" className={chip} onClick={() => download(`${fileBase}.srt`, srtText)}>
              <Captions size={16} />
              {t.downloadSrt}
            </button>
            {data && (
              <button type="button" className={chip} onClick={() => download(`${fileBase}-posts.md`, postsMarkdown, "text/markdown;charset=utf-8")}>
                <Sparkles size={16} />
                {t.downloadPosts}
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <Segmented
            value={tab}
            options={[
              { value: "posts", label: t.tabPosts },
              { value: "transcript", label: t.tabTranscript },
            ]}
            onChange={setTab}
          />

          {tab === "transcript" ? (
            <ol className="mt-6 space-y-5">
              {turns.map((tn, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  <p className="text-[var(--ava-crimson)]/90">
                    <span className="mr-2 tabular-nums text-[var(--ava-ink)]/35">{clock(tn.at)}</span>
                    {tn.text}
                    {techniqueName(tn.technique) && (
                      <span className="ml-2 inline-block rounded-full bg-[var(--ava-ink)]/[0.07] px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-[var(--ava-ink)]/55">
                        {techniqueName(tn.technique)}
                      </span>
                    )}
                  </p>
                  {tn.answer && <p className="mt-1.5 pl-12 text-[var(--ava-ink)]/80">{tn.answer}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-6 space-y-8">
              {content.state === "loading" && (
                <Card>
                  <div className="flex items-center gap-3 text-[var(--ava-crimson)]">
                    <Sparkles size={18} className="animate-pulse" />
                    <p style={display} className="text-lg">
                      {t.generating}
                    </p>
                  </div>
                  <ol className="mt-5 space-y-3">
                    {t.generatingSteps.map((s, i) => (
                      <li key={s} className={cx("flex items-center gap-3 text-sm transition", i <= step ? "text-[var(--ava-ink)]" : "text-[var(--ava-ink)]/30")}>
                        <span className={cx("h-2 w-2 rounded-full", i < step ? "bg-[#22A06B]" : i === step ? "animate-pulse bg-[var(--ava-crimson)]" : "bg-[var(--ava-ink)]/20")} />
                        {s}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-6 space-y-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                </Card>
              )}
              {content.state === "error" && (
                <Card>
                  <p className="text-[var(--ava-crimson-deep)]">{t.contentError}</p>
                  <Button variant="secondary" className="mt-4" onClick={onRetry}>
                    <RotateCcw size={16} />
                    {t.retry}
                  </Button>
                </Card>
              )}
              {content.state === "noai" && <Card className="text-sm text-[var(--ava-ink)]/65">{t.contentNoAi}</Card>}
              {content.state === "empty" && <Card className="text-sm text-[var(--ava-ink)]/65">{t.contentNoAnswers}</Card>}

              {data && (
                <>
                  {content.state === "ready" && content.saved && (
                    <p className="rounded-2xl bg-[#DDF7EA] px-4 py-3 text-sm text-[#147A4B]">{t.savedToMemory}</p>
                  )}

                  <section>
                    <div className="mb-3 flex items-baseline justify-between">
                      <h2 className="text-xl text-[var(--ava-ink)]" style={display}>
                        {t.clips}
                      </h2>
                      <span className="text-xs text-[var(--ava-ink)]/40">{t.clipsHint}</span>
                    </div>
                    <div className="space-y-3">
                      {data.clips.map((c, i) => {
                        const r = clipRange(turns, c.turn, total)
                        return (
                          <Card key={i}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="rounded-full bg-[var(--ava-ink)]/[0.07] px-3 py-1 text-xs tabular-nums text-[var(--ava-ink)]/70">
                                {clock(r.start)} → {clock(r.end)}
                              </span>
                              {video && (
                                <button
                                  type="button"
                                  onClick={() => watch(r.start, r.end)}
                                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--ava-crimson)] hover:bg-[var(--ava-crimson)]/10"
                                >
                                  <Play size={14} fill="currentColor" />
                                  {t.watchMoment}
                                </button>
                              )}
                            </div>
                            <p className="mt-4 text-xl leading-snug text-[var(--ava-ink)]" style={display}>
                              {c.hook}
                            </p>
                            <p className="mt-3 inline-block rounded-lg bg-[var(--ava-ink)] px-2.5 py-1 text-sm font-bold text-[var(--ava-cream)]">{c.onScreenText}</p>
                            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ava-ink)]/75">{c.caption}</p>
                            <p className="mt-2 text-sm text-[var(--ava-crimson)]/80">{c.hashtags.map((x) => `#${x.replace(/^#/, "")}`).join(" ")}</p>
                            <div className="mt-4 flex justify-end">
                              <CopyButton
                                text={`${c.caption}\n\n${c.hashtags.map((x) => `#${x.replace(/^#/, "")}`).join(" ")}`}
                                label={t.copy}
                                done={t.copied}
                              />
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-xl text-[var(--ava-ink)]" style={display}>
                        {t.linkedin}
                      </h2>
                      <CopyButton text={data.linkedin} label={t.copy} done={t.copied} />
                    </div>
                    <Card>
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ava-ink)]/85">{data.linkedin}</p>
                    </Card>
                  </section>

                  <section>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-xl text-[var(--ava-ink)]" style={display}>
                        {t.instagram}
                      </h2>
                      <CopyButton text={data.instagram.caption} label={t.copy} done={t.copied} />
                    </div>
                    <Card>
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ava-ink)]/85">{data.instagram.caption}</p>
                    </Card>
                    <div className="mt-4 flex items-center justify-between">
                      <SectionLabel>{t.carousel}</SectionLabel>
                      <CopyButton text={data.instagram.carousel.map((s, i) => `${i + 1}. ${s}`).join("\n")} label={t.copy} done={t.copied} />
                    </div>
                    <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none]">
                      {data.instagram.carousel.map((s, i) => (
                        <div
                          key={i}
                          className={cx(
                            "flex aspect-[4/5] w-56 shrink-0 snap-start flex-col justify-between rounded-3xl p-5",
                            i === 0 ? "bg-[var(--ava-crimson)] text-[var(--ava-cream)]" : "bg-[var(--ava-ink)] text-[var(--ava-cream)]",
                          )}
                        >
                          <span className="text-xs font-semibold opacity-60">
                            {t.slide} {i + 1}/{data.instagram.carousel.length}
                          </span>
                          <p className={cx("leading-snug", i === 0 ? "text-2xl" : "text-lg")} style={display}>
                            {s}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className="mb-3 text-xl text-[var(--ava-ink)]" style={display}>
                      {t.youtube}
                    </h2>
                    <Card className="space-y-6">
                      <div>
                        <SectionLabel>{t.titles}</SectionLabel>
                        <ul className="space-y-2">
                          {data.youtube.titles.map((x) => (
                            <li key={x} className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-[var(--ava-ink)]">{x}</span>
                              <CopyButton text={x} label={t.copy} done={t.copied} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <SectionLabel>{t.description}</SectionLabel>
                          <CopyButton text={`${data.youtube.description}\n\n${chapters}`} label={t.copy} done={t.copied} />
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ava-ink)]/75">{data.youtube.description}</p>
                        <pre className="mt-3 whitespace-pre-wrap text-sm tabular-nums text-[var(--ava-ink)]/60" style={{ fontFamily: "inherit" }}>
                          {chapters}
                        </pre>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <SectionLabel>{t.thumbnail}</SectionLabel>
                          <p className="text-2xl text-[var(--ava-ink)]" style={display}>
                            {data.youtube.thumbnailText}
                          </p>
                        </div>
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <SectionLabel>{t.tags}</SectionLabel>
                            <CopyButton text={data.youtube.tags.join(", ")} label={t.copy} done={t.copied} />
                          </div>
                          <p className="text-sm text-[var(--ava-ink)]/65">{data.youtube.tags.join(", ")}</p>
                        </div>
                      </div>
                    </Card>
                  </section>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
