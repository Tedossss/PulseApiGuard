---
name: The Remembered Street
description: Six real systems become familiar houses along one strange daylight street.
colors:
  ink: "#123451"
  ink-hover: "#275373"
  ink-soft: "#3e5e71"
  paper: "#fffaf0"
  paper-deep: "#eee4d2"
  sky: "#7fc5ee"
  sky-light: "#bce5f4"
  grass: "#83b95a"
  grass-deep: "#4f863f"
  grass-light: "#abd170"
  lavender: "#9d9fc8"
  peach: "#e9a183"
  signal: "#f3bc58"
  focus: "#fff08b"
  line: "rgba(18, 52, 81, 0.28)"
  shadow: "rgba(27, 52, 62, 0.26)"
  parcel-colab: "#9fc5d8"
  parcel-foundation: "#e7c772"
  parcel-prime: "#c87e68"
  parcel-bookshelf: "#b48fb2"
  parcel-local-ai: "#87b9ad"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(3.2rem, 6vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(2.25rem, 4.2vw, 4.8rem)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Afacad Flux, sans-serif"
    fontSize: "clamp(0.93rem, 1.12vw, 1.05rem)"
    fontWeight: 610
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Afacad Flux, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 820
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  square: "0px"
  circle: "50%"
  pill: "999px"
spacing:
  xs: "0.45rem"
  sm: "0.7rem"
  md: "0.95rem"
  lg: "1.25rem"
  xl: "2rem"
  scene-edge: "clamp(1.5rem, 6vw, 6.5rem)"
components:
  action-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0.8rem 0.95rem"
    height: "3.1rem"
  action-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0.8rem 0.95rem"
    height: "3.1rem"
  action-primary-visited:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0.8rem 0.95rem"
    height: "3.1rem"
  action-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "0.8rem 0.95rem"
    height: "3.1rem"
  evidence-sign:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "clamp(1.35rem, 2.2vw, 2rem)"
    width: "min(28rem, calc(100vw - 3rem))"
  street-directory:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "1.8rem 0.45rem 0.65rem"
    height: "5rem"
  dialog-surface:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "clamp(2rem, 4vw, 4rem)"
    width: "min(72rem, 100%)"
---

# Design System: The Remembered Street

## Overview

**Creative North Star: "Systems Remembered as Places"**

The root portfolio is an Experience-mode walk through one empty daylight Dreamcore neighborhood. Huge blue sky, rolling green ground, pastel clapboard buildings, civic signs, analog grain, mild haze, and four restrained impossibilities make the street feel familiar but remembered incorrectly. Its direction record is seed `4c597950`; finish review is `PASS`.

Six verified projects become six parcels on one continuous road. Procedural Three.js supplies spatial memory and localized landmark behavior, while semantic HTML supplies every name, claim, control, link, and state. Off-white roadside signs keep professional evidence immediately legible without flattening the world into portfolio cards.

**Key Characteristics:**

- One continuous S-road connects arrival, six project stops, About, and Contact.
- Barlow Condensed gives public-sign scale; Afacad Flux keeps evidence warm, compact, and readable.
- Paper, navy ink, thin rules, exposed posts, and directional shadows form the civic evidence layer.
- Project-specific landmarks explain each system before a visitor opens its full record.
- The live surface ships no raster scenery: WebGL and CSS geometry own the street; the generated direction mock remains reference-only.

## Colors

The palette pairs clear Dreamcore daylight with sober civic ink and warm paper, so wonder and evidence never compete.

### Primary

- **Civic Ink** (`ink`) owns copy, buttons, route state, rules, and the strongest architectural trim; **Porch Ink** (`ink-hover`) is its interactive lift.
- **Notice Paper** (`paper`) carries identity, project evidence, About, Contact, the directory, and dialogs; **Aged Paper** (`paper-deep`) marks an already-inspected project.

### Secondary

- **Open Sky** and **Haze Sky** (`sky`, `sky-light`) create the high, quiet upper field.
- **Remembered Grass** (`grass`, `grass-deep`, `grass-light`) layers the hills and records visited state.
- **Parcel Peach**, **Lavender Distance**, and the five named parcel accents distinguish landmarks without becoming UI themes.
- **Route Signal** (`signal`) halos the current stop; **Focus Yellow** (`focus`) is reserved for selection and keyboard focus.

### Neutral

- **Soft Ink** (`ink-soft`) carries summaries and supporting facts.
- **Ledger Line** (`line`) divides factual rows without boxing them into cards.
- **Street Shadow** (`shadow`) grounds physical signs against the landscape.

**The Material Assignment Rule.** Pastels describe the world; paper and ink describe evidence. Project accents identify parcels, never primary actions.

**The Two-Signal Rule.** Amber marks route location and yellow marks access; neither becomes general decoration.

## Typography

**Display Font:** Barlow Condensed (with sans-serif fallback)

**Body Font:** Afacad Flux (with sans-serif fallback)

**Character:** The pairing feels like a municipal wayfinding system softened by a personal memory. Condensed headings remain bold and physical; the body face makes dense engineering proof conversational rather than clinical.

### Hierarchy

- **Display** (600, fluid 3.2–6rem, 0.9): Nazar's identity and the largest About/Contact statements, balanced within roughly 11–12 characters.
- **Headline** (600, fluid 2.25–4.8rem, 0.92): project names on evidence signs; dialogs may rise to the display scale.
- **Body** (610, fluid 0.93–1.05rem, 1.55): summaries and explanatory copy, normally capped around 65–70 characters.
- **Label** (typically 720–830, 0.58–0.73rem, tracked uppercase): actions, metadata, fact keys, loading copy, and navigation state.

**The Public Sign Rule.** Barlow Condensed names people, places, and propositions; Afacad Flux owns facts, status, navigation, and action.

## Layout

The page is a nine-stop vertical journey: arrival, six projects, About, and Contact. On desktop, ordinary project scenes span `170svh`, arrival spans `220svh`, and About/Contact span `155svh`; each contains a sticky `100svh` frame over the fixed canvas. A sign occupies one side while the road and active landmark remain readable on the other. Project signs alternate left and right, the quiet Contact action stays upper-right, and the six-cell directory stays fixed along the bottom at `5rem` high.

Scroll is guided but reversible. GSAP ScrollTrigger activates the scene crossing 48% of the viewport and publishes continuous progress; Lenis uses a `1.15` duration and `0.9` wheel multiplier. The camera holds on each parcel for half its segment before easing onward. Project inspection opens a centered evidence sheet without changing route.

At `1050px`, sign widths and the skill grid tighten. At `760px`, the composition changes rather than shrinking: sticky travel becomes in-flow frames with a `45rem` minimum, evidence signs sit above the directory, the directory becomes a horizontally snapping strip of `8.25rem` targets, and the dialog becomes a full-viewport sheet. At `420px`, fact rows and dialog lists collapse to one column.

Reduced motion uses native scrolling, in-flow scenes, snapped WebGL stills, and `120ms` color/opacity feedback only. Camera drift, cue animation, loop-door travel, dialog transforms, and smooth directory motion stop. Mobile keeps simplified WebGL at DPR 1 when available; both modes retain the complete CSS sky/hill/road/building fallback.

**The One Street Rule.** New work extends the road, parcel rhythm, and directory; it does not create detached grids, carousels, or a second visual world.

## Elevation & Depth

Depth is structural and directional. The 3D neighborhood establishes scale, haze, and camera distance; the DOM layer looks physically planted into it. Evidence signs use a leftward cast shadow (`-24px 30px 68px` in Street Shadow) and visible posts. The directory rises from the bottom (`0 -18px 42px rgba(31, 52, 61, 0.15)`), while the modal receives the strongest foreground shadow (`-30px 38px 90px rgba(3, 23, 37, 0.42)`).

**The Physical Cause Rule.** Use shadow only to explain a sign, post, fixed rail, overlay sheet, or environmental object; never add ambient card elevation.

**The Semantic Foreground Rule.** WebGL stays fixed, pointer-inert, and `aria-hidden`; paper evidence always occupies the readable foreground.

## Shapes

Interactive geometry is rectilinear: square buttons and sheets, one-pixel blue rules, and two-pixel emphasis lines. Signboards expose narrow rectangular posts instead of floating as rounded cards. Circles are reserved for directory stops, visited dots, clouds, hills, lamps, and the distant water tower; the road and fallback landscape use deliberate polygonal or elliptical silhouettes.

**The Civic Object Rule.** Evidence should look mounted, printed, ruled, or filed—not glassy, pill-shaped, or generically rounded.

## Components

### Arrival and Evidence Signs

The lower-left arrival sign leads with name, role/location, and “Six places. One remembered street.” Project signs alternate sides, add a parcel-colored top edge, expose Role and one verified roadside signal, then offer a single Inspect action. About and Contact use wider signs in the same physical language.

### Project Dialog

The paper sheet contains the complete summary, role/year/classification, description, detail rows, verified facts, technology, and truthful destinations. It opens in `360ms` from the trigger origin; the backdrop is deep translucent ink. The background becomes inert, focus enters the Close button, Tab is trapped, Escape/backdrop closes, and focus returns to the opener. On mobile it is a full-height sheet; under reduced motion it appears immediately.

### Actions and Street Directory

Primary actions are square ink blocks at least `3.1rem` high; visited Inspect actions become Aged Paper. Outlined dialog destinations invert on hover, contact links shift along their ruled rows, and fine-pointer hover lifts eligible actions by `2px`. Every link and button receives a `3px` Focus Yellow outline with `4px` offset. The six real directory buttons expose current and visited state, an animated two-pixel route, and mobile targets `4.9rem` high.

### Procedural Landmark Field

PulseGuard is an awake peach watch-house with three breathing green/amber/red failure lamps. CoLab is two houses joined by one impossible raised room. Foundation is a butter civic publishing house with twin noticeboards and a hovering paper bundle. Prime Leather is a split peach/lavender workshop stitched through facade and roof. BookShelf is a blue home whose roof becomes colored book spines. Local LLM is a mint computer classroom with prepared paper stacks and ready screens that glow without implying a completed run.

The same field carries a wrong-direction sign shadow, one floating door, paired identical clouds, and one far sidewalk loop. Motion stays local and slow. Pointer parallax is slight; inactive parcels remain visible and quiet. Mobile reduces trees, flowers, papers, stitches, books, and windows, disables antialiasing, and caps DPR at 1; desktop caps DPR at 1.35. Hidden tabs and lost WebGL contexts stop rendering, and cleanup disposes every geometry, material, render list, and renderer.

### Loader, Fallback, and Social Preview

The loader releases when WebGL settles, fails open after `2.2s`, and fades over `420ms`; reduced motion hides it immediately. Failure leaves a complete CSS-built poster and per-scene fallback—gradients, clipped road, hills, clouds, tower, and block-built houses—with no image request. The Open Graph card independently recreates Street-Sign Arrival through `ImageResponse`, inline SVG, and live text; it is metadata, never a raster layer in the page.

## Do's and Don'ts

### Do:

- **Do** keep all project facts and destinations sourced from the verified project data.
- **Do** make a system understandable as a landmark, then let semantic evidence complete the explanation.
- **Do** preserve skip navigation, live current-stop text, `aria-current`, dialog focus management, visible focus, and forced-colors borders.
- **Do** retain the complete journey in mobile, reduced-motion, CSS-fallback, and WebGL-failure paths.
- **Do** keep surreal events sparse, gentle, and subordinate to wayfinding.

### Don't:

- **Don't** ship the approved generated mock, any photograph, or any other raster as live street scenery.
- **Don't** move names, claims, navigation, or actions into canvas-only content.
- **Don't** turn the street into a project-card grid, sci-fi observatory, vivarium, or dashboard skin.
- **Don't** replace square civic evidence with rounded glass panels, glow, or decorative gradients.
- **Don't** fabricate customers, endorsements, performance outcomes, or a completed Local LLM training result.
