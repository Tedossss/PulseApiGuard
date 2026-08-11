# Falach Dream World

## A. Site narrative

The visitor follows one road through ordinary places that cannot logically be
connected. Each location contains a real piece of Nazar Falach's work. The road,
clouds, fluorescent green and off-white materials recur so the experience feels
like one remembered place rather than separate campaign pages. The final door
returns to the first road with one altered sign.

## B. Scene order

1. **Endless road** — identity, role and a house that reacts before it is entered.
2. **The awake house** — PulseGuard inside a quiet suburban utility room.
3. **Cloud transit** — CoLab carried by an empty bus whose route joins people.
4. **The endless market** — Foundation Platform lives in receipts, notices and
   bilingual shelf labels.
5. **The repair counter** — Prime Leather Repair appears through a service tag,
   a bell and a chair whose split seam closes.
6. **The oversized library** — BookShelf is embedded in giant books, a rainbow
   and an indoor pool with impossible scale.
7. **The computer classroom** — the Local LLM experiment is presented honestly
   as a prepared pipeline, not a completed training result.
8. **The quiet office** — About, CV and skills presented as a plain inventory.
9. **The sky exit** — contact links, a freestanding door and the return loop.

## C. Hero concept

There is no conventional hero container. A procedural road, low white fence,
artificial hills and oversized clouds occupy the first viewport. The name is
placed like a roadside notice. Scrolling advances an actual camera toward the
house; the text remains behind in world space. Pointer proximity moves the porch
light and door by a few degrees. Reduced motion replaces this with one authored
static frame and immediate navigation.

## D. Project presentation

Four flagship projects receive separate locations and full detail surfaces.
BookShelf and Local LLM remain distinct environmental objects in their own
locations rather than generic cards. All names, descriptions, roles, dates,
technologies, verified facts and available links remain semantic HTML.

## E. Transition system

- PulseGuard: a physical door opens and the detail plane grows from its frame.
- CoLab: a bus ticket/window expands along the carriage route.
- Foundation: a checkout receipt unrolls into the project detail.
- Prime Leather: a stitched seam separates and closes in reverse.
- BookShelf: a page turns around its bound edge.
- Local LLM: coarse image blocks align into a readable classroom surface.
- EXIT: the sky door opens, camera/light passes through, and the page returns to
  the road with altered copy.

Every transition reverses back to its originating object. No transition is a
standalone fade or arbitrary wipe.

## F. Cursor and proximity

Fine pointers keep the native pointer plus a small contextual label. Objects
respond inside a 150–180 pixel radius; pointer velocity only adds restrained RGB
separation and material displacement. Touch and reduced-motion users receive no
custom cursor behavior.

## G. Mobile adaptation

Mobile uses shorter vertical scene spans, fewer WebGL objects, DPR 1, direct
touch targets and fallback images as deliberate compositions. Copy sits in
scene-specific positions instead of shrinking desktop coordinates. Detail
surfaces become full-height sheets with the same content and reversible
interaction. Camera drift, cursor effects and long pinned travel are removed.

## H. Assets

Eight original generated environment keyframes live in
`public/assets/dreamworld/`. They are compressed WebP files used for initial,
reduced-motion and WebGL fallback states. Desktop spatial depth is procedural;
there are no external models, stock images or runtime texture dependencies.

## I. Technical approach

- Next.js App Router, React and strict TypeScript.
- Semantic DOM is the primary content and SEO layer.
- Three.js renders the selective continuous world behind the content.
- GSAP/ScrollTrigger owns authored scene timelines.
- Lenis smooths desktop wheel input without removing user control.
- Dynamic imports keep Three.js and motion libraries out of reduced-motion and
  unsupported-WebGL paths where possible.
- `sessionStorage` stores only the current visit's explored/loop state.

## J. Performance and quality risks

- Render DPR is capped at 1.5 desktop and 1 mobile.
- Repeated geometry must use instancing and inactive scene groups are culled.
- The render loop pauses in hidden tabs and every geometry, material, listener
  and animation is disposed during teardown or context loss.
- Only the opening fallback image is eager; remaining images lazy-load with
  intrinsic dimensions and responsive sizes.
- Reduced motion disables Lenis, parallax, drift, shader time and decorative
  transition choreography.
- Release gates are lint, unit tests, production build, link checks, desktop,
  mobile, reduced-motion, no-WebGL, keyboard, resize, overflow and live audits.
