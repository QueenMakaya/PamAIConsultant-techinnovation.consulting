"use client"

import { Volume2 } from "lucide-react"
import type { AvatarLook, HairStyle, Lang } from "@/lib/studio/types"
import type { UiCopy } from "../copy"
import { Button, SectionLabel, Segmented, Sheet, Swatches, Toggle } from "../ui"
import AvatarPreview from "./AvatarPreview"

export type HostSettings = {
  followUps: number
  autoAdvance: number
  captions: boolean
  autoLayout: boolean
  practice: boolean
}

const SKINS = ["#F1C7A5", "#D9A47A", "#B97A4E", "#8D5524", "#6B3E1F", "#4A2912"]
const HAIRS = ["#1B1410", "#3B2416", "#6B3E1F", "#A0522D", "#C9A227", "#8E8E8E"]
const OUTFITS = ["#B5822B", "#003219", "#7A1F3D", "#1F3A5F", "#E07A5F", "#F4EBD9"]
const ACCENTS = ["#F2C14E", "#E07A5F", "#2A9D8F", "#FAF6EE", "#C1121F", "#7B2CBF"]
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
  portrait,
  onPortrait,
  onClearPortrait,
  onTestVoice,
  episodesCount,
  onExport,
  onImport,
  onClearMemory,
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
  portrait: string | null
  onPortrait: (file: File | undefined) => void
  onClearPortrait: () => void
  onTestVoice: () => void
  episodesCount: number
  onExport: () => void
  onImport: (file: File | undefined) => void
  onClearMemory: () => void
}) {
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
          {!ai && <p className="mb-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-sm text-[#F7F3EA]/60">{t.noAi}</p>}
          <p className="mb-2 text-sm text-[#F7F3EA]/85">{t.followUps}</p>
          <Segmented
            value={ai ? host.followUps : 0}
            options={[
              { value: 0, label: t.followUpsOff },
              { value: 1, label: "1" },
              { value: 2, label: "2" },
            ]}
            onChange={(v) => ai && onHost({ followUps: v })}
          />
          <p className="mb-2 mt-5 text-sm text-[#F7F3EA]/85">{t.autoAdvance}</p>
          <Segmented
            value={host.autoAdvance}
            options={[
              { value: 0, label: t.autoAdvanceOff },
              { value: 8, label: `8 ${t.seconds}` },
              { value: 12, label: `12 ${t.seconds}` },
            ]}
            onChange={(v) => onHost({ autoAdvance: v })}
          />
          <div className="mt-4 divide-y divide-white/[0.06]">
            <Toggle label={t.captions} checked={host.captions} onChange={(v) => onHost({ captions: v })} />
            <Toggle label={t.autoLayout} checked={host.autoLayout} onChange={(v) => onHost({ autoLayout: v })} />
            <Toggle label={t.practice} checked={host.practice} onChange={(v) => onHost({ practice: v })} />
          </div>
        </section>

        <section>
          <SectionLabel>{t.voiceSection}</SectionLabel>
          <p className={voice === "cloned" ? "text-sm text-[#9BE8BE]" : "text-sm text-[#F2C14E]/90"}>
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
            <AvatarPreview look={look} portrait={portrait} size={120} />
          </div>
          <div className="grid gap-5">
            <Swatches label={t.skin} colors={SKINS} value={look.skin} onChange={(c) => onLook({ skin: c })} />
            <Swatches label={t.hairColor} colors={HAIRS} value={look.hair} onChange={(c) => onLook({ hair: c })} />
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#F7F3EA]/45">{t.hairStyle}</p>
              <div className="flex flex-wrap gap-2">
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onLook({ hairStyle: h })}
                    className={
                      look.hairStyle === h
                        ? "min-h-10 rounded-full bg-[#F7F3EA] px-4 text-sm font-semibold text-[#14110A]"
                        : "min-h-10 rounded-full bg-white/[0.06] px-4 text-sm text-[#F7F3EA]/75 hover:bg-white/[0.1]"
                    }
                  >
                    {t.hair[h]}
                  </button>
                ))}
              </div>
            </div>
            <Swatches label={t.outfit} colors={OUTFITS} value={look.outfit} onChange={(c) => onLook({ outfit: c })} />
            <Swatches label={t.accent} colors={ACCENTS} value={look.accent} onChange={(c) => onLook({ accent: c })} />
            <div className="divide-y divide-white/[0.06]">
              <Toggle label={t.glasses} checked={look.glasses} onChange={(v) => onLook({ glasses: v })} />
              <Toggle label={t.earrings} checked={look.earrings} onChange={(v) => onLook({ earrings: v })} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-white/[0.08] px-5 text-sm font-semibold hover:bg-white/[0.14]">
                {t.portrait}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onPortrait(e.target.files?.[0])} />
              </label>
              {portrait && (
                <button type="button" className="text-sm text-[#F7F3EA]/60 underline underline-offset-4" onClick={onClearPortrait}>
                  {t.portraitRemove}
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          <SectionLabel>{t.memorySection}</SectionLabel>
          <p className="text-sm text-[#F7F3EA]/55">{t.memoryHint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onExport}>
              {t.memoryExport}
            </Button>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-white/[0.08] px-5 text-sm font-semibold hover:bg-white/[0.14]">
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
