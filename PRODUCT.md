# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters, hiring managers, and prospective clients evaluating Nazar Falach for full-stack engineering work or a software contract.

## Product Purpose

The portfolio helps a visitor understand Nazar's production engineering work, inspect representative projects, and make direct contact about employment or contract opportunities. Success means the visitor can quickly establish credibility, find a relevant case, and reach the contact action without losing the exploratory character of the experience.

## Positioning

The portfolio presents deployed systems and engineering decisions as explorable places inside one continuous dream world, rather than as a conventional grid of detached project cards.

## Operating Context

Visitors arrive from a shared link on desktop or mobile, often with limited time. They browse project summaries, open deeper project records, follow available live or repository links, review Nazar's background, and use email or Telegram to make contact.

## Capabilities and Constraints

- `/dream` is a separate Next.js App Router experience and must not replace the portfolio at `/` or interfere with `/PAG` and `/colab`.
- The experience uses semantic React content enhanced by Lenis, GSAP ScrollTrigger, and an optional lazy Three.js canvas.
- Essential portfolio content and navigation must remain usable without WebGL, with reduced motion, and on mobile.
- Existing project facts and claims must remain accurate; the redesign must not invent outcomes, customers, or performance evidence.
- The primary journey is project discovery followed by direct contact about work.

## Brand Commitments

- Preserve the current bright dreamcore world, its environmental imagery, project content, and exploratory tone.
- The experience should feel authored, unusual, and memorable while remaining credible for professional evaluation.
- Nazar Falach remains the public name; the role is full-stack engineer based in Poland.

## Evidence on Hand

- Project records and verified links: `frontend/app/dreamworld/dreamData.ts`.
- Existing dream environments: `frontend/public/assets/dreamworld/`.
- Existing semantic experience, motion, and fallback implementation: `frontend/app/dreamworld/`.
- Downloadable CV: `frontend/public/assets/nazar-falach-cv.pdf`.

No testimonials, employer endorsements, or additional performance claims are available and none should be fabricated.

## Product Principles

- Make engineering credibility legible within seconds, even inside an unconventional visual world.
- Let real projects lead the experience and make deeper evidence easy to reach.
- Preserve wonder without obscuring navigation, actions, or factual content.
- Keep the essential journey resilient across mobile, reduced-motion, and no-WebGL environments.

## Accessibility & Inclusion

Maintain semantic landmarks, keyboard access, visible focus, readable contrast, reduced-motion behavior, and a complete non-WebGL path. The experience should remain understandable at common desktop and mobile viewport sizes.
