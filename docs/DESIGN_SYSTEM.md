# FINESE AI — Design System

> Instrument, not chat wrapper. Measurement & verification as visual language.

## Color — semantic, not decorative

| Token | Light (HSL) | Dark (HSL) | Role |
|---|---|---|---|
| `--surface` | 210 12% 97% cool paper | 210 24% 7% | App background |
| `--ink` | 210 30% 9% | 210 12% 94% | Primary text — blue-graphite |
| `--verified` | 176 68% 30% deep teal | 176 55% 42% | *Exclusively* server-verified numbers, Verified badges, tool traces |
| `--estimated` | 36 70% 42% muted ochre | 36 60% 52% | *Exclusively* LLM-estimated/unverified — always dashed border |
| `--accent` | 176 45% 42% | 176 45% 42% | Interactive, links, focus rings (same family as verified) |
| `--critical` | 8 62% 45% brick red | 8 62% 48% | Destructive, drift alerts |
| `--chart-1..5` | teal → slate ramp | teal → slate | Data series derived from verified |

Rules:
- Teal solid = verified computation. Ochre dashed = provisional.
- Never use verified color for decoration; never use estimated solid fill.
- Chart palette derived from verified, not rainbow.

## Type

- **UI & prose**: Inter only (400/500/600/700/800). DM Sans and Syne removed.
- **Measured numbers**: JetBrains Mono — every verified statistic, table cell, badge value renders in mono. Mono *means* “from compute”.

## Layout

- Centered chat `max-w-[800px]` retained for familiarity.
- **Evidence rail** — right-hand collapsible panel (300px, mono) listing tool calls + args in real time. Structural, not footnote. Collapsed to 40px strip with count.
- `AppShell`: sidebar | chat(centered) | evidence rail | changelog drawer.

## Motion

- One deliberate animation: `verifiedIn` (scale + border dash→solid) when a Verified badge resolves.
- Respect `prefers-reduced-motion` — all animations disabled under that query.
- No hover-transition-on-everything.

## Badges

- Verified: solid teal `bg—verified/15`, mono, `● Verified · real compute`, rounded-full, `animate-verified-in`.
- Estimated: ochre dashed, `⚠ Estimated · AI-generated`.
- Offline preview: ochre dashed, `◐ Offline preview · local`, `_offlinePreview` flag.

## Accessibility

- `focus-visible` ring follows `--ring` (teal).
- AA contrast on muted-foreground already fixed.
- `aria-live` on chat log; evidence rail not aria-hidden.
