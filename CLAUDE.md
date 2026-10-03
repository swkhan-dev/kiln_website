# Kiln & Crust — website

One-page marketing site for Kiln & Crust, a wood-fired pizzeria in East Austin, TX.
Audience: locals and date nights. Tone: warm, smoky, confident.

## Stack

- Plain HTML + CSS + vanilla JS. **No framework, no build step, no npm dependencies.** Keep it that way.
- One serverless function, `api/reserve.js`, sends reservation requests by email via the Resend REST API.
  It targets Vercel's Node runtime (`export default function handler(req, res)`, Node 18+ global `fetch`).
- Fonts from Google Fonts; photos hotlinked from Unsplash (`images.unsplash.com`).

## Files

```
index.html         All page markup and copy (sections in order: hero, menu, story, gallery, reviews, FAQ, visit)
css/styles.css     All styles; design tokens live in :root at the top
js/main.js         Menu rendering, header/mobile nav, scroll reveal, reservation form
data/menu.js       THE menu: dishes, descriptions, prices, tags. Sets window.MENU
api/reserve.js     POST /api/reserve -> validates -> emails restaurant (+ guest confirmation) via Resend
assets/logo-mark.svg  Oven-arch + flame mark (also the favicon)
.env.example       Env vars the reservation function needs
```

## Common edits

- **Prices / dishes:** edit `data/menu.js` only. `price` is a number in dollars; tags are `veg`, `vegan`, `spicy`, `gf`
  (labels in `MENU.tags`). The menu is rendered by `renderMenu()` in `js/main.js` — don't hardcode menu items in HTML.
  It's `.js` rather than `.json` on purpose so the page works opened straight from disk (no fetch/CORS).
- **Hours** appear in three places — keep them in sync:
  1. the hours ticket table in `index.html` (`#visit`)
  2. `SEATING` in `js/main.js` (drives which time slots the form offers; last seating ≈ 1h before close)
  3. the Monday-closed check in `api/reserve.js` (`validate()`)
  Also the hero meta line ("Tue–Sun from 5pm") and the FAQ if relevant.
- **Phone number** lives in `index.html` (several `tel:` links), and `RESTAURANT_PHONE` in `js/main.js`.

## Demo content

All copy is finished demo content — there are no PLACEHOLDER markers left. Before using this for a real business, swap in:
- Address (`1200 E 6th St`), map link, phone `(512) 555-0147` (a fictional 555-01xx number), hours, and the
  `@kilnandcrust` social links / `hello@kilnandcrust.com` email.
- **Reviews** in `#reviews` are invented demo quotes with invented names. On a live site, replace them with real,
  attributable guest reviews — publishing made-up reviews as real ones is deceptive (and an FTC issue).
- Photos are Unsplash stock. Swap for real photos of the restaurant when available (self-host in `assets/`).

## Reservations (Resend)

Flow: form in `#reserve` -> `fetch("/api/reserve")` (JSON) -> `api/reserve.js` -> Resend `POST /emails`.

- Sends a "New table request" email to `RESERVATION_TO` with `reply_to` = guest, so staff confirm by replying.
- Then a best-effort "we got your request" email to the guest (disable with `GUEST_CONFIRMATION=false`).
  It is explicitly *not* a confirmation; there's no availability system.
- Server validates everything again (name, email, optional phone, date not past / ≤60 days / not Monday,
  `H:MM AM|PM` time, party 1–12, notes ≤500) and HTML-escapes user input in emails.
- Honeypot field `company` — if filled, respond 200 and send nothing.
- Env vars: `RESEND_API_KEY`, `RESERVATION_TO`, `RESERVATION_FROM` (must be on a domain verified in Resend;
  until then Resend only delivers to the account owner's address). Never expose the API key client-side.
- No rate limiting yet. If spam becomes a problem, add Vercel's firewall rules or a Turnstile check.

## Running locally

- Static only: `python3 -m http.server 8000` and open http://localhost:8000 (or just open `index.html`).
  The form will show "couldn't reach our booking system" because there's no `/api`.
- With the API: `npm i -g vercel`, copy `.env.example` to `.env.local`, then `vercel dev`.
- Deploy: `vercel` (set the env vars in the Vercel project settings).

## Design system — "Oven mouth after dark"

One committed aesthetic. Don't add a light theme or new accent colors.

- **Palette (tokens in `:root`):** `--soot` #14110F background, `--char` panels, `--ember` #E8622C for primary actions
  and highlights, `--glow` #F4A259 for italic emphasis and prices (sparingly), `--bone` #EFE6D6 text, `--ash` secondary text.
- **Type:** Fraunces (display; heavy, tight tracking, `SOFT 100`, `WONK 1`; italic + `--glow` for the emphasized phrase in
  headlines), Work Sans (body), IBM Plex Mono (eyebrows, prices, hours, labels — the "kitchen ticket" voice, uppercase + tracked).
- **Signature shape:** the oven arch — `.arch` (`border-radius: 999px 999px 6px 6px`) on hero, story, and gallery images.
  It's the only decorative shape; reuse it rather than inventing new ones.
- **Texture:** fixed SVG film grain on `body::after`; ember radial glows only behind the hero arch and the reviews.
- **Hours card** is a cream "kitchen ticket" with perforated edges (CSS mask) — the one light surface on the page.
- **Motion:** `.reveal` fade-up on scroll (IntersectionObserver, only when `<html class="js">`), hero glow flicker.
  Everything is disabled under `prefers-reduced-motion`.
- Primary CTA is always "Reserve a table" (`.btn-ember`, `data-reserve`), linking to `#reserve`.

## Conventions

- Accessibility: semantic sections with `aria-labelledby`, skip link, visible `:focus-visible`, native `<details>` for FAQ,
  real `<label>`s, `aria-live` status on the form, alt text on every photo. Keep contrast at AA on `--soot`.
- Must work at 390px wide with no horizontal scroll; main breakpoint is 900px.
- Copy voice: short, sensory, confident. Mention oak, fire, char, Austin specifics; avoid clichés like "passion" or "authentic".
