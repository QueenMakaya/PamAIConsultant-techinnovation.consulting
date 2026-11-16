"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import {
  AVAILABILITY,
  GOALS,
  MRC_CHOICES,
  MRC_HINTS,
  ONLINE_PRESENCE,
  normalizeEmail,
  normalizePhone,
  normalizePostalCode,
  normalizeWebsite,
  suggestEmailFix,
  tidyName,
} from "@/lib/lead-quality"

type Step = "form" | "review" | "sending" | "sent" | "error"

type Values = {
  name: string
  company: string
  email: string
  phone: string
  city: string
  mrc: string
  postalCode: string
  website: string
  services: string
  presence: string[]
  goal: string
  availability: string
  heardFrom: string
  message: string
  consentContact: boolean
  website2: string
}

const EMPTY: Values = {
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "",
  mrc: "",
  postalCode: "",
  website: "",
  services: "",
  presence: [],
  goal: "",
  availability: "Peu importe",
  heardFrom: "",
  message: "",
  consentContact: false,
  website2: "",
}

const FIELD_LABELS: Record<string, string> = {
  name: "Prénom et nom",
  company: "Nom de l'entreprise",
  email: "Courriel",
  phone: "Téléphone",
  city: "Ville",
  mrc: "MRC",
  postalCode: "Code postal",
  website: "Site web",
  services: "Ce que fait votre entreprise",
  presence: "Présence en ligne",
  goal: "Objectif principal",
  consentContact: "Consentement",
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25 aria-[invalid=true]:border-destructive"

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {error ? (
        <span className="text-xs font-normal text-destructive">{error}</span>
      ) : hint ? (
        <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}

/** Normalizes every contact field; returns the cleaned values and one message per bad field. */
function check(v: Values): { clean: Values; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const name = tidyName(v.name)
  if (!/\S\s+\S/.test(name)) errors.name = "Inscrivez votre prénom et votre nom."
  if (v.company.trim().length < 2) errors.company = "Inscrivez le nom de votre entreprise."
  const email = normalizeEmail(v.email)
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) errors.email = "Ce courriel n'a pas un format valide."
  const phone = normalizePhone(v.phone)
  if (!phone) errors.phone = "Inscrivez un numéro à 10 chiffres, par exemple 450 555-1234."
  if (v.city.trim().length < 2) errors.city = "Inscrivez la ville de votre entreprise."
  if (!v.mrc) errors.mrc = "Choisissez votre MRC."
  const postalCode = normalizePostalCode(v.postalCode)
  if (!postalCode) errors.postalCode = "Format attendu : J6W 1A1."
  const website = v.website.trim() ? normalizeWebsite(v.website) : ""
  if (website === null) errors.website = "Cette adresse web n'est pas valide. Laissez vide si vous n'avez pas de site."
  if (v.services.trim().length < 3) errors.services = "Décrivez votre activité en quelques mots."
  if (v.presence.length === 0) errors.presence = "Cochez au moins une case (ou « Aucune »)."
  if (!v.goal) errors.goal = "Choisissez votre objectif principal."
  if (!v.consentContact) errors.consentContact = "Votre accord est nécessaire pour que je puisse vous répondre."
  return {
    clean: {
      ...v,
      name,
      company: v.company.trim(),
      email,
      phone: phone ?? v.phone,
      city: v.city.trim(),
      postalCode: postalCode ?? v.postalCode,
      website: website ?? v.website,
      services: v.services.trim(),
    },
    errors,
  }
}

export default function ConsultationLanding() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<Step>("form")
  const [campaign, setCampaign] = useState("lanaudiere")

  // Read UTM tags after mount so the page itself stays server-rendered.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tags = [params.get("utm_source"), params.get("utm_campaign")].filter(Boolean)
    if (tags.length) setCampaign(["lanaudiere", ...tags].join(" / "))
  }, [])

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((cur) => ({ ...cur, [key]: value }))
  const emailFix = suggestEmailFix(normalizeEmail(values.email))

  function togglePresence(item: string) {
    setValues((cur) => {
      if (item === "Aucune") return { ...cur, presence: cur.presence.includes(item) ? [] : [item] }
      const rest = cur.presence.filter((p) => p !== "Aucune")
      return { ...cur, presence: rest.includes(item) ? rest.filter((p) => p !== item) : [...rest, item] }
    })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { clean, errors: found } = check(values)
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`f-${Object.keys(found)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setValues(clean)
    setStep("review")
    document.getElementById("demande")?.scrollIntoView({ behavior: "smooth" })
  }

  async function send() {
    setStep("sending")
    try {
      const res = await fetch("/api/consultation-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, campaign, confirmed: true }),
      })
      if (res.ok) return setStep("sent")
      const data = (await res.json().catch(() => null)) as { fields?: string[] } | null
      if (res.status === 400 && data?.fields?.length) {
        setErrors(Object.fromEntries(data.fields.map((f) => [f, "À corriger."])))
        return setStep("form")
      }
      setStep("error")
    } catch {
      setStep("error")
    }
  }

  const recap: [string, string][] = [
    ["Prénom et nom", values.name],
    ["Entreprise", values.company],
    ["Courriel", values.email],
    ["Téléphone", values.phone],
    ["Ville", `${values.city} (${values.mrc})`],
    ["Code postal", values.postalCode],
    ["Site web", values.website || "Aucun"],
    ["Présence en ligne", values.presence.join(", ")],
    ["Objectif", values.goal],
    ["Disponibilité", values.availability],
  ]

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-5">
        <a href="/" className="font-display text-lg font-bold">
          Tech Innovation <span className="text-primary">Consulting</span>
        </a>
        <a href="#demande" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Réserver mon heure
        </a>
      </header>

      {/* Hero */}
      <section className="py-8 sm:py-14">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
          Pour les PME de Lanaudière · Gratuit, sans engagement
        </p>
        <h1 className="max-w-3xl font-display text-4xl leading-tight font-bold text-balance sm:text-5xl">
          Une heure pour remettre votre présence en ligne au travail.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Je suis Pamela Alfred, consultante établie à Terrebonne. En une heure, on regarde ensemble votre page
          Facebook, votre Instagram, votre fiche Google et votre site. Vous repartez avec trois actions concrètes à
          faire ce mois-ci, que vous travailliez avec moi ensuite ou non.
        </p>
        <a
          href="#demande"
          className="mt-7 inline-block rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground"
        >
          Réserver ma consultation gratuite
        </a>
        <ul className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["1 heure", "En visio ou au téléphone, à l'heure qui vous convient."],
            ["3 actions concrètes", "Un résumé écrit envoyé après l'appel, à garder."],
            ["0 $", "Aucune carte de crédit, aucune obligation de continuer."],
          ].map(([title, body]) => (
            <li key={title} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-display text-xl font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Offer */}
      <section className="grid gap-6 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-9 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Et si vous voulez déléguer</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Forfait Réseaux sociaux Essentiel</h2>
          <p className="mt-3 text-muted-foreground">
            Vous me donnez l'information, je prépare tout, vous approuvez en un clic, c'est publié. Pas besoin d'y
            penser entre deux clients.
          </p>
          <ul className="mt-5 grid gap-2.5 text-sm">
            {[
              "8 publications par mois, sur Facebook et Instagram",
              "Textes et visuels préparés pour vous, aux couleurs de votre entreprise",
              "Un lien privé pour approuver ou demander un ajustement, depuis votre téléphone",
              "Programmation et mise en ligne faites pour vous",
              "Un rapport mensuel simple : ce qui a fonctionné, ce qu'on ajuste",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden className="mt-0.5 font-bold text-primary">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-background p-6 text-center shadow-sm">
          <p className="font-display text-5xl font-bold">250 $</p>
          <p className="mt-1 text-sm text-muted-foreground">par mois, taxes en sus</p>
          <p className="mt-4 text-sm text-muted-foreground">
            On en parle seulement si ça vous intéresse. La consultation reste gratuite dans tous les cas.
          </p>
        </div>
      </section>

      {/* Form */}
      <section id="demande" className="mt-10 scroll-mt-6 rounded-3xl border border-border bg-card p-5 sm:p-9">
        {step === "sent" ? (
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Merci {values.name.split(" ")[0]}, c'est bien reçu.</h2>
            <p className="mt-3 text-muted-foreground">
              Je vous écris d'ici un jour ouvrable à <strong className="text-foreground">{values.email}</strong> pour
              fixer l'heure. Un courriel de confirmation vient de partir : s'il n'arrive pas, vérifiez vos indésirables
              ou écrivez-moi sur{" "}
              <a className="font-semibold text-primary underline" href="https://wa.me/14384554448">
                WhatsApp
              </a>
              .
            </p>
          </div>
        ) : step === "review" || step === "sending" || step === "error" ? (
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Un dernier coup d'œil</h2>
            <p className="mt-2 text-muted-foreground">
              C'est avec ces coordonnées que je vous joindrai. Prenez dix secondes pour les relire.
            </p>
            <dl className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
              {recap.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="font-semibold break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {emailFix && (
              <p className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm">
                Votre courriel se termine d'une façon inhabituelle. Vouliez-vous écrire <strong>{emailFix}</strong> ?{" "}
                <button type="button" className="font-semibold text-primary underline" onClick={() => set("email", emailFix)}>
                  Oui, corriger
                </button>
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={send}
                disabled={step === "sending"}
                className="rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
              >
                {step === "sending" ? "Envoi…" : "Tout est exact, envoyer"}
              </button>
              <button
                type="button"
                onClick={() => setStep("form")}
                disabled={step === "sending"}
                className="rounded-full border border-border px-6 py-3.5 text-base font-semibold"
              >
                Corriger
              </button>
            </div>
            {step === "error" && (
              <p className="mt-4 text-sm text-destructive">
                L'envoi n'a pas fonctionné. Réessayez dans un instant ou écrivez-moi à pam@techinnovation.consulting.
              </p>
            )}
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Réservez votre heure</h2>
            <p className="mt-2 text-muted-foreground">Deux minutes à remplir. Je lis chaque demande moi-même.</p>
            <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Prénom et nom *" error={errors.name}>
                <input id="f-name" className={inputCls} aria-invalid={!!errors.name} autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Nom de l'entreprise *" error={errors.company} hint="Le nom affiché sur votre enseigne ou votre page Facebook.">
                <input id="f-company" className={inputCls} aria-invalid={!!errors.company} autoComplete="organization" value={values.company} onChange={(e) => set("company", e.target.value)} />
              </Field>
              <Field label="Courriel *" error={errors.email}>
                <input id="f-email" type="email" inputMode="email" className={inputCls} aria-invalid={!!errors.email} autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
                {emailFix && !errors.email && (
                  <span className="text-xs font-normal">
                    Vouliez-vous écrire <strong>{emailFix}</strong> ?{" "}
                    <button type="button" className="font-semibold text-primary underline" onClick={() => set("email", emailFix)}>
                      Corriger
                    </button>
                  </span>
                )}
              </Field>
              <Field label="Téléphone *" error={errors.phone} hint="10 chiffres, cellulaire de préférence.">
                <input
                  id="f-phone"
                  type="tel"
                  inputMode="tel"
                  className={inputCls}
                  aria-invalid={!!errors.phone}
                  autoComplete="tel"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => set("phone", normalizePhone(values.phone) ?? values.phone)}
                />
              </Field>
              <Field label="Ville de l'entreprise *" error={errors.city}>
                <input id="f-city" className={inputCls} aria-invalid={!!errors.city} autoComplete="address-level2" value={values.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label="MRC *" error={errors.mrc} hint={values.mrc ? MRC_HINTS[values.mrc as keyof typeof MRC_HINTS] : undefined}>
                <select id="f-mrc" className={inputCls} aria-invalid={!!errors.mrc} value={values.mrc} onChange={(e) => set("mrc", e.target.value)}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {MRC_CHOICES.map((m) => (
                    <option key={m} value={m}>
                      {m} ({MRC_HINTS[m]})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Code postal de l'entreprise *" error={errors.postalCode}>
                <input
                  id="f-postalCode"
                  className={inputCls}
                  aria-invalid={!!errors.postalCode}
                  autoComplete="postal-code"
                  maxLength={7}
                  placeholder="J6W 1A1"
                  value={values.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                  onBlur={() => set("postalCode", normalizePostalCode(values.postalCode) ?? values.postalCode)}
                />
              </Field>
              <Field label="Site web" error={errors.website} hint="Laissez vide si vous n'en avez pas.">
                <input id="f-website" inputMode="url" className={inputCls} aria-invalid={!!errors.website} autoComplete="url" placeholder="www.monentreprise.ca" value={values.website} onChange={(e) => set("website", e.target.value)} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Que fait votre entreprise ? *" error={errors.services}>
                  <input id="f-services" className={inputCls} aria-invalid={!!errors.services} maxLength={600} placeholder="Ex. salon de coiffure, restaurant, entrepreneur en rénovation" value={values.services} onChange={(e) => set("services", e.target.value)} />
                </Field>
              </div>

              <fieldset id="f-presence" className="sm:col-span-2">
                <legend className="mb-2 text-sm font-medium">Où êtes-vous présent en ligne aujourd'hui ? *</legend>
                <div className="flex flex-wrap gap-2">
                  {ONLINE_PRESENCE.map((item) => {
                    const on = values.presence.includes(item)
                    return (
                      <button
                        type="button"
                        key={item}
                        aria-pressed={on}
                        onClick={() => togglePresence(item)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
                {errors.presence && <p className="mt-1.5 text-xs text-destructive">{errors.presence}</p>}
              </fieldset>

              <Field label="Votre objectif principal *" error={errors.goal}>
                <select id="f-goal" className={inputCls} aria-invalid={!!errors.goal} value={values.goal} onChange={(e) => set("goal", e.target.value)}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {GOALS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <Field label="Meilleur moment pour l'appel">
                <select className={inputCls} value={values.availability} onChange={(e) => set("availability", e.target.value)}>
                  {AVAILABILITY.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </Field>
              <Field label="Comment avez-vous entendu parler de moi ?">
                <input className={inputCls} maxLength={200} value={values.heardFrom} onChange={(e) => set("heardFrom", e.target.value)} />
              </Field>
              <Field label="Une précision à ajouter ?">
                <input className={inputCls} maxLength={2000} value={values.message} onChange={(e) => set("message", e.target.value)} />
              </Field>

              {/* Honeypot */}
              <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={values.website2} onChange={(e) => set("website2", e.target.value)} />

              <label id="f-consentContact" className="flex gap-3 text-sm sm:col-span-2">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={values.consentContact} onChange={(e) => set("consentContact", e.target.checked)} />
                <span>
                  J'accepte que Tech Innovation Consulting me contacte par courriel ou par téléphone au sujet de cette
                  demande. *
                  {errors.consentContact && <span className="block text-xs text-destructive">{errors.consentContact}</span>}
                </span>
              </label>

              <div className="sm:col-span-2">
                {Object.keys(errors).length > 0 && (
                  <p className="mb-3 text-sm text-destructive">
                    À corriger : {Object.keys(errors).map((k) => FIELD_LABELS[k] ?? k).join(", ")}.
                  </p>
                )}
                <button type="submit" className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground sm:w-auto">
                  Continuer
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      <footer className="mt-12 text-xs leading-relaxed text-muted-foreground">
        <p>
          Tech Innovation Consulting, Terrebonne (Québec). Vos renseignements servent uniquement à répondre à votre
          demande et sont traités selon la Loi 25. Pour y accéder ou les faire supprimer, écrivez à
          pam@techinnovation.consulting.
        </p>
      </footer>
    </main>
  )
}
