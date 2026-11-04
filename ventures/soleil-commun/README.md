# Soleil Commun: launch playbook

Pam's own revenue venture, launched 2026-11-04. **Soleil Commun** is a working
name (step 01 in Airtable: check the REQ and the domain before printing anything).

**One-line model:** a Quebec solar community that educates homeowners honestly,
captures quote requests online, and refers them to licensed (RBQ) installers
for a commission. Product affiliate links bring in side revenue while installs ripen.

| | |
|---|---|
| Airtable | **Soleil Commun — Business Hub (solaire Québec)** `app9VN2Psgpctl9dE`: https://airtable.com/app9VN2Psgpctl9dE |
| Landing page + estimator | `https://techinnovation.consulting/solaire` (code: `app/solaire/`, `lib/solar-estimate.ts`) |
| Lead API | `POST /api/solar-lead` → Airtable `Leads` (`app/api/solar-lead/route.ts`) |
| Content approval | `https://techinnovation.consulting/validation?token=<SOLAIRE_VALIDATION_TOKEN>` |
| Brand | [`BRAND.md`](./BRAND.md) |
| Partner outreach + referral terms | [`partner-outreach.md`](./partner-outreach.md) |
| Email nurture sequence | [`email-sequence.md`](./email-sequence.md) |
| Launch calendar (review copy) | [`calendar-2026-11.md`](./calendar-2026-11.md) |

## 1. Why now, and the facts we stand on

- **Hydro-Québec subsidy (LogisVert, solar measure, announced 2026-04-02):**
  $1,000 per installed kW, capped at 40 % of eligible costs. New panels bought
  in Quebec, installed on or after 2025-06-30 by an RBQ-licensed contractor,
  grid connection authorised by Hydro-Québec, claim within 9 months of install.
  Houses, semis, row houses, plexes of 19 units or fewer, chalets and mobile
  homes qualify; **condos and larger buildings don't.**
- **Market size:** Hydro-Québec's Action Plan 2035 targets solar on **more than
  125,000 customers' homes** and 3,000 MW of solar overall by 2035. The
  "100,000 homes" figure you heard is likely an earlier or rounded version of
  that target; quote 125,000 and cite the Action Plan.
- **The honest catch:** Quebec power is cheap (~8.5 ¢/kWh blended), so payback
  without a battery is often 15–20 years. The estimator says so out loud.
  That honesty is the brand: the OPC, RBQ and Hydro-Québec issued a joint
  warning (2026-04-30) about sellers using "savings" and "subsidy" pretexts.
  We are the trustworthy voice in a market full of pushy sellers.

Re-check every number on hydroquebec.com before any paid ad goes out.

## 2. Business model

| Stream | How it pays | Target terms to negotiate | When it starts |
|---|---|---|---|
| Installer referrals | Fee per **signed** contract | $500–$1,000 per residential install, or 3–5 % of contract; paid within 30 days of install | Month 2–4 (1–3-month sales cycle) |
| Qualified-lead fee (optional) | Fee per qualified lead delivered | $50–$150 per lead, only with partners who refuse success fees | Month 1–2 |
| Product affiliation | % of online sales | Portable power stations, balcony kits, EV chargers (Amazon.ca and brand programs) | Week 2 |
| Later: sponsored content / lives | Flat fee from partners | $250–$500 per sponsored live once the group passes 2,000 members | Month 6+ |

**Unit economics (targets, not promises):** 1,000 landing visits → 4 % leave a
request = 40 leads → 50 % qualified = 20 → 25 % sign = **5 installs ≈ $4,500/month**
at $900 average. The lever is traffic to `/solaire`, which is what the
community and content are for.

## 3. Compliance guardrails (non-negotiable)

1. **Zero door-to-door, 100 % inbound.** Itinerant selling is tightly regulated
   in Quebec (Consumer Protection Act s. 244.7, OPC permit). We never sell;
   the homeowner requests the visit. Every referral agreement forbids partners
   from unsolicited home visits on our leads.
2. **We are not an installer.** Only RBQ-licensed partners quote and install.
   Check each licence on the RBQ registry before activating a partner.
3. **Law 25:** explicit consent to share with up to 3 partners is built into the
   form; publish a privacy policy and name Pam as the person in charge.
4. **CASL:** newsletter is opt-in only (separate checkbox), one-click unsubscribe.
5. **Disclosure:** the page and every affiliate post say we may earn a commission.
6. **No invented numbers:** testimonials only with written consent; savings
   always shown as estimates with assumptions.

Validate items 1, 3 and the referral agreement with a lawyer (Airtable step 03).

## 4. How it runs by itself (automation map)

```
Content  : content-calendar skill → Airtable Calendrier → brand-post-visuals (Canva)
           → /validation (Pam approves) → Metricool schedules IG / FB / TikTok
Community: posts + FB Group "Solaire au Québec — entre voisins" → link to /solaire
Leads    : /solaire estimator → form → /api/solar-lead → Airtable Leads (auto score,
           auto "Qualifié" at ≥ 60) → Airtable automation emails Pam
           → (after agreements) automation emails the regional partner
Nurture  : leads with newsletter consent → Mailchimp 5-email welcome sequence
Money    : Lead "Signé" → Commissions row → monthly invoice → "Payé"
Reporting: weekly scheduled summary (leads, qualified, signed, commissions, top posts)
```

Same stack as the client accounts, so nothing new to learn: Airtable is the
source of truth, `/validation` is the approval gate, Metricool publishes.

### What is live after this session

- [x] Airtable Business Hub with 5 tables (Calendrier, Leads, Partenaires,
      Commissions, Lancement) and a 21-step launch checklist
- [x] `/solaire` page: estimator, lead form with consent, honeypot, UTM tracking
- [x] `/api/solar-lead` writing scored leads to Airtable
- [x] Soleil Commun registered as a `/validation` client
- [x] 20-post launch calendar (Nov 9 – Dec 6) in Airtable, `À valider`
- [x] Airtable automation "Nouveau lead solaire → alerte courriel à Pam" (saved as a draft: turn it on at https://airtable.com/app9VN2Psgpctl9dE/wflpStcS061cTzdQL)
- [ ] Your 4 go-live actions below

### Pam's go-live actions (about 30 minutes)

1. Merge the branch `claude/modest-ptolemy-kw2ox6` so `/solaire` deploys.
2. Airtable → Builder hub → Personal access tokens: add the base
   **Soleil Commun — Business Hub** to the token stored as `AIRTABLE_TOKEN` in
   Vercel (read + write records).
3. Vercel → Environment Variables (Production): add `SOLAIRE_VALIDATION_TOKEN`
   (any long random string), redeploy, open `/validation?token=…`.
4. Create the Instagram, TikTok, Facebook page and Facebook Group, then add
   them to Metricool as a new brand.

## 5. 90-day plan

| Weeks | Focus | Exit criteria |
|---|---|---|
| 1–2 (Nov 4–17) | Name, accounts, page live, first 10 posts, partner list | Page live, 15 partners listed, 5 contacted |
| 3–6 (Nov 18 – Dec 15) | Partner meetings, 3 referral agreements, FB Group to 300 members, first live | 3 active partners, 30 leads |
| 7–13 (Dec 16 – Feb 2) | Winter content (batteries, outages, spring-install planning), small Meta ad test ($10/day to `/solaire`) | 100 leads, first signed contracts, CPL known |

Spring is the install season: winter is for building the list so it converts
in March–June.

## 6. KPIs (weekly report)

Group members · landing visits · leads · % qualified · leads sent to partners ·
signed · installed · commissions billed / paid · cost per lead (once ads run) ·
top 3 posts by saves and shares.
