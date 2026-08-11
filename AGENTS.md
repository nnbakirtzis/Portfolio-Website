# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) and/or Cursor IDE when working with code in this repository.

## Commands

No build system, package manager, or test suite. The site is three static files served as-is.

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

Deployment is a plain static host (GitHub Pages / Netlify / Vercel) — whatever is on `main` is what ships.

## Architecture

Single-page portfolio: `index.html` + `styles.css` + `script.js`, plus `assets/profile.jpg`. All libraries load from CDNs via `<script>`/`<link>` tags — there is no bundler and no module system, so `script.js` is one top-level script relying on globals (`Lenis`, `gsap`, `ScrollTrigger`, `THREE`).

CDN dependencies (pinned versions, in `index.html`):
- Google Fonts: Space Grotesk (headings) + Inter (body)
- Lenis 1.0.42 — loaded in `<head>` (needed before `DOMContentLoaded`)
- GSAP 3.12.5 + ScrollTrigger, Three.js 0.158.0 — loaded before `script.js` at end of `<body>`

### Visual layering (z-index stack)

Order matters; several fixed-position overlays sit behind the content:

| z-index | Element |
|---|---|
| 0 | `#vanta-bg` (Three.js canvas), `body::before` (masked grid lines) |
| 1 | `.noise-overlay` (inline SVG turbulence), `.code-overlay` (typewriter snippet) |
| 2 | `main` |
| 10 | `.nav-shell` |
| 9999 | `.cursor` / `.cursor-dot` |

`#vanta-bg` is a legacy id — Vanta.js was replaced by a hand-rolled Three.js particle field (`initParticleBackground`), but the id and the README's "Vanta.js NET" description were never updated. The README is stale on this point.

### script.js structure

Top-to-bottom, no framework. Distinct concerns, each guarded by a null/feature check:

1. Nav toggle, sticky-nav `is-scrolled` class, footer year
2. `sectionObserver` — IntersectionObserver mapping `main section[id]` to `.nav__links a` for the `is-active` dot
3. Code overlay typewriter — `codeSnippets` array cycled character-by-character via `setTimeout`
4. `initParticleBackground` — 600-point Three.js field, upward drift with wraparound, camera lerps toward mouse; runs on `load`
5. On `DOMContentLoaded`: Lenis instance driven by `gsap.ticker`, `ScrollTrigger.batch` for scroll reveals, hero entrance timeline, `.section__header` parallax
6. Custom cursor — ring lerps toward the pointer, dot tracks it directly; gated on `(hover: hover) and (pointer: fine)`

### Reveal animations

Elements opt in with `data-scroll-reveal`; `ScrollTrigger.batch` animates them from `{opacity:0, y:40, scale:0.97}` on enter, `once: true`, `start: 'top 88%'`. Adding the attribute to new markup is all that's needed.

Gotcha: `data-scroll-delay="120"` appears throughout `index.html` but **nothing reads it** — it's left over from a pre-GSAP IntersectionObserver implementation, and stagger now comes from `ScrollTrigger.batch`'s `stagger: 0.08`. Don't add it to new markup, and don't assume it does anything.

Because the initial hidden state is set by GSAP rather than CSS, the page degrades gracefully with JS disabled — everything stays visible. Keep it that way: don't move `opacity: 0` into `styles.css`.

### Reduced motion

Handled in two places that must stay in sync:
- `script.js` — `prefersReducedMotion` short-circuits the particle field, Lenis, and all GSAP blocks; the code overlay renders `codeSnippets[0]` statically. A `change` listener re-syncs only the code animation, so toggling the OS setting live will not start/stop Lenis or GSAP (a full reload does).
- `styles.css` — `@media (prefers-reduced-motion: reduce)` neutralizes transitions and forces `[data-scroll-reveal] { opacity: 1 !important; transform: none !important; }` as the safety net.

## Design system

Tokens live in `:root` in `styles.css`. Background `#080b14`, accent cyan `#00d4ff`, violet `#7c6af7`.

Dark glass card pattern, repeated on `.hero__intro`, `.hero__card`, `.about__story`, `.about__meta`, `.skills-card`, `.timeline__item`, `.project-card`, `.contact__card`, `.contact__info` — match it exactly when adding a surface:

```css
background: var(--color-surface);            /* rgba(13,17,27,0.75) */
backdrop-filter: blur(20px) saturate(120%);
border: 1px solid var(--color-border);
box-shadow: var(--shadow-subtle);
/* :hover, :focus-within */
border-color: var(--color-border-accent);
box-shadow: var(--shadow-glow-cyan), var(--shadow-soft);
transform: translate3d(0, -6px, 0) scale(1.005);
```

Any new hover transform must also be neutralized in the `prefers-reduced-motion` block, which lists affected selectors explicitly.

Typography: Space Grotesk for `h1`–`h3`; Inter for body; monospace stack (`'JetBrains Mono', 'Fira Code', 'SF Mono'`) for eyebrows, labels, and tags. Note JetBrains Mono is **not** loaded from Google Fonts — it only renders for users who have it installed locally, everyone else falls back down the stack. Add it to the fonts `<link>` if that matters.

Futuristic detail prefixes are pure CSS `::before` content — `.hero__eyebrow` gets `"> "`, `.about__meta-label` gets `"// "`. `.section__header` uses a cyan `border-left`, never a glass background.

## Content

The markup is a template with real content partially filled in. HTML comments (`<!-- Replace with... -->`) mark placeholders that are still generic — several project cards, the experience bullets, and the "Based in" location are template text rather than the owner's real details. Treat those comments as TODO markers, and remove a comment when you fill in the content it guards.

The "Download Resume" / "View resume" buttons link to `#resume`, which is the `.timeline` container id — there is no actual resume file in the repo.
