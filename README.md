# PulseDJ - Landing Site

A new English-only marketing site for **pulsedj.com**, inspired by the structure and value-led style of OfflineDJ. Plain HTML/CSS/JS - no build step, no framework.

## Run locally

```bash
cd pulsedj-site
python3 -m http.server 4747
open http://localhost:4747
```

Or just open `index.html` directly in a browser (everything is path-relative).

## What's here

```
pulsedj-site/
├── index.html              # Single-page landing
├── css/styles.css          # All styles (~900 lines, no dependencies)
├── js/main.js              # Nav, scroll progress, rotator, stats counter, IO reveal
├── assets/
│   ├── img/
│   │   ├── logo-icon.svg        ← pulled from pulsedj.com (real Pulse logo)
│   │   ├── basic-usage.gif      ← pulled from pulsedj.com (real product GIF)
│   │   ├── testimonial-asic.jpg ← real DJ Asi-C photo
│   │   ├── testimonial-kobimanor.png ← real DJ Kobi Manor photo
│   │   ├── bg-text.png          ← extra brand artwork (unused, kept for variants)
│   │   ├── download-mac.png     ← original download badge (unused, kept for swap-in)
│   │   └── download-win.png     ← original Windows download badge (unused)
│   ├── video/             # Empty - drop product videos here
│   ├── logos/             # Empty - drop Serato/Rekordbox/etc. brand logos here
│   └── platforms/         # Empty - same as above; for raster logos
├── pulsedj-home.png        # Reference screenshot of pulsedj.com (for design comparison)
└── README.md
```

## Sections (top → bottom)

1. **Navbar** - sticky, blurs on scroll, animated red scroll-progress bar at the bottom.
2. **Hero** - rotating headline (`The DJ copilot that knows what's next / reads the room / never blanks out / …`), Mac & Windows download buttons, hero "Quick Overview" placeholder that loads the real PulseDJ YouTube tour on click.
3. **Supported DJ Software** - Serato, Rekordbox, Traktor, VirtualDJ, djay Pro (text logos as placeholders).
4. **How it works** - three numbered steps + a live preview row using the real basic-usage GIF.
5. **Features showcase** - six big alternating rows (Pulse Window, MyStyle, Hot 100, Events & QR, Set Reports, Recommendation modes) - each with placeholder visual cards ready for real screenshots.
6. **Mini feature grid** - eight cards (drag&drop, country tailoring, 8 languages, works offline, Apple Silicon, anonymous data, DJ groups, auto-updates).
7. **Stats** - animated counters for "4,524,475 parties · 407,716,073 song pairings · 373,925 unique tracks".
8. **Testimonials** - DJ Asi-C + DJ Kobi Manor (both real, scraped from pulsedj.com) + one open slot.
9. **Pricing** - single "Beta - $0/month" card listing every feature.
10. **FAQ** - 10 hand-picked questions from the official Pulse FAQ.
11. **End CTA** - second Mac/Windows download row.
12. **Footer** - Product · Resources · Support columns + social row.

## What to replace before launch

The site is fully functional but uses placeholders in a few places. Search/replace these:

| Placeholder | Where | What to put in |
| --- | --- | --- |
| Hero video poster (the GIF) | `index.html` → `.video-placeholder` | Real product hero video URL (currently auto-loads the YouTube `Oa7ZRw8DS-c` tour on click - replace if you have a polished hero clip) |
| Download button URLs | `js/main.js` → `links` object | Real macOS / Windows installer URLs |
| 6 placeholder cards in Features | `index.html` → `.placeholder-card` | Real product screenshots (Pulse Window, MyStyle, Hot 100, Events, Reports, Modes) |
| Supported software text-logos | `index.html` → `.supported-logo` blocks | Drop real SVG/PNG logos into `assets/logos/` and swap the markup for `<img>` tags |
| 3rd testimonial avatar | `index.html` → `.t-avatar-placeholder` | Real photo + quote + IG handle |
| OG image | `<meta property="og:image">` in `index.html` | A real 1200×630 social share card → save to `/assets/img/og.jpg` |

## Brand inspiration

- **Source brand**: pulsedj.com - red/orange accent on dark, Poppins typography, "Pulse" wordmark with a circular icon
- **Layout inspiration**: offlinedj.com - information-rich, value-led sections that walk a DJ through every reason to install, before asking them to install
- **Color palette**:
  - `--accent: #ff4d4d` (Pulse red)
  - `--accent-hot: #ff6b3d` (gradient warm end)
  - `--bg: #0a0a0c` (deep dark)
  - `--text: #f4f4f6`
- **Fonts**: Space Grotesk (display) + Poppins (body)

## Notes

- 100 % English (no language toggle, no Hebrew - different audience).
- No backend required - pure static. Deploy to Netlify, Vercel, Cloudflare Pages, or just `aws s3 sync`.
- Accessibility: keyboard nav works on all CTAs; `prefers-reduced-motion` disables reveal animations.
- Mobile: tested down to 360 px wide; the nav collapses into a hamburger at ≤ 1024 px.
