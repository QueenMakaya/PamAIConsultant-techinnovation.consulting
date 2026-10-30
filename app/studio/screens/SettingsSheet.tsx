"use client"

import { useState } from "react"
import { Sparkles, Volume2, X } from "lucide-react"
import { TECHNIQUES, type LearnedMove } from "@/lib/studio/craft"
import type { AvatarLook, AvatarStyle, HairStyle, Lang } from "@/lib/studio/types"
import { fill, type UiCopy } from "../copy"
import { Button, SectionLabel, Segmented, Sheet, Swatches, Toggle, cx, inputCls } from "../ui"
import AvatarPreview from "./AvatarPreview"

export type HostSettings = {
  followUps: number
  autoAdvance: number
  videoCaptions: boolean
  handsFree: boolean
  patience: "fast" | "normal" | "patient"
  practice: boolean
  nudges: boolean
}

const SKINS = ["#F1C7A5", "#D9A47A", "#B97A4E", "#8D5524", "#6B3E1F", "#4A2912"]
const HAIRS = ["#1B1410", "#3B2416", "#6B3E1F", "#A0522D", "#C9A227", "#8E8E8E"]
const OUTFITS = ["#B5822B", "#003219", "#7A1F3D", "#1F3A5F", "#E07A5F", "#F4EBD9"]
const ACCENTS = ["var(--ava-crimson)", "#E07A5F", "#2A9D8F", "#FAF6EE", "#C1121F", "#7B2CBF"]
const HAIR_STYLES: HairStyle[] = ["puff", "afro", "braids", "short", "wrap"]

export default function SettingsSheet({
  open,
  onClose,
  t,
  uiLang,
  onUiLang,
  ai,
  voice,
  host,
  onHost,
  look,
  onLook,
  avatarStyle,
  onAvatarStyle,
  portrait,
  onPortrait,
  onClearPortrait,
  onTestVoice,
  episodesCount,
  onExport,
  onImport,
  onClearMemory,
  learned,
  onLearn,
  onRemoveLearned,
}: {
  open: boolean
  onClose: () => void
  t: UiCopy
  uiLang: Lang
  onUiLang: (l: Lang) => void
  ai: boolean
  voice: "cloned" | "browser"
  host: HostSettings
  onHost: (patch: Partial<HostSettings>) => void
  look: AvatarLook
  onLook: (patch: Partial<AvatarLook>) => void
  avatarStyle: AvatarStyle
  onAvatarStyle: (s: AvatarStyle) => void
  portrait: string | null
  onPortrait: (file: File | undefined) => void
  onClearPortrait: () => void
  onTestVoice: () => void
  episodesCount: number
  onExport: () => void
  onImport: (file: File | undefined) => void
  onClearMemory: () => void
  learned: LearnedMove[]
  onLearn: (transcript: string) => Promise<boolean>
  onRemoveLearned: (index: number) => void
}) {
  const [transcript, setTranscript] = useState("")
  const [learnState, setLearnState] = useState<"idle" | "busy" | "error">("idle")

  const learn = async () => {
    setLearnState("busy")
    const ok = await onLearn(transcript)
    setLearnState(ok ? "idle" : "error")
    if (ok) setTranscript("")
  }

  return (
    <Sheet open={open} onClose={onClose} title={t.settingsTitle} closeLabel={t.close}>
      <div className="space-y-9">
        <section>
          <SectionLabel>{t.interfaceLang}</SectionLabel>
          <Segmented
            value={uiLang}
            options={[
              { value: "fr", label: "Français" },
              { value: "en", label: "English" },
            ]}
            onChange={onUiLang}
          />
        </section>

        <section>
          <SectionLabel>{t.hostSection}</SectionLabel>
          {!ai && <p className="mb-3 rounded-2xl bg-[var(--ava-ink)]/[0.05] px-4 py-3 text-sm text-[var(--ava-ink)]/60">{t.noAi}</p>}
          <p className="mb-2 text-sm text-[var(--ava-ink)]/85">{t.followUps}</p>
          <Segmented
            value={ai ? host.followUps : 0}
            options={[
              { value: 0, label: t.followUpsOff },
              { value: 1, label: "1" },
              { value: 2, label: "2" },
            ]}
            onChange={(v) => ai && onHost({ followUps: v })}
          />
          <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-[var(--ava-line)]">
            <Toggle label={t.handsFree} checked={host.handsFree} onChange={(v) => onHost({ handsFree: v })} />
            <p className="-mt-1 text-xs leading-relaxed text-[var(--ava-ink)]/50">{t.handsFreeHint}</p>
            {host.handsFree && (
              <>
                <p className="mb-2 mt-4 text-sm text-[var(--ava-ink)]/85">{t.patience}</p>
                <Segmented
                  full
                  value={host.patience}
                  options={[
                    { value: "fast", label: t.patienceFast },
                    { value: "normal", label: t.patienceNormal },
                    { value: "patient", label: t.patiencePatient },
                  ]}
                  onChange={(v) => onHost({ patience: v })}
                />
              </>
            )}
            {!host.handsFree && (
              <>
                <p className="mb-2 mt-4 text-sm text-[var(--ava-ink)]/85">{t.autoAdvance}</p>
                <Segmented
                  value={host.autoAdvance}
                  options={[
                    { value: 0, label: t.autoAdvanceOff },
                    { value: 8, label: `8 ${t.seconds}` },
                    { value: 12, label: `12 ${t.seconds}` },
                  ]}
                  onChange={(v) => onHost({ autoAdvance: v })}
                />
              </>
            )}
          </div>
          <div className="mt-4 divide-y divide-[var(--ava-ink)]/[0.06]">
            <div className="pb-2">
              <Toggle label={t.nudges} checked={host.nudges} onChange={(v) => onHost({ nudges: v })} />
              <p className="-mt-1 text-xs text-[var(--ava-ink)]/45">{t.nudgesHint}</p>
            </div>
            <Toggle label={t.captions} checked={host.videoCaptions} onChange={(v) => onHost({ videoCaptions: v })} />
            <Toggle label={t.practice} checked={host.practice} onChange={(v) => onHost({ practice: v })} />
          </div>
        </section>

        <section>
          <SectionLabel>{t.styleSection}</SectionLabel>
          <p className="text-sm leading-relaxed text-[var(--ava-ink)]/60">{fill(t.styleCore, { n: TECHNIQUES.length })}</p>

          <p className="mb-2 mt-5 text-sm font-semibold text-[var(--ava-ink)]">{t.learnedMoves}</p>
          {learned.length === 0 ? (
            <p className="text-sm text-[var(--ava-ink)]/45">{t.learnedEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {learned.map((m, i) => (
                <li key={`${m.name}-${i}`} className="flex items-start gap-3 rounded-2xl bg-[var(--ava-ink)]/[0.05] p-3">
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-[var(--ava-ink)]">{m.name}</p>
                    <p className="mt-0.5 text-[var(--ava-ink)]/55">{m.how}</p>
                    <p className="mt-1 italic text-[var(--ava-crimson)]/80">« {m.example} »</p>
                  </div>
                  <button
                    type="button"
                    aria-label={t.remove}
                    onClick={() => onRemoveLearned(i)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ava-ink)]/50 hover:bg-[var(--ava-ink)]/[0.08]"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {ai && (
            <div className="mt-5 rounded-2xl bg-[var(--ava-ink)]/[0.04] p-4 ring-1 ring-[var(--ava-ink)]/[0.06]">
              <p className="text-sm font-semibold text-[var(--ava-ink)]">{t.learnTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ava-ink)]/50">{t.learnHint}</p>
              <textarea
                rows={5}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t.learnPlaceholder}
                className={cx(inputCls, "mt-3 resize-none text-sm")}
              />
              {learnState === "error" && <p className="mt-2 text-xs text-[var(--ava-crimson-deep)]">{t.learnError}</p>}
              <Button className="mt-3" disabled={transcript.trim().length < 400 || learnState === "busy"} onClick={() => void learn()}>
                <Sparkles size={16} className={learnState === "busy" ? "animate-pulse" : undefined} />
                {learnState === "busy" ? t.learning : t.learnButton}
              </Button>
            </div>
          )}
        </section>

        <section>
          <SectionLabel>{t.voiceSection}</SectionLabel>
          <p className={voice === "cloned" ? "text-sm text-[#147A4B]" : "text-sm text-[var(--ava-crimson)]/90"}>
            {voice === "cloned" ? t.voiceCloned : t.voiceBrowser}
          </p>
          <Button variant="secondary" className="mt-3" onClick={onTestVoice}>
            <Volume2 size={16} />
            {t.testVoice}
          </Button>
        </section>

        <section>
          <SectionLabel>{t.lookSection}</SectionLabel>
          <div className="mb-5 flex justify-center">
            <AvatarPreview look={look} portrait={portrait} avatarStyle={avatarStyle} size={avatarStyle === "orb" ? 72 : 110} speaking />
          </div>
          <Segmented
            full
            value={avatarStyle}
            options={[
              { value: "orb", label: t.styleOrb },
              { value: "photo", label: t.stylePhoto },
              { value: "illustration", label: t.styleIllustration },
            ]}
            onChange={onAvatarStyle}
          />
          {avatarStyle === "photo" && (
            <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--ava-line)]">
              <p className="text-sm text-[var(--ava-ink)]/65">{t.photoHint}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[var(--ava-ink)] px-5 text-sm font-medium text-[var(--ava-cream)]">
                  {portrait ? t.portrait : t.addPhoto}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onPortrait(e.target.files?.[0])} />
                </label>
                {portrait && (
                  <button type="button" className="text-sm text-[var(--ava-ink)]/60 underline underline-offset-4" onClick={onClearPortrait}>
                    {t.remove}
                  </button>
                )}
              </div>
            </div>
          )}
          {avatarStyle === "illustration" && (
          <div className="mt-5 grid gap-5">
            <Swatches label={t.skin} colors={SKINS} value={look.skin} onChange={(c) => onLook({ skin: c })} />
            <Swatches label={t.hairColor} colors={HAIRS} value={look.hair} onChange={(c) => onLook({ hair: c })} />
            <div>
              <SectionLabel>{t.hairStyle}</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onLook({ hairStyle: h })}
                    className={
                      look.hairStyle === h
                        ? "min-h-10 rounded-full bg-[var(--ava-ink)] px-4 text-sm font-semibold text-[var(--ava-cream)]"
                        : "min-h-10 rounded-full bg-[var(--ava-ink)]/[0.06] px-4 text-sm text-[var(--ava-ink)]/75 hover:bg-[var(--ava-ink)]/[0.1]"
                    }
                  >
                    {t.hair[h]}
                  </button>
                ))}
              </div>
            </div>
            <Swatches label={t.outfit} colors={OUTFITS} value={look.outfit} onChange={(c) => onLook({ outfit: c })} />
            <Swatches label={t.accent} colors={ACCENTS} value={look.accent} onChange={(c) => onLook({ accent: c })} />
            <div className="divide-y divide-[var(--ava-ink)]/[0.06]">
              <Toggle label={t.glasses} checked={look.glasses} onChange={(v) => onLook({ glasses: v })} />
              <Toggle label={t.earrings} checked={look.earrings} onChange={(v) => onLook({ earrings: v })} />
            </div>
          </div>
          )}
        </section>

        <section>
          <SectionLabel>{t.memorySection}</SectionLabel>
          <p className="text-sm text-[var(--ava-ink)]/55">{t.memoryHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onExport}>
              {t.memoryExport}
            </Button>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[var(--ava-ink)]/[0.08] px-5 text-sm font-semibold hover:bg-[var(--ava-ink)]/[0.14]">
              {t.memoryImport}
              <input type="file" accept="application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
            </label>
            {episodesCount > 0 && (
              <Button variant="danger" onClick={onClearMemory}>
                {t.memoryClear}
              </Button>
            )}
          </div>
        </section>
      </div>
    </Sheet>
  )
}
