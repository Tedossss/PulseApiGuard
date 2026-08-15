---
name: Dream Evidence
description: Production engineering records made physical inside a continuous bright dream.
colors:
  evidence-navy: "#092d66"
  active-blue: "#087ed2"
  dream-sky: "#29a7ed"
  dossier-paper: "#f4f0e7"
  evidence-ink: "#222321"
  muted-ink: "#60625d"
  incident-orange: "#ef5d32"
  evidence-rule: "rgba(32, 43, 49, 0.22)"
  focus-yellow: "#ffef92"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(4rem, 7.8vw, 7.8rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(3rem, 6vw, 5.8rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(0.86rem, 1vw, 1rem)"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "0.67rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  square: "0px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "32px"
components:
  action-primary:
    backgroundColor: "{colors.evidence-navy}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "13px 16px"
    height: "50px"
  action-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.evidence-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "13px 16px"
    height: "50px"
  view-switch:
    backgroundColor: "rgba(5, 50, 104, 0.24)"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  dossier:
    backgroundColor: "{colors.dossier-paper}"
    textColor: "{colors.evidence-ink}"
    rounded: "{rounded.square}"
---

# Design System: Dream Evidence

## Overview

**Creative North Star: "The Evidence Found Inside the Dream"**

Dream Evidence treats production engineering as physical proof discovered inside one continuous, bright landscape. Saturated photographic places provide wonder; cream dossier sheets, navy ink, hairline rules, clips, seals, and leader lines make roles, stacks, shipped behavior, and actions immediately credible.

The world is cinematic but not evasive. Large serif project names sit directly in the landscape, while compact grotesk labels turn each dossier into a readable record. The system refuses a detached portfolio-card grid: evidence overlaps its project place, and the Dream/Evidence control can retract or restore the proof layer without navigating away.

**Key Characteristics:**

- Full-bleed cobalt and sky-blue photographic worlds with saturated green terrain.
- Square cream paper sheets physically attached with metal clips, stamps, rules, and offset depth.
- High-contrast Instrument Serif titles paired with compact, uppercase Space Grotesk evidence labels.
- One incident-orange signal reserved for exceptional operational meaning.
- Six factual project records leading to products, repositories, contact, and CV.

## Colors

The palette separates the luminous dream from the sober evidence layer: blue and landscape imagery carry atmosphere, while cream paper and near-black ink carry proof.

### Primary

- **Evidence Navy:** The authoritative action, navigation, stamp, and structural color on paper.
- **Active Blue:** Active record indicators, standard evidence checks, and selected project state.
- **Dream Sky:** The continuous scene ground when imagery does not cover the canvas.

### Secondary

- **Incident Orange:** A single exceptional signal for the first operational incident fact; it is not a general decoration or CTA color.

### Neutral

- **Dossier Paper:** The warm physical sheet behind project records and the closing contact record.
- **Evidence Ink:** Primary prose and metadata on paper.
- **Muted Ink:** Secondary labels and supporting copy.
- **Evidence Rule:** Hairline dividers, record rows, and paper structure.
- **White:** Text and controls over the dream landscape.
- **Focus Yellow:** The high-visibility keyboard focus outline across dark and light contexts.

### Named Rules

**The One Incident Rule.** Incident Orange marks exceptional operational evidence once; ordinary checks remain Active Blue.

**The Two Materials Rule.** Blue photographic atmosphere is the dream; cream ruled paper is the evidence. Do not blur their responsibilities.

## Typography

**Display Font:** Instrument Serif (with Georgia and serif fallback)
**Body Font:** Space Grotesk (with sans-serif fallback)

**Character:** Instrument Serif makes project names feel monumental and discovered, while Space Grotesk keeps roles, stacks, proof statements, controls, and actions exact and contemporary.

### Hierarchy

- **Display:** Regular, tightly set serif type for project names, balanced within a short nine-character measure and allowed to dominate the landscape.
- **Headline:** Regular serif type for the closing contact proposition, held to roughly twelve characters per line.
- **Body:** Semibold grotesk for factual descriptions, capped at about 60 characters and given open line spacing for dossier readability.
- **Label:** Bold or extra-bold grotesk, uppercase with generous tracking, for indexes, field names, navigation, controls, and actions.

### Named Rules

**The Proof Speaks Grotesk Rule.** Factual claims, metadata, stacks, and actions use Space Grotesk; serif is reserved for project identity and the final proposition.

## Layout

Each desktop project scene fills at least one small viewport height and divides into a continuous image world on the left (64%) and a dossier on the right (36%). The first view places PulseGuard across the left two-thirds, overlaps its evidence from the right, fixes contact at the top-right, centers the view switch, and fixes the six-record rail along the bottom. At widths below 1040px the split shifts to 58/42 and actions stack when necessary.

At 760px and below, world and dossier become a vertical sequence: the image remains a tall, legible scene; the dossier becomes a full-width sheet beneath it; the header condenses; and the record rail becomes a 52px fixed numeric strip. Dream mode hides the mobile dossier and expands the image toward a full viewport, while Evidence mode preserves all semantic record content.

Spacing is deliberately asymmetric. Landscape copy uses large responsive insets; dossier content uses compact 8px-to-32px rhythms within generous page margins. Paper rules, not detached gaps, organize evidence rows.

**The Continuous World Rule.** New project records extend the scene rail and attach evidence to a place; they do not become isolated floating cards.

## Elevation & Depth

Depth is physical and directional. Dossiers cast a soft shadow back onto the world, the bottom rail lifts upward, clips cast small metallic shadows, and the closing sheet uses the deepest offset shadow. Paper grain and a faint red ledger line make the sheets tactile without compromising text contrast.

### Shadow Vocabulary

- **Dossier edge** (`-18px 0 48px rgba(18, 48, 67, 0.16)`): Separates the evidence sheet from its attached landscape.
- **Record rail** (`0 -12px 30px rgba(3, 43, 87, 0.13)`): Keeps fixed navigation legible over scenes.
- **Primary action** (`0 10px 26px rgba(9, 45, 102, 0.20)`): Gives the main project action a restrained tactile lift.
- **Closing sheet** (`18px 24px 70px rgba(1, 43, 94, 0.30)`): Makes the contact record feel placed onto the final landscape.

**The Physical Cause Rule.** Every shadow must imply paper, metal, a fixed rail, or an interactive lift; avoid generic ambient card shadows.

## Shapes

The default form is square and documentary: dossiers, buttons, navigation cells, and evidence rows use hard corners and one-pixel rules. Circles are reserved for engineered artifacts—the stamped seal, landscape pin, and switch thumb—while the view-switch housing alone uses a pill silhouette. The metal clip is an illustrated exception, not a reusable rounded-card language.

**The Square Evidence Rule.** Proof surfaces and actions keep square corners; rounding is reserved for controls and physical circular marks.

## Components

### Buttons

- **Shape:** Square, compact, and uppercase; project actions have a 50px minimum height and contact actions have a 48px minimum height.
- **Primary:** White label on Evidence Navy with a restrained downward shadow.
- **Hover / Focus:** Hover lifts the action by 2px and strengthens its shadow; keyboard focus uses the shared Focus Yellow outline with a 5px offset.
- **Secondary:** Transparent paper action with Evidence Navy text and a single bottom rule.

### Cards / Containers

- **Corner Style:** Square sheets with no rounded-card treatment.
- **Background:** Warm Dossier Paper with a faint directional wash and subtle paper grain.
- **Shadow Strategy:** Directional offset depth ties the sheet to the adjacent world.
- **Border:** Hairline dividers and a faint vertical ledger line replace an enclosing border.
- **Internal Padding:** Responsive, from compact mobile insets to generous desktop dossier margins.

### Navigation

The fixed header uses white uppercase identity and contact treatments over a cobalt fade. Contact is an outlined square action that inverts to white on hover. The fixed project rail is cream, segmented by thin navy rules, and shows active state with an animated Active Blue line and title. On mobile, titles collapse and the six record numbers remain available in equal-width cells.

### Dream/Evidence Switch

The centered pill control uses two explicit text buttons around a track. The selected label reaches full opacity and the white circular thumb crosses the track with a spring-like ease. On desktop, Dream mode retracts dossiers to a narrow paper edge and expands the world; on mobile, it hides dossiers entirely.

### Evidence Dossier

Each dossier contains a file title, role, stack, record, three verified evidence rows, and one or two actions. A metal clip, stamped NF seal, ruled rows, and a leader pin create the physical-evidence signature. The first record's first check alone may use Incident Orange.

### Contact Sheet

The closing record repeats the cream paper, ledger line, serif headline, and navy actions over the final dream image. Email, Telegram, and CV remain direct, visible destinations rather than being hidden behind a menu.

## Do's and Don'ts

### Do:

- **Do** place engineering claims on a cream evidence sheet attached to the project environment they describe.
- **Do** keep role, stack, record, verified behavior, and next actions readable in the semantic document.
- **Do** preserve strong keyboard focus, reduced-motion behavior, and the complete stacked mobile path.
- **Do** reserve the large serif voice for project identity and the final contact proposition.
- **Do** extend the six-record rhythm with truthful, evidence-backed content only.

### Don't:

- **Don't** turn project evidence into a conventional grid of detached cards.
- **Don't** use Incident Orange as a broad accent, hover color, or decorative flourish.
- **Don't** place essential copy or navigation exclusively in imagery, motion, or WebGL.
- **Don't** soften evidence surfaces with generic rounded corners or glassmorphism.
- **Don't** invent customer names, endorsements, benchmarks, or completed results to make a record feel stronger.
