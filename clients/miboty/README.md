# Miboty: onboarding note

Social-media automation client of Tech Innovation Consulting, starting November 2026.
Client contact: **CUMBA** (contact@miboty.com).

| | |
|---|---|
| Brand file | [`BRAND.md`](./BRAND.md) (draft, pending CUMBA's confirmation) |
| Brand assets | [`brand/`](./brand/), still to be supplied |
| November 2026 calendar | [`calendar-2026-11.md`](./calendar-2026-11.md) (review copy; Airtable is the source of truth) |
| Airtable | **Miboty — Client Hub** `appO6uZiL4CL9qvqs`: https://airtable.com/appO6uZiL4CL9qvqs |
| Validation page | `https://techinnovation.consulting/validation?token=<MIBOTY_VALIDATION_TOKEN>` |

## Airtable base

Three tables, cloned from the Studio IAM Beauté Client Hub structure and wired
like CHAFRIC:

1. **Calendrier**: one row = one post on one platform. The validation page
   reads this table. Starts at `À produire` / `À valider`.
2. **Onboarding**: the 26-item kit Miboty provides (handles, access, palette,
   logo, ingredient lists, promos, photos/video), with due dates.
3. **Collecte mensuelle**: the monthly content-collection form, adapted to a
   product brand. The November row is pre-created (`Envoyé à CUMBA`).

## Go-live checklist

- [ ] Make sure the site's Airtable token (`AIRTABLE_TOKEN` in Vercel) can access
      **Miboty — Client Hub**. If it's a personal access token limited to
      specific bases, add this base to it.
- [ ] Create a random token, set `MIBOTY_VALIDATION_TOKEN` in Vercel
      (Production), redeploy, then send CUMBA the validation link.
- [ ] Open a Form view on **Collecte mensuelle** and send it to CUMBA. Forms can't
      be created through the API.
- [ ] Get the Onboarding "Urgent" items back first: social handles + access,
      palette/fonts, logo, HD product photos, and the November promos (due Nov 13).

## Open questions for CUMBA

- The three social handles, plus access to each account
- Official colours and fonts (the site's look like Shopify Refresh defaults)
- Approval of the voice and any banned wording
- Preferred CTA: « Achetez maintenant » vs « Acheter maintenant »
- November promos (Black Friday Nov 27, Cyber Monday Nov 30)
- Whether real photos or video are coming, and when
- Substantiation for « sans perturbateurs endocriniens »
