# Brand — Folashade (Folashade Wax, Montréal)

Derived on 17 Nov 2026 from the logo and the live site (folashadewax.com).
Not yet confirmed by Solange: update this file when she sends her official
brand files.

## Colors
- Primary:   #C95629  terracotta (sampled from the logo; backgrounds, numbers, CTA)
- Shade:     #9E3F1C  dark terracotta (small labels on cream, for contrast)
- Tint:      #F1DCCD  sand (italic accents and labels on dark or terracotta)
- Ink/text:  #1A1512
- Background/surface: #FBF7F2 cream
- Exception: the "Rouge ou vert?" story keeps a red (#B3261E) and green (#1F6B4F)
  split because the colours are the question. Nowhere else.

## Typography
- Headline font: DM Serif Display (regular, italic for the second line of a hook)
- Body font:     Inter (400 / 600 / 700). Inter is also the body font of the site.

## Logo
- Files: brand/logo-terracotta.png (original from the site), brand/logo-cream.png,
  brand/logo-ink.png (recoloured from the same file).
- "FS" monogram, wordmark FOLASHADE, tagline "Elegance in simplicity".
- Placement: full lockup on cover and closing slides; wordmark alone in the
  footer of inner slides; monogram alone at the top of Stories.
- Source file is only 431 px wide: do not show it wider than about 300 px until a
  vector or high-resolution version is received.

## Voice & tone
- In 3 words: warm, proud, simple
- Do: tutoiement, Québec French, wax worn every day in Montréal
- Don't: codes or jargon, "Africa" as one place

## Default on-image language
- Primary: French

## Audience
- Who: women (and families) in Montréal who wear or gift wax, largely from West
  and Central African diasporas, plus Montrealers discovering the fabric
- Where: Instagram @folashade_off, Facebook, folashadewax.com

## Standing conversion objective
- Sales (online boutique), with education posts for saves

## Publishing rules (set by Pam, 27 Nov 2026)
- Instagram: Stories and Reels only. No feed posts, no carousels on the IG grid.
- Every Instagram Story also goes out as a Facebook Post and a Facebook Story.
- And vice versa: anything planned as a Facebook post also goes out as an
  Instagram Story (and Facebook Story).
- Reels: Instagram Reel + Facebook Reel.
- Formats: design everything 1080 × 1920 (9:16) first. A 4:5 carousel made
  for Facebook needs a 9:16 version before it can go to Stories.
- Stories carry no caption: put the offer, price and "lien en bio" on the image.
  The Facebook post carries the caption.
- Photos from the Panorama shoot (Sept. 2026): always tag the model
  @clemente_paris.

## Visual do/don't
- Motif: concentric wax circles, tonal terracotta only
- Photos: real pieces, worn (waiting on Solange's photos)
- Avoid: multi-colour patterns, more than one accent colour

## Rebuilding the visuals
`visuals/build.py` writes the HTML pages and `visuals/shot.js` renders them to PNG
(needs `npm i @fontsource/dm-serif-display @fontsource/inter playwright`, and the
logo crops `mono*.png`, `word*.png`, `full*.png` cut from the files in `brand/`).
