---
name: KNOuX SmartOrganizer
description: A midnight-graphite Windows maintenance console where every number is provably local.
colors:
  ground: "#08090f"
  surface: "#111320"
  surface-raised: "#171a2a"
  surface-hover: "#20233a"
  violet: "#a855f7"
  violet-bright: "#c4a6ff"
  violet-deep: "#8b3dff"
  indigo: "#5b5ff8"
  ink: "#f7f5ff"
  ink-muted: "#a6a5bd"
  hairline: "#2b2d45"
  verified-teal: "#5ee1a5"
  caution-amber: "#ffc56d"
  fault-rose: "#ff7890"
  data-blue: "#79b8ff"
typography:
  display:
    fontFamily: '"Segoe UI Variable", "Segoe UI", Tahoma, Arial, sans-serif'
    fontSize: "28px"
    fontWeight: 800
    lineHeight: "1.06"
    letterSpacing: "-0.9px"
  title:
    fontFamily: '"Segoe UI Variable", "Segoe UI", Tahoma, Arial, sans-serif'
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "1.2"
  body:
    fontFamily: '"Segoe UI Variable", "Segoe UI", Tahoma, Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.55"
  label:
    fontFamily: '"Segoe UI Variable", "Segoe UI", Tahoma, Arial, sans-serif'
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "1.3"
    letterSpacing: "0.9px"
  metric:
    fontFamily: '"Segoe UI Variable", "Segoe UI", Tahoma, Arial, sans-serif'
    fontSize: "20px"
    fontWeight: 800
    lineHeight: "1.1"
    letterSpacing: "-0.5px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  pill: "99px"
spacing:
  x1: "4px"
  x2: "8px"
  x3: "12px"
  x4: "16px"
  x5: "20px"
  x6: "24px"
  x7: "32px"
  x8: "42px"
components:
  control-primary:
    backgroundColor: "{surface-raised}"
    textColor: "{ink}"
    rounded: "{rounded.md}"
    padding: "8px 11px"
  control-quiet:
    backgroundColor: "{surface}"
    textColor: "{ink}"
    rounded: "{rounded.md}"
    padding: "8px 11px"
  facet-chip:
    backgroundColor: "transparent"
    textColor: "{ink-muted}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  ledger-row:
    backgroundColor: "{surface}"
    textColor: "{ink}"
    height: "48px"
    padding: "5px 14px"
  dossier-panel:
    backgroundColor: "{surface-raised}"
    textColor: "{ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  text-field:
    backgroundColor: "{ground}"
    textColor: "{ink}"
    rounded: "{rounded.md}"
    padding: "9px 11px"
    height: "38px"
---

# Design System: KNOuX SmartOrganizer

## Overview

**Creative North Star: "The Verified Instrument Panel"**

KNOuX looks like a precision instrument mounted in a dark workshop. The ground is near-black graphite, the surfaces rise in three measurable steps, and colour is never decoration: violet is the brand and the selection signal, and every other hue is bound to a state — teal for a value Windows actually answered, amber for a capability that is partial, rose for a fault, blue for an informational fact. A screen is correct when a non-technical owner can read it in one glance and a technician can audit every number on it.

Density is the default. The window never goes below 860×600, the type scale is deliberately small (13px body, 11px labels), and information is carried by hairline rules, tabular figures and aligned columns rather than by cards inside cards. One surface per idea, one accent per state.

**Key Characteristics:**

- Midnight graphite ground with three explicit surface steps; no fourth level.
- Violet is identity and selection; the other four hues are state, never mood.
- Hairline rules and aligned columns instead of nested panels.
- Tabular figures wherever a number can be compared.
- Real Windows artefacts — installed-program icons, service names, registry roots — are the only permitted imagery.
- Every unmeasured value declares itself as unmeasured.

## Colors

The palette is a dark neutral ramp with five semantic accents; the neutrals do most of the work.

### Primary

- **KNOuX Violet** (#a855f7): the brand constant and the selection signal — active nav edge, staged rows, focus ring, the world's own hue where a world has no separate tint.
- **Lilac Light** (#c4a6ff): the readable face of violet on dark ground; used for active text and the inset state bar.
- **Deep Regent** (#8b3dff) and **Indigo Depth** (#5b5ff8): the gradient partners behind violet in the brand tile and the nav highlight. Never used as body colour.

### Secondary

- **Verified Teal** (#5ee1a5): a fact Windows answered directly (success, measured size, live service).
- **Caution Amber** (#ffc56d): a partial capability, a declared estimate, or an unavailable engine.
- **Fault Rose** (#ff7890): a failure, a refusal, a destructive consequence the user has not yet confirmed.
- **Data Blue** (#79b8ff): informational tags such as package form factor.

### Neutral

- **Ground** (#08090f): page background and recessed input wells.
- **Surface** (#111320) and **Raised Surface** (#171a2a): panels and table chrome; **Hover Surface** (#20233a) is the fourth and final step.
- **Ink** (#f7f5ff) and **Quiet Ink** (#a6a5bd): primary text and secondary text; quiet ink also carries captions and meta.
- **Hairline** (#2b2d45): borders and column rules; `--border-soft` for row separators.

### Named Rules

**The State-Colour Rule.** A hue other than violet appears only when it means something. If the reason is aesthetic, the answer is quiet ink.

**The Honest Blank Rule.** An unknown value is rendered as an em dash at half opacity, not as zero, not as "N/A", and not as a friendly sentence repeated down a column.

## Typography

**Display Font:** Segoe UI Variable, falling back to Segoe UI, Tahoma, Arial
**Body Font:** the same stack; the app never ships a webfont, because it must render offline on any Windows 10/11 machine
**Label/Mono Font:** Consolas/monospace only inside path and hash readouts

**Character:** one family doing three jobs by weight and tracking. Tight negative tracking on the display and metric sizes reads as engineering instrumentation; the 0.9px positive tracking on uppercase labels reads as a panel legend.

### Hierarchy

- **Display** (800, 28px, 1.06, -0.9px): the world name in the head band, one per screen.
- **Metric** (800, 20px, 1.1, -0.5px, tabular figures): a counted value in the metric rail.
- **Title** (700, 18px): section heads inside a world.
- **Body** (400, 13px, 1.55): prose, dossier values, descriptions; max measure 74ch.
- **Row name** (700, 15px, -0.25px): the leading text of a ledger row.
- **Label** (700, 11px, 0.9px tracking, uppercase): column heads, facet counts, badges.

### Named Rules

**The Tabular Rule.** Any number a user can compare across rows is set in tabular figures.

**The One-Display Rule.** A screen has exactly one 28px display line. A second one means two worlds are competing for the same viewport.

## Layout

The shell is a fixed sidebar (264px, collapses to a 76px rail) plus a main column capped at `min(1480px, 100% - 76px)`. The document has `min-width: 860px`, matching the smallest window the app permits.

A world page is a vertical stack of four bands: head band (identity, metric rail, coverage ribbon), command strip (search, sort, view controls), facet row, then the working surface. The working surface is either full-width or a two-column grid, `minmax(0,1fr)` beside a fixed 310–360px inspector column, collapsing to one column at 1180px.

Vertical rhythm comes from the spacing scale (`4/8/12/16/20/24/32/42px`); rows use 5px of internal padding plus a hairline separator, so a 48px row is the unit of density. Container queries drive column drops inside a table (720px → drop date, 620px → drop publisher, 520px → drop version) rather than shrinking every column at once.

Grid and flex children that hold Windows text always carry `min-width: 0`; Windows names, publisher strings and service names are unbounded and will otherwise set the width of an entire panel.

## Elevation & Depth

Depth is tonal first, shadow second. Surfaces gain light as they rise (#08090f → #111320 → #171a2a → #20233a), and only three shadows exist.

### Shadow Vocabulary

- **Ambient** (`0 26px 70px #00000052`): dialogs, drawers, and the palette — things that leave the page.
- **Contact** (`0 14px 36px #00000035`): panels and ledger containers — things that sit on the page.
- **Brand** (`0 0 0 1px #a855f733, 0 12px 34px #7b43db22`): the violet glow, reserved for the brand tile and the active nav item.

### Named Rules

**The One-Inset-Rule.** A selected row is marked by `inset 3px 0 0` in the world hue, mirrored to the inline end in RTL. Selection never changes the row's height.

## Shapes

Edges are gently curved, never round: 8px for small controls, 12px for buttons and fields, 16px for panels and ledger containers, 22px for the head band, and the pill (99px) reserved for facets, badges and progress tracks.

Borders are 1px hairlines in the border ramp; a world tints its own head-band border with `--world-border`. There are no 2px outlines, no dashed borders except the "+N" overflow badge, and no clip-paths. Sticky table headers keep a solid raised background so scrolled rows never ghost through them.

## Components

### Buttons

- **Shape:** lightly curved (12px)
- **Primary:** violet-tinted gradient over raised surface, 700 weight, `8px 11px`, 1px border in the world hue
- **Hover / Focus:** hover raises the surface one step and pulls the world border; focus draws a 2px ring in violet with a 2px offset
- **Quiet:** transparent glass over the surface with a 1px hairline; used for the segmented view control group where the active segment fills with the world's quiet tint

### Chips

- **Style:** transparent pill, 1px hairline, quiet ink label plus a tabular count
- **State:** pressed chips fill with the world's quiet tint, take full-contrast text, and turn their count violet; zero-count facets are not rendered at all, so a chip can never advertise a count it fails to show

### Ledger row

- **Structure:** `26px 34px minmax(132px,2.6fr) minmax(78px,1.4fr) 86px 92px 84px` — tick, real Windows icon, name plus meta badges, publisher, version, size, install date
- **States:** hover lifts the surface; selection paints the quiet tint and the 3px inset bar; staging recolours only the name, since staging must not look like selection
- **Meta lane:** capped at three badges in priority order (component, packaged, scope) with a dashed "+N" for the remainder; the full set lives in the dossier

### Inspector / dossier

- **Background:** raised surface with a hairline border, 16px padding, sticky within its column
- **Content:** identity block, then key/value rows where every value is either a real Windows string or an em dash, then action buttons that state their consequence
- **Empty state:** it explains what the world knows, what it cannot do yet, and the keyboard route — never a decorative illustration

### Progress and coverage

- **Track:** 5px pill over hover surface; the fill is a violet-to-light ramp measured from real counts
- **Unavailable:** the track becomes a 115° hatch and the readout says so; a hatched measure is never rendered as 0%

### Motion

Transitions are 140–250ms on state properties only (background, border, transform). `prefers-reduced-motion` and the app's own `data-motion="reduced"` axis remove every transform and animation, including the atmosphere layers and the brand sweep.

## Do's and Don'ts

### Do:

- **Do** bind each world to one hue through `[data-world]` and let it own a distinct *composition*, not a distinct palette; eleven recolored copies of the same table is a failure.
- **Do** source every visible number, icon and status from a verified local Windows provider, and render an em dash when the provider did not answer.
- **Do** keep the head band under roughly 180px at 1366×768 so the ledger shows at least eight rows above the fold.
- **Do** put a consequence in a control's label: what will change, and whether it can be undone.
- **Do** test each screen at 1920×1080, 1366×768 and 860×600, in Arabic RTL and English LTR, in dark and light.

### Don't:

- **Don't** present an unimplemented command as functional; a service without an engine is labelled and disabled with a stated reason.
- **Don't** use nested cards, gradient text, eyebrow headings, or a decorative glow on data.
- **Don't** ship invented imagery: no fake sparklines, no rings around numbers that are not ratios, no downloaded or guessed application logos.
- **Don't** let a control's width be decided by its longest Windows string; cap it and clip, keeping the full value available in the opened list or the dossier.
- **Don't** repeat a sentence such as "Not recorded" down a column; the quiet em dash already says it.
