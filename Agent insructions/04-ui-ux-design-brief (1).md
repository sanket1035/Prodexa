# 04 — UI/UX Design Brief

## Design Principle
This is a tool a founder uses the night before launch — it should feel like **Linear, Vercel's dashboard, or a Bloomberg terminal**, not a generic "AI startup" landing page. Explicitly avoid the default purple-to-blue gradient / glowing-orb aesthetic that every AI product currently uses — it reads as templated, not as a serious analytical tool. Score data and hard numbers are the hero, not decorative gradients.

## Aesthetic Direction
Minimal, dense-information, dark-mode-first. Think financial dashboard crossed with a developer tool. Flat surfaces, hairline borders, no glow/blur effects, no glassmorphism.

## Color Palette
| Role | Color | Hex |
|---|---|---|
| Background (base) | Near-black graphite, not pure black | `#0B0C0E` |
| Surface (cards) | Charcoal | `#16181B` |
| Surface (elevated/hover) | `#1E2124` |
| Border / hairline | Low-contrast gray | `#2A2D31` |
| Primary text | Off-white | `#EDEDEF` |
| Secondary text | Muted gray | `#8B8F97` |
| Accent (single, used sparingly) | Burnt amber | `#D97B3F` |
| Success / high score | Muted sage green | `#5FA88A` |
| Warning / medium | Ochre | `#C9A44C` |
| Critical / low score | Muted brick red | `#C25A4D` |
| Info / neutral badge | Slate blue-gray (not bright blue) | `#6E7B8B` |

Rationale: one warm accent (amber) instead of the default purple/blue signals "professional analysis tool" rather than "AI chatbot." Severity colors are desaturated, not neon, so the dashboard reads as calm and credible under demo lighting.

## Typography
- **UI / headings**: Inter — clean, neutral, excellent at small sizes for dense dashboards
- **Numerals / scores**: Geist Mono or IBM Plex Mono for all score numbers, percentages, and metrics — monospace numerals make score changes ("62% → 84%") feel precise and data-driven rather than decorative
- **Body copy**: Inter, 14–15px base
- Heading scale: H1 28px / H2 20px / H3 16px, all medium weight (500), never bold-heavy — restraint over shouting

## Component Style
- Sharp-ish corners: 6px border radius throughout (not the default 16px+ "friendly AI app" rounding)
- Flat cards with a 1px hairline border (`#2A2D31`) — no drop shadows, no glow
- Radial score progress: thin ring (4px stroke), animated count-up on load, color mapped to severity palette above
- Severity badges: small pill, background at 12% opacity of the severity color, text at full color — not solid-fill loud badges
- Buttons: solid amber for primary actions only ("Validate Product", "Copy Fix"); everything else is ghost/outline style to keep the accent meaningful

## Dark / Light Mode
Dark mode is primary and the only mode required for the hackathon demo. If time allows post-hackathon, light mode inverts to a warm off-white (`#FAFAF8`) background — never pure white, to avoid the sterile-SaaS look.

## Key UI Patterns
- **Dashboard grid**: overall score (large radial, top-left) + 6 category score cards in a responsive grid (3 columns desktop, 1 column mobile)
- **Progress tracker**: vertical list with a moving indicator dot, current module in full brightness, completed modules dimmed with a checkmark, upcoming modules at 40% opacity
- **Issue list**: table-like rows, not cards — severity badge, title, category tag, "Copy Fix" ghost button right-aligned
- **Score history**: single-line Recharts line chart, amber line on graphite background, no gridlines except a faint baseline

## Reference Apps
Linear (information density + restraint), Vercel dashboard (dark mode + monospace numerals), Raycast (flat surfaces, no glow), Bloomberg Terminal (data-first, not decoration-first) — explicitly NOT: generic "AI SaaS" template sites with purple gradients and floating orb illustrations.

## Mobile
Fully responsive. Sidebar collapses to a top bar with a hamburger menu. Score cards stack to single column. Laptop remains the primary demo device — mobile just needs to not break.

## Accessibility
- All text meets WCAG AA contrast against its background (verify amber-on-graphite and severity colors specifically, since desaturated palettes can under-contrast — target 4.5:1 minimum for body text)
- Score changes communicated via text ("↑ 22%") in addition to color, never color alone
- All interactive elements keyboard-navigable; visible focus ring in amber, 2px
