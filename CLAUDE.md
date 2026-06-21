# Claude Code Instructions — PulseDJ Marketing Site

## What this is

This is a **from-scratch rebuild of the PulseDJ marketing site** (landing page
+ blog + content pages). It is a sister project to the OfflineDJ server, but
they are completely independent:

- Server project: `/Users/djlic-14/Desktop/server/` (app.py, Heroku)
- PulseDJ marketing site: **`/Users/djlic-14/Desktop/pulsedj-site/`** (this folder)

If the user asks to work on "the server", "OfflineDJ", "app.py", "admin panel",
"Heroku", "MongoDB", etc. — switch to the server folder and work there. This
folder has nothing to do with the server.

## Live reference site

The original PulseDJ site is at **https://pulsedj.com/** — that's the source
of truth for content and feature copy. Whenever you change copy or claim a
feature, verify it against the live site first (we do NOT fabricate features).
- Home: https://pulsedj.com/
- About: https://pulsedj.com/aboutus
- FAQ: https://pulsedj.com/faq
- Terms: https://pulsedj.com/terms
- Privacy: https://pulsedj.com/privacy-policy
- Quick guide: https://pulsedj.com/quick-guide
- Blog (separate origin, Framer-hosted): **https://blog.pulsedj.com/**

The live site is an Angular SPA — `curl` returns a 403 / empty shell on most
of these. To scrape content, use Playwright MCP (`browser_navigate` +
`browser_evaluate`) to render and extract. The blog at `blog.pulsedj.com` is
Framer-rendered server-side, so plain `curl` with a regular User-Agent works.

## Project structure

```
pulsedj-site/
├── index.html              # landing page
├── faq.html                # full FAQ (72 questions, scraped from pulsedj.com/faq)
├── about.html              # About (real content from pulsedj.com/aboutus)
├── terms.html              # Terms of Use (verbatim from pulsedj.com/terms)
├── privacy.html            # Privacy Policy (verbatim from pulsedj.com/privacy-policy)
├── quick-guide.html        # Quick guide (rewritten because pulsedj.com/quick-guide is empty)
├── blog.html               # Blog index — black title strip + 2-col Latest/Popular + 3-up Vercel-style archive
├── blog/<slug>.html        # × 24 individual blog posts (scraped from blog.pulsedj.com)
├── css/styles.css          # ONE stylesheet for the whole site (~2700 lines)
├── js/main.js              # Splash, rotator, IntersectionObserver reveal, autoloop videos, smooth-scroll
├── assets/
│   ├── img/                # Logos, brand marks, testimonial photos, faq screenshots, laptop mockup PNG
│   ├── video/              # hero-bg.mp4 (laptop screen), pulse-tour.mp4 (How it works), feature-window.mp4 (Pulse Window row)
│   └── video/*.original.mp4 # Pre-edit backups of any re-encoded video — DO NOT DELETE
└── README.md
```

## Brand identity

| Token | Use |
|---|---|
| **Green `#26f66f`** (Spotify-style) | **Current brand color.** Used for the CTA gradient (`--brand-light #5eff95` → `--brand-deep #15a648`), the hero rotating word, section accents, glows, and the matching `.pulse-window` mockup green. Drives `--brand-rgb: 38, 246, 111`. |
| Neutral warm dark grays (`#0a0a0a` / `#151414` / `#191817`) | Section + card backgrounds. NO blue-purple tint (was specifically removed — feels like "AI slop"). |
| Off-white cream (`#fbfaf6` / `#f4f1ea`) | Light mode — used ONLY on blog pages via `.theme-light` body class. Editorial reading surface. |

**Text on green CTAs**: dark `#06190f` (not white) — white on `--brand-light` was unreadable. Same pattern as `.pw-badge--new`.

**Historical note**: the brand used to be red (`#e8232a`). Every reference to "thin red hairline" / "red accent" in older CSS or notes refers to the previous identity. If you find a hardcoded red value (e.g. `rgba(255,84,90,1)` in a hover ring), it's a leftover — replace with `rgba(var(--brand-rgb), 1)`.

CSS variables that drive this live at the top of `css/styles.css` in the
`:root { }` block and the `.theme-light { }` block.

## Design rules (learned from user feedback)

1. **No hover lifts.** Don't add `transform: translateY(-Npx)` on `:hover`.
   The user explicitly dislikes the bounce — it reads as amateurish. Replace
   with a light-sweep animation, color shift, glow change, or just nothing.
2. **No card-on-card-on-card.** Cards should hug their content. If a video
   has a caption below, the caption is plain text *outside* the bordered
   box, not a dark strip *inside* it.
3. **Real content only.** Never fabricate features, testimonials, stats,
   or copy. If a feature isn't in the live FAQ / About / blog, don't claim
   it on the page. Verify any addition against the source.
4. **Blog feels like a real publication.** Modeled on RA (`ra.co/news`) +
   Vercel (`vercel.com/blog`). No AI-template tropes: no "ISSUE 1 · JUN 2026",
   no giant `wordmark.` with a period, no decorative serif italics.
5. **Splash is restrained.** Logo + name + thin brand-color hairline, ~1s. No
   rings, no orbs, no grids.
6. **Pulse Window mockups are app UI replicas.** Keep their green accents,
   little traffic-light dots, and tabular text exactly as-is — they mimic
   the actual product.

## Assets the user is preparing (waiting for delivery)

The site is being upgraded to use **real screenshots and video from the
Pulse app**, replacing the existing placeholder/mockup-heavy hero and
feature rows. The user said he would record/screenshot these and hand
them off. Until they arrive, keep working with the existing
`assets/video/hero-bg.mp4`, `pulse-tour.mp4`, `feature-window.mp4`, and
the laptop-PNG mockup — don't fabricate or AI-generate substitutes.

### Hero
- `hero-bg.mp4` — 15–25 s, seamless loop, **no audio**. Real Pulse mid-mix
  (track playing, MyStyle on, next-track placard visible). 1920×1080, ≤4 Mbps.
  Rendered behind a laptop PNG, so edges get cropped.

### "How it works" — 3-step tour
- `pulse-tour.mp4` — 45–60 s, no audio preferred. Walks through:
  1. **Connect** rekordbox / Serato / Engine.
  2. **Build** MyStyle (liking/disliking/preset).
  3. **Play** — the next-track pop-up firing mid-mix.
  Cuts + zoom-ins OK; UI labels should stay legible.

### Features — short loop clips (3–6 s each)
| File | Shows |
|---|---|
| `feat-window.mp4` | Pulse Window — floating "next track" panel during play |
| `feat-mystyle.mp4` | Building MyStyle (Liked / Disliked / Style preset) |
| `feat-import.mp4` | One-click import of rekordbox / Engine library |
| `feat-keybpm.mp4` | Filter/sort by Key & BPM compatibility |
| `feat-history.mp4` | "Don't repeat" — what already played tonight |
| `feat-energy.mp4` | Energy / mood curve slider |

All: **MP4, 1280×800 or 1440×900, 3–6 s, seamless loop** (frame 1 = frame
N). No logos overlaid, no in-clip narration text.

### Static screenshots
PNG, **2× retina**, full resolution — I downconvert to WebP/AVIF myself.
| File | Shows |
|---|---|
| `screenshot-main.png` | Pulse home screen, full window (3840×2400 or 2880×1800) |
| `screenshot-mystyle.png` | MyStyle screen with 3–4 liked tracks + preset selected |
| `screenshot-suggestion.png` | Close-up of the next-track suggestion (with reason — matching key, BPM, energy) |
| `screenshot-settings.png` | Settings screen with the DJ software connected |

### FAQ visual aids (optional)
2–3 short GIFs (≤3 s) for the most-asked questions: library import, "I don't like this suggestion" (thumbs down), and the software-connection screen.

### Testimonials
If short DJ clips (10–20 s) exist, send them. Otherwise keep the current photo + quote cards (full-card link to each DJ's Instagram).

### Source-of-truth copy
Before any asset arrives, the user should hand over:
- 5–6 sentence plain description of what Pulse does (his words, not marketing).
- Current supported software list (rekordbox / Serato / Engine / VirtualDJ / Traktor — exact list).
- Free vs paid differences (so the pricing section doesn't drift).

### Handoff & storage
- User drops everything into a single folder on his Mac; he tells me the path.
- I move videos → `assets/video/` and screenshots → `assets/img/screenshots/`.
- **Always keep `<name>.original.mp4` backup** before any re-encode (existing rule).
- I do compression (FFmpeg seamless-loop for video, WebP/AVIF for stills), not the user.

### Priority order (if assets arrive piecemeal)
1. `hero-bg.mp4`
2. `pulse-tour.mp4`
3. 2–3 main feature clips
4. Static screenshots
5. FAQ GIFs

## Dev server

```bash
cd /Users/djlic-14/Desktop/pulsedj-site && python3 -m http.server 8765
```

Then visit `http://localhost:8765/`. The user has historically used port
**4747** for their own server and **8765** for Claude's dev server — both
work. Always cache-bust CSS / video changes when testing via Playwright:

```js
const l = document.querySelector('link[rel=stylesheet][href*="styles.css"]');
l.href = '/css/styles.css?bust=' + Date.now();
```

## Build pipeline for the blog

The blog has 24 posts. Their content comes from a JSON cache at
`/tmp/pulse-blog/blog_data.json` produced by `/tmp/scrape_blog.py`. To
regenerate all 24 post pages + the index, run:

```bash
python3 /tmp/scrape_blog.py   # re-scrapes blog.pulsedj.com (only if content changed)
python3 /tmp/build_blog.py    # writes blog.html + blog/<slug>.html
```

Both scripts live in `/tmp` (not in the repo). If they're gone, recreate
them from previous Claude conversation context — they are small and well-
documented in earlier turns of the conversation history.

## Deployment

This site is NOT deployed automatically — no Heroku, no Vercel, no CDN
wired up yet. The user previews it locally. Changes are git-tracked locally
only.

**The OfflineDJ Heroku server is a DIFFERENT codebase** at
`/Users/djlic-14/Desktop/server/`. `git push heroku master` belongs to
that project, not this one. Never push from this folder.

## Analytics (matches the live pulsedj.com)

Each page already includes:
- Google Analytics: `G-QGX764XNQN`
- Meta Pixel: `594220423750495`

If you create new HTML pages from scratch, copy the analytics block from
any existing page so PageView fires on every route.

## Memory of past iterations (read before redesigning)

The blog, FAQ, and testimonial cards have all gone through multiple rounds
of redesign based on user feedback. Before redoing them, read the relevant
section of `css/styles.css` first to understand what's already been tried,
why earlier versions were rejected, and what the current shape is.

Key historical points:
- Hero: 50/50 grid, MacBook PNG (`assets/img/laptop/macbook-v2.png`) with the
  product video overlaid on its screen rect. Aspect ratio of the laptop
  container is 1072/804; screen rect inside is `top: 24%, left: 19.59%,
  width: 60.82%, height: 50.75%`.
- Hero CTA "Get Pulse - Free" has a left-to-right light-sweep on hover via
  the `.cta-pill::before` pseudo. Do NOT replace with a translateY lift.
- Blog uses a black title strip with a red `⟋` slash mark (RA borrow) and
  pill-tab category nav (Vercel borrow). `.theme-light` body class flips
  the tokens.
- Testimonial cards are full-card `<a>` links to each DJ's Instagram, with
  the DJ's photo as a CSS `background-image` and a dark gradient overlay.
  The whole card is clickable.
- FAQ uses `<details>` accordions. A bug history: the IntersectionObserver
  `threshold` is `0` (not `0.1`) because the FAQ section is so tall that
  10% of it never fits on screen at once and the reveal animation would
  permanently keep the questions hidden.
