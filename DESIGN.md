---
name: Dream Evidence Atlas
description: Six production case files plotted across a full-bleed sticky dream atlas.
colors:
  atlas-navy: "#06295b"
  atlas-navy-deep: "#031a3a"
  depth-navy: "#092d66"
  active-blue: "#087ed2"
  dream-sky: "#29a7ed"
  case-paper: "#f4f0e7"
  paper-depth: "#ded5c5"
  depth-cream: "#fffcf3"
  record-ink: "#20211f"
  muted-ink: "#5b5d58"
  incident-orange: "#ef5d32"
  evidence-rule: "rgba(31, 45, 53, 0.2)"
  focus-yellow: "#ffef92"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(4rem, 7vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(3.6rem, 6.5vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  file-title:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "2.2rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(0.82rem, 0.9vw, 0.94rem)"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "0.58rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.17em"
rounded:
  square: "0px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "17px"
  lg: "24px"
  xl: "32px"
  stage-edge: "clamp(24px, 4vw, 64px)"
components:
  action-primary:
    backgroundColor: "{colors.atlas-navy}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "12px 15px"
    height: "48px"
  action-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.atlas-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "12px 15px"
    height: "48px"
  contact-action:
    backgroundColor: "{colors.atlas-navy}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "12px 17px"
    height: "50px"
  view-switch:
    backgroundColor: "rgba(2, 36, 81, 0.68)"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  case-file:
    backgroundColor: "{colors.case-paper}"
    textColor: "{colors.record-ink}"
    rounded: "{rounded.square}"
    padding: "clamp(31px, 3vw, 44px) clamp(30px, 3.2vw, 48px) 36px"
  atlas-rail:
    backgroundColor: "rgba(3, 31, 70, 0.86)"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "11px 13px"
    height: "64px"
  focus-anchor:
    backgroundColor: "{colors.case-paper}"
    textColor: "{colors.atlas-navy}"
    rounded: "{rounded.circle}"
    size: "42px"
---

# Design System: Dream Evidence Atlas

## Overview

**Creative North Star: "Proof Plotted Inside the Dream"**

Dream Evidence Atlas makes six production engineering records feel found inside one continuous, luminous landscape. Each station fills the viewport; monumental serif project identity lives in the image, while a clipped cream case file floats over the same place as a physical object. Navy cartography, an animated Focus Trace, numbered anchors, and the fixed atlas rail plot every claim back into the world that carries it.

Wonder never delays qualification. On wide animated desktop, the first viewport names Nazar Falach, his full-stack role and location, the range of work, the six verified files, availability, PulseGuard's classification and premise, and the complete first evidence record. Compact paths retain his name, the authored-work scope, PulseGuard's identity and premise, and direct Contact while intentionally collapsing secondary location, count, and availability metadata. Dream mode lets the image breathe with a compact file; Evidence mode is the default and opens the full role, stack, record, verified behaviors, and actions without leaving the atlas.

**Key Characteristics:**

- One full-bleed sticky atlas advances through six image stations across a six-viewport scroll track.
- Cream case files float with clipped edges, paper layers, metal clips, NF seals, ledger rules, tilt, and directional shadow.
- A dashed Focus Trace connects the active evidence row to a numbered landmark in every scene.
- The fixed bottom atlas rail keeps all six cases visible and reports the active station.
- Instrument Serif creates project-scale identity; Space Grotesk keeps proof compact, direct, and scannable.
- Semantic records survive mobile, reduced motion, missing WebGL, and failed decorative rendering.

## Colors

The palette gives each layer a job: cobalt carries navigation and authority, bright sky and imagery carry dream atmosphere, warm cream carries evidence, and yellow makes both progress and keyboard focus unmistakable.

### Primary

- **Atlas Navy:** The main chrome, action, case-file structure, and page-ground color.
- **Atlas Navy Deep:** The darkest underlay for scrollbars and deep environmental contrast.
- **Depth Navy:** The wireframe atlas's documentary line color inside the decorative Three.js field.
- **Active Blue:** Case status, evidence checks, active rules, and route geometry.
- **Dream Sky:** The image fallback and transition ground behind all six stations.

### Secondary

- **Incident Orange:** Reserved for PulseGuard's first exceptional incident-state check; it is never a general CTA or decoration.
- **Focus Yellow:** The two-pixel journey progress, active rail state, text selection, and visible focus outline.

### Neutral

- **Case Paper:** The primary physical evidence surface and numbered scene anchor.
- **Paper Depth:** The offset sheet visible behind a floating case file.
- **Depth Cream:** The bright line target used when the decorative atlas opens in Dream mode.
- **Record Ink:** Primary prose and metadata on paper.
- **Muted Ink:** Secondary field labels and supporting copy.
- **Evidence Rule:** Hairline divisions between record fields and verified checks.
- **White:** Identity, controls, titles, trace lines, and high-contrast text over imagery.

### Named Rules

**The One Signal Rule.** Incident Orange marks one exceptional operational fact; Focus Yellow marks navigation and access; Active Blue carries ordinary evidence state.

**The Material Assignment Rule.** Images and sky are the dream, cream is the record, and translucent navy is interface chrome. Do not swap those responsibilities.

## Typography

**Display Font:** Instrument Serif (with Georgia and serif fallback)

**Body Font:** Space Grotesk (with sans-serif fallback)

**Character:** The display face turns each project name into a landmark rather than a card heading. The grotesk voice is compact, technical, and deliberately over-indexed on uppercase labels so roles, stacks, evidence, navigation, and actions scan like a filed record.

### Hierarchy

- **Display:** The tightly set, regular serif role for project names; keep it to roughly eight and a half characters per line over the landscape.
- **Headline:** The regular serif role for the final contact proposition; balance it within an eleven-character measure.
- **File Title:** The compact serif identity used only when Dream mode collapses a case file.
- **Body:** Semibold grotesk for records and factual description, generally no wider than 68 characters.
- **Label:** Extra-bold, tracked grotesk for classification, year, indexes, state, controls, navigation, and actions. Supporting uppercase copy may use a slightly larger optical size while preserving the same voice.

### Named Rules

**The Proof Speaks Grotesk Rule.** Project identity and the closing proposition may use serif; facts, qualifications, controls, and actions use Space Grotesk.

## Layout

The desktop experience is one full-bleed atlas, not six split screens. A `600svh` journey drives a `100svh` sticky stage. Six absolute scenes cross-fade inside that stage as their invisible `100svh` markers pass the viewport midpoint. World copy sits near the left edge and a dimensional case file floats at the upper right; neither region owns a permanent percentage column.

The wide animated-desktop first viewport must qualify the work without interaction. Keep identity and location at top-left, the Dream/Evidence control centered, Contact at top-right, the concise portfolio brief below the identity, PulseGuard's name and premise in the landscape, its full evidence file at right, the Focus Trace on the house, and the six-case rail at the bottom. The two-pixel top progress line and next-case cue explain that the atlas continues. Compact desktop may omit availability, while mobile retains identity, scope, first-case premise, and Contact but hides the location and supporting brief spans.

Evidence mode is the default. Its file is `min(38vw, 610px)` with a `430px` desktop floor and exposes role, stack, record, three verified checks, and one or two actions. Dream mode moves a smaller `min(335px, 30vw)` file to the lower right, retains index, status, title, and role, and presents an explicit Inspect evidence action. The world remains full-bleed in both states.

Mobile and reduced motion use the static journey. Reduced motion on wider screens renders each station as an in-flow, full-height 58/42 world-and-record pair. At `760px` and below, each world becomes a `62svh` image with a `500px` floor, followed by a nearly full-width case file overlapping it by `52px`. Full record content remains present in both Dream and Evidence modes; the header condenses, and the bottom rail becomes a `54px` numeric strip. The final contact sheet follows the six stations in normal document flow.

**The One Atlas Rule.** Additions extend the six-station route, marker rhythm, and rail; they do not become detached grids, carousels, or route changes.

**The Qualification-in-Frame-One Rule.** Wide animated desktop communicates who, what, proof, availability, and a next action. Compact layouts may collapse secondary metadata but must retain identity, work scope, first-case premise, and Contact before relying on scroll, hover, or WebGL.

## Elevation & Depth

Depth is physical first and atmospheric second. The case file uses imperfect clipping, a rotated backing sheet, paper wash, ledger line, metal clip, seal, perspective, and pointer-responsive tilt. The fixed rail and compact navy overlays sit closer to the glass; the closing sheet receives the deepest paper shadow.

### Shadow Vocabulary

- **Floating case file** (`-24px 31px 75px rgba(0, 22, 55, 0.30)`): Lifts the evidence record off the landscape.
- **Offset paper layer** (`-14px 20px 50px rgba(0, 22, 55, 0.18)`): Reveals a second physical sheet beneath the record.
- **Metal clip** (`0 9px 14px rgba(42, 43, 40, 0.30)`): Grounds the illustrated clip against paper.
- **Atlas rail** (`0 18px 52px rgba(0, 15, 43, 0.34)`): Keeps fixed navigation legible over changing imagery.
- **Primary action** (`0 12px 28px rgba(6, 41, 91, 0.21)`): Gives the main dossier action restrained tactile lift.
- **Closing sheet** (`23px 31px 82px rgba(0, 20, 55, 0.36)`): Places the final contact record over the exit landscape.

A single lazily imported Three.js canvas adds a second atlas in shallow depth: six translucent wireframe station cards, registration nodes, and one curved route. It is fixed, masked, pointer-inert, and always behind the semantic case files. Dream mode makes it broader and cream; Evidence mode keeps it quieter, navy/blue, and biased toward the world side.

**The Physical Cause Rule.** Every shadow must imply paper, metal, fixed chrome, or an interactive lift; avoid generic ambient card shadows.

**The Decorative Depth Rule.** WebGL may deepen the atlas but may never own a project name, fact, navigation target, state announcement, or action.

## Shapes

The system is square and documentary at interaction level, but imperfect at paper level. Buttons, rail cells, and field rules remain rectilinear. Case files and the contact sheet use subtly torn polygon edges rather than rounded rectangles. Circles are reserved for the switch thumb, stamped NF seal, route nodes, and numbered scene anchor; the Dream/Evidence housing alone uses a pill.

**The Cut Paper Rule.** Evidence may look clipped, tilted, layered, and imperfect; it must never become a soft rounded card or generic glass panel.

## Components

### Header and Qualification Brief

The fixed `88px` desktop header uses a three-column grid: identity, centered view switch, and outlined Contact action. A translucent navy gradient keeps it legible without closing the sky. The wide-desktop top-left qualification brief is a compact navy field, not a card: one strong scope line plus the verified-file count and availability. Below `1180px` the availability line drops; at `760px` and below, the identity's location and all supporting brief spans drop while the name and strong scope line remain. Both the header/brief and bottom rail recede when the contact section becomes visible.

### Dream/Evidence Switch

Use two real buttons with `aria-pressed` around a `42px × 22px` track and `14px` white thumb. The selected label reaches full opacity; the thumb crosses `20px` with the atlas ease. Dream changes presentation, never information architecture: the active file compacts on animated desktop, while static/mobile layouts retain the full semantic record.

### Floating Case File

The file header always carries padded index and truthful status. Evidence state adds Role, Stack, Record, three verified rows, and actions; active-row hover moves a blue rule and redirects the Focus Trace. A paper layer, metal clip, NF seal, red ledger line, irregular clipping, and project-specific tilt create the object. Dream state removes clip, seal, ledger, and long details, leaving a compact title/role file with an Inspect evidence button.

### Focus Trace

The Focus Trace is a white dashed SVG path from the active evidence-row height to the current project's factual image anchor. Animate its dash over `2.8s`, terminate it with a paper-filled node and halo, and pair it with a separate `42px` numbered paper pin. It is decorative and `aria-hidden`; in Dream mode its opacity falls to 30%, and the semantic evidence list remains the source of truth.

### Atlas Rail

The fixed bottom rail uses six equal translucent-navy cells, `64px` desktop height, thin white divisions, tabular two-digit numbers, uppercase titles, and a two-pixel internal route. The active cell turns Focus Yellow and fills its route line; every cell is a real button that scrolls to its station and reports `aria-current="step"`. Mobile hides titles but preserves six minimum-`52px` targets in a full-width `54px` strip.

### Actions

Primary evidence actions are square, navy, uppercase, and at least `48px` high; secondary actions stay transparent with one navy bottom rule. Hover lifts either action by `2px`, while the primary shadow deepens. Contact-sheet actions use the same language at `50px`. Every link and button shares a `3px` Focus Yellow outline with a `5px` offset.

### Contact Sheet

The final station is a centered cream sheet over the stairway-exit image. It repeats the ledger rule, clipped silhouette, serif proposition, navy actions, and factual filing line. Email, Telegram, and CV are direct destinations; no menu or animation may hide them.

### Decorative Depth Field

Keep the field client-only and dynamically imported. Mount it only above `760px`, without reduced motion, and when `(hover: hover) and (pointer: fine)` matches; compact, reduced-motion, and coarse-pointer paths omit the component entirely. Cap device pixel ratio at `1.35`, stop frames while the document is hidden, respond to context loss and restoration, and dispose geometries, materials, render lists, and the renderer on teardown. Import or initialization failure must leave the complete DOM atlas untouched.

### Accessibility and Performance Boundaries

Keep the skip link, semantic main/header/nav/article/section structure, labelled definition lists, live active-project announcement, `aria-pressed` mode state, `aria-current` rail state, and visible focus treatment. In animated atlas mode, only the active article is exposed to assistive technology and only its actions are tabbable. In static mode all six articles return to document flow. Forced-colors mode must restore borders and Canvas colors and may suppress the decorative trace and anchor. The first image is preloaded; the other full-bleed images remain Next Image assets, and no WebGL failure may block text, scrolling, rail navigation, or contact.

## Do's and Don'ts

### Do:

- **Do** keep all six stations inside one full-bleed atlas with a persistent orientation rail.
- **Do** fully qualify Nazar, the work range, verified-file count, availability, and first case in the wide opening viewport, then preserve identity, scope, first-case premise, and Contact on compact layouts.
- **Do** attach every engineering claim to a semantic cream file and a project-specific scene anchor.
- **Do** preserve the complete record in static, mobile, reduced-motion, forced-colors, and no-WebGL paths.
- **Do** keep project facts and destinations aligned with the verified source data; distinguish prepared work from completed results.
- **Do** treat Dream as a compact presentation state and Evidence as the full default record.

### Don't:

- **Don't** restore the obsolete permanent 64/36 split-screen dossier layout on animated desktop.
- **Don't** turn stations into detached cards, a conventional project grid, or six separate route pages.
- **Don't** use Incident Orange beyond the single exceptional PulseGuard incident-state check.
- **Don't** hide essential copy, actions, navigation, or state exclusively in imagery, hover, animation, or Three.js.
- **Don't** apply rounded-card or glass-panel styling to evidence paper; reserve translucent glass for atlas chrome.
- **Don't** invent customers, endorsements, benchmarks, training results, or production outcomes.
