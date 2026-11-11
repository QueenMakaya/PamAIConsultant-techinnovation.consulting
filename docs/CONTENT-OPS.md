# Content Ops: one process for every business

Every business (clients and Pam's own ventures) follows the same validation
flow. The code reads a **registry** in Airtable; adding a business is a row in
that registry, not a code change.

| Piece | Where |
|---|---|
| Registry (one row per business) | Airtable base **Content Ops · Registre des entreprises** (`appd1aIODMuFi1tWO`, table `Entreprises`) |
| Standard template to duplicate | Airtable base **MODÈLE · Client Hub standard (à dupliquer)** (`appXoH0aRrW85c83e`) |
| Client validation portal | `/validation?token=<jeton>` |
| Admin dashboard | `/validation/admin?key=<ADMIN_TOKEN>` |
| Daily automation | `/api/automations/daily` (Vercel Cron, 12:00 UTC = 7 h / 8 h Montréal) |
| Code | `lib/content-ops/*` |

## The standard flow

`Statut production`: **Idée → À produire → Prêt → Programmé → Publié** (or **Annulé**)

`Validation client`: **À valider → Approuvé / À ajuster** (or **Rejeté**)

- The portal shows every post that is not Programmé / Publié / Annulé.
  "Masquer en retard" in the registry also hides posts whose date has passed.
- The client clicks Approuvé or À ajuster (+ comment). Both are written back
  to Airtable.
- À ajuster → Pam gets an email right away.
- Approuvé → the post shows on the dashboard under "approuvées à programmer"
  until it is scheduled (Metricool) and its status moves to Programmé.

## Adding a business (≈ 5 minutes, no code)

1. In Airtable, duplicate **MODÈLE · Client Hub standard** (Duplicate base,
   with no records) and rename it "<Business> — Client Hub".
2. Copy the new base ID (`app…`) and the `Calendrier` table ID (`tbl…`) from
   the URL.
3. Add a row in the **registry**: Entreprise, Slug, Type, Actif ✓, Base ID,
   Table ID, a **Jeton portail** (any long random string), Approbateur,
   Courriel approbateur, Rappels courriel ✓.
4. If the Airtable token is limited to specific bases, add the new base to it
   (airtable.com/create/tokens).
5. Send the **Lien portail** column to the approver. It appears on the
   dashboard within a minute.

A base that doesn't use the standard field names still works: fill in
**Correspondance champs** with one line per field, for example
`approval = Validation Marye`. Keys: `title, date, channel, format, caption,
hashtags, link, visuals, status, approval, comment`. Common variants (English
names, "Titre / Sujet", "Canal", "Visuel", …) are already recognised in
`lib/content-ops/standard.ts`.

If the approval options are spelled differently (e.g. `✅ Approuvé`,
`Approved` / `Needs changes`), fill in **Libellé Approuvé** and
**Libellé À ajuster**.

## Automatic emails

| When | Who | What |
|---|---|---|
| Monday | each approver with posts awaiting a decision | one digest + portal button |
| Other days | each approver | reminder only when an undecided post is due within 3 days |
| Immediately | Pam (`NOTIFY_EMAIL`) | client clicked "À ajuster" |
| Every morning with something to do | Pam | changes requested, approved posts to schedule, overdue posts, unreadable bases |

Preview without sending (nothing is sent unless `&send=1`):
`/api/automations/daily?key=<ADMIN_TOKEN>` (add `&monday=1` to simulate a Monday).

## Vercel environment variables

| Variable | Purpose |
|---|---|
| `AIRTABLE_TOKEN` | already set; must also have access to the registry base |
| `ADMIN_TOKEN` | long random string; key of the admin dashboard |
| `CRON_SECRET` | long random string; Vercel Cron sends it automatically |
| `RESEND_API_KEY` | resend.com API key (domain verified) |
| `EMAIL_FROM` | e.g. `Pam · Tech Innovation <pam@techinnovation.consulting>` |
| `NOTIFY_EMAIL` | Pam's inbox for internal alerts |
| `SITE_URL` | optional, defaults to `https://techinnovation.consulting` |

The old per-client variables (`CHAFRIC_VALIDATION_TOKEN`, …) stay in place:
the registry's **Variable jeton (ancien)** column points to them so links
already sent keep working. If the registry is unreachable, the portal falls
back to the original 8 businesses.
