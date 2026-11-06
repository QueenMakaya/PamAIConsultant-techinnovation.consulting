"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  ASSUMPTIONS,
  HOUSING_TYPES,
  INTERESTS,
  ORIENTATION_FACTOR,
  REGIONS,
  TIMELINES,
  estimate,
} from "@/lib/solar-estimate"

const NAVY = "#1B2A3A"
const SUN = "#F2A516"
const LEAF = "#2F7D5B"

const money = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n)
const num = (n: number) => new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 1 }).format(n)

type Status = "idle" | "sending" | "sent" | "error"

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-[#1B2A3A]/60">{hint}</span> : null}
    </label>
  )
}

const inputCls =
  "w-full rounded-xl border border-[#1B2A3A]/20 bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-[#F2A516] focus:ring-2 focus:ring-[#F2A516]/30"

export default function SolarLanding() {
  // Read UTM tags after mount (not via useSearchParams) so the page is fully
  // server-rendered: search engines and link previews see the real content.
  const [source, setSource] = useState("")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSource([params.get("utm_source"), params.get("utm_campaign")].filter(Boolean).join(" / "))
  }, [])

  const [bill, setBill] = useState(2400)
  const [orientation, setOrientation] = useState("Sud")
  const [housing, setHousing] = useState<string>("Unifamiliale")
  const [status, setStatus] = useState<Status>("idle")
  const [interests, setInterests] = useState<string[]>(["Panneaux solaires"])

  const est = useMemo(() => estimate(bill, orientation, housing), [bill, orientation, housing])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setStatus("sending")
    try {
      const res = await fetch("/api/solar-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone") || "",
          city: form.get("city") || "",
          postalCode: form.get("postalCode") || "",
          region: form.get("region"),
          housing,
          owner: form.get("owner") === "oui",
          annualBill: bill,
          orientation,
          timeline: form.get("timeline"),
          interests,
          message: form.get("message") || "",
          source,
          consentContact: form.get("consentContact") === "on",
          consentNewsletter: form.get("consentNewsletter") === "on",
          website: form.get("website") || "",
        }),
      })
      setStatus(res.ok ? "sent" : "error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="inline-block h-7 w-7 rounded-full" style={{ background: SUN }} />
          <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-fraunces), serif" }}>
            Solfutur
          </span>
        </div>
        <a href="#estimation" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: NAVY }}>
          Mon estimation
        </a>
      </header>

      {/* Hero */}
      <section className="grid gap-8 py-8 sm:py-14 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: LEAF }}>
            Le solaire, vérifié · Solar, verified
          </p>
          <h1
            className="text-4xl leading-tight font-semibold sm:text-5xl"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Le solaire au Québec, expliqué entre voisins.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[#1B2A3A]/80">
            Hydro-Québec subventionne maintenant les panneaux solaires résidentiels. On vous aide à savoir si ça vaut
            la peine chez vous, avec des chiffres honnêtes, et on vous met en contact avec des installateurs licenciés
            RBQ. Gratuit, sans engagement, et jamais de porte-à-porte.
          </p>
        </div>
        <div className="rounded-3xl p-6 text-white shadow-lg" style={{ background: NAVY }}>
          <p className="text-sm text-white/70">Subvention Hydro-Québec (LogisVert, volet solaire)</p>
          <p className="mt-1 text-4xl font-semibold" style={{ fontFamily: "var(--font-fraunces), serif", color: SUN }}>
            1 000 $ / kW
          </p>
          <p className="mt-2 text-sm text-white/80">jusqu'à 40 % des coûts admissibles</p>
          <hr className="my-5 border-white/15" />
          <p className="text-sm text-white/80">
            Pour les maisons, jumelés, plex de 19 logements et moins et chalets. Installation par une entreprise
            licenciée RBQ, raccordement autorisé par Hydro-Québec, demande dans les 9 mois suivant l'installation.
          </p>
          <p className="mt-3 text-xs text-white/60">Vérifiez toujours les conditions à jour sur hydroquebec.com.</p>
        </div>

        {/* Promises: pill badges, not links. 3 across from tablet up, stacked on phones. */}
        <ul className="grid gap-3 sm:grid-cols-3 md:col-span-2">
          {[
            "Estimation et subvention instantanées",
            "Installateurs vérifiés RBQ",
            "Aucune visite sans votre demande",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center justify-center gap-2.5 rounded-full bg-white px-4 py-3 text-center text-sm lg:whitespace-nowrap lg:text-[15px] font-semibold shadow-sm ring-1 ring-[#1B2A3A]/10"
            >
              <span
                aria-hidden
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white"
                style={{ background: LEAF }}
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Estimator */}
      <section id="estimation" className="scroll-mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#1B2A3A]/10 sm:p-8">
        <h2 className="text-2xl font-semibold sm:text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Votre estimation en 30 secondes
        </h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="grid gap-5">
            <Field label={`Facture Hydro-Québec annuelle : ${money(bill)}`} hint="Total des 12 derniers mois, taxes incluses">
              <input
                type="range"
                min={600}
                max={8000}
                step={100}
                value={bill}
                onChange={(e) => setBill(Number(e.target.value))}
                className="w-full accent-[#F2A516]"
              />
            </Field>
            <Field label="Type d'habitation">
              <select className={inputCls} value={housing} onChange={(e) => setHousing(e.target.value)}>
                {HOUSING_TYPES.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </Field>
            <Field label="Orientation principale du toit">
              <select className={inputCls} value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                {Object.keys(ORIENTATION_FACTOR).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            <Stat label="Système suggéré" value={`${num(est.systemKw)} kW`} />
            <Stat label="Production / an" value={`${num(est.productionKwh)} kWh`} />
            <Stat label="Coût avant aide" value={money(est.grossCost)} />
            <Stat
              label="Subvention estimée"
              value={est.subsidyEligible ? money(est.subsidy) : "Non admissible"}
              accent
            />
            <Stat label="Économie / an" value={money(est.yearlySavings)} />
            <Stat label="Retour sur investissement" value={est.paybackYears == null ? "—" : `~${est.paybackYears} ans`} />
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-[#1B2A3A]/60">
          Estimation indicative, pas une soumission. Hypothèses : {num(ASSUMPTIONS.pricePerKwh * 100)} ¢/kWh,{" "}
          {ASSUMPTIONS.kwhPerKwSouth} kWh/kW/an plein sud, {money(ASSUMPTIONS.costPerKw)}/kW installé, système visant{" "}
          {ASSUMPTIONS.targetOffset * 100} % de votre consommation. Au Québec l'électricité est peu chère, alors le
          retour est souvent long : on préfère vous le dire franchement. La batterie, l'autonomie lors des pannes et la
          hausse des tarifs peuvent changer le calcul ; un installateur le précisera chez vous.
          {!est.subsidyEligible && " Les condos et grands immeubles ne sont pas admissibles au volet solaire résidentiel."}
        </p>
      </section>

      {/* Lead form */}
      <section className="mt-10 rounded-3xl p-5 sm:p-8" style={{ background: "#FCEBC7" }}>
        <h2 className="text-2xl font-semibold sm:text-3xl" style={{ fontFamily: "var(--font-fraunces), serif" }}>
          Recevez jusqu'à 3 soumissions d'installateurs vérifiés
        </h2>
        <p className="mt-2 text-[#1B2A3A]/80">On lit chaque demande. Réponse sous 2 jours ouvrables.</p>

        {status === "sent" ? (
          <div className="mt-6 rounded-2xl bg-white p-6">
            <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-fraunces), serif" }}>
              Merci, c'est reçu ☀️
            </p>
            <p className="mt-2 text-[#1B2A3A]/80">
              On vous écrit sous 2 jours ouvrables. D'ici là, rejoignez la communauté pour poser vos questions à des
              propriétaires qui ont déjà fait le saut.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet *">
              <input name="name" required minLength={2} className={inputCls} autoComplete="name" />
            </Field>
            <Field label="Courriel *">
              <input name="email" type="email" required className={inputCls} autoComplete="email" />
            </Field>
            <Field label="Téléphone">
              <input name="phone" type="tel" className={inputCls} autoComplete="tel" />
            </Field>
            <Field label="Ville">
              <input name="city" className={inputCls} autoComplete="address-level2" />
            </Field>
            <Field label="Code postal">
              <input name="postalCode" className={inputCls} autoComplete="postal-code" maxLength={7} />
            </Field>
            <Field label="Région *">
              <select name="region" required className={inputCls} defaultValue="">
                <option value="" disabled>
                  Choisir…
                </option>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Êtes-vous propriétaire ? *">
              <select name="owner" required className={inputCls} defaultValue="oui">
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </Field>
            <Field label="Quand aimeriez-vous installer ? *">
              <select name="timeline" required className={inputCls} defaultValue="3-6 mois">
                {TIMELINES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>

            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium">Ce qui vous intéresse</legend>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const on = interests.includes(i)
                  return (
                    <button
                      type="button"
                      key={i}
                      aria-pressed={on}
                      onClick={() => setInterests((cur) => (on ? cur.filter((x) => x !== i) : [...cur, i]))}
                      className="rounded-full border px-3.5 py-1.5 text-sm transition"
                      style={{
                        background: on ? NAVY : "white",
                        color: on ? "white" : NAVY,
                        borderColor: on ? NAVY : "rgba(27,42,58,.2)",
                      }}
                    >
                      {i}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="sm:col-span-2">
              <Field label="Une question ou une précision ?">
                <textarea name="message" rows={3} className={inputCls} maxLength={2000} />
              </Field>
            </div>

            {/* Honeypot */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

            <label className="flex gap-3 text-sm sm:col-span-2">
              <input type="checkbox" name="consentContact" required className="mt-1 h-4 w-4 accent-[#2F7D5B]" />
              <span>
                J'accepte que Solfutur me contacte et transmette ma demande à un maximum de 3 installateurs
                partenaires de ma région, uniquement pour me préparer une soumission. *
              </span>
            </label>
            <label className="flex gap-3 text-sm sm:col-span-2">
              <input type="checkbox" name="consentNewsletter" className="mt-1 h-4 w-4 accent-[#2F7D5B]" />
              <span>Je veux recevoir les conseils et nouvelles de la communauté (désabonnement en un clic).</span>
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-full px-6 py-3.5 text-base font-semibold text-[#1B2A3A] transition disabled:opacity-60 sm:w-auto"
                style={{ background: SUN }}
              >
                {status === "sending" ? "Envoi…" : "Recevoir mes soumissions gratuites"}
              </button>
              {status === "error" && (
                <p className="mt-3 text-sm text-red-700">
                  Oups, l'envoi n'a pas fonctionné. Réessayez dans un instant ou écrivez-nous.
                </p>
              )}
            </div>
          </form>
        )}
      </section>

      {/* Trust + disclosure */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Zéro porte-à-porte", "On ne cogne jamais à votre porte. Un installateur vient seulement si vous le demandez."],
          ["Installateurs vérifiés", "Licence RBQ vérifiée, avis clients lus, admissibilité LogisVert confirmée."],
          ["Transparence", "Notre service est gratuit pour vous : l'installateur choisi nous verse une commission de référencement."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl bg-white p-5 ring-1 ring-[#1B2A3A]/10">
            <p className="font-semibold">{title}</p>
            <p className="mt-1.5 text-sm text-[#1B2A3A]/75">{body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-12 text-xs leading-relaxed text-[#1B2A3A]/60">
        <p>
          Solfutur (Énergie Solfutur) est un service de référencement indépendant opéré par Tech Innovation Consulting. Nous ne sommes
          ni Hydro-Québec ni un installateur, et nous ne vendons pas d'équipement. Les liens vers certains produits
          peuvent être des liens d'affiliation. Vos renseignements sont traités selon la Loi 25 ; pour y accéder ou les
          faire supprimer, écrivez-nous.
        </p>
      </footer>
    </main>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: accent ? "#E3F1EA" : "#F6F1E7" }}>
      <p className="text-xs text-[#1B2A3A]/65">{label}</p>
      <p
        className="mt-1 text-xl font-semibold"
        style={{ fontFamily: "var(--font-fraunces), serif", color: accent ? LEAF : NAVY }}
      >
        {value}
      </p>
    </div>
  )
}
