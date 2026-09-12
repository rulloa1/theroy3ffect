# Homepage Conversion, Readability, and Performance Fixes

## Scope
Keep the current visual system, typography, layout, wording that is not called out, and every price unchanged. Update only the homepage and the shared header, footer, work grid, and pricing elements it uses. No invented clients, testimonials, logos, metrics, or outcomes.

## Implementation

### 1. Replace broken Selected Work imagery
- Generate three original 4:3 editorial mockup images in the existing near-black, signal-red, gold, and white palette:
  - responsive service website across laptop, tablet, and phone
  - brand identity, palette, stationery, and business-card composition
  - art-directed owner-run studio brand scene
- Keep them generic and unbranded so they imply the type of work without inventing a client or result.
- Store optimized images through the project asset flow and update `SHOWCASE_WORK` to use those guaranteed URLs.
- Preserve lazy loading, async decoding, meaningful existing alt text, 4:3 crops, and hover treatment.
- Replace the current empty numbered error state with a designed CSS fallback unique to each card, so a failed image still shows useful visual content.
- Remove the three card-level “See how I work” links and add one accessible link beneath the grid.

### 2. Improve homepage readability
- Set normal body copy to 16px with about 1.6 line-height and at least 90% white opacity.
- Keep short uppercase labels small, but raise secondary/meta copy to at least 15px.
- Apply this specifically to the work cards, fit section, approval promise, pricing descriptions/features/fine print, audit block, discovery-call block, Houston copy, and footer.
- Preserve the Anton, Space Grotesk, and IBM Plex Mono roles.

### 3. Consolidate calls to action
- Standardize shared and homepage calls to action as:
  - filled red: “Get your free audit” linking to `/audit`
  - outlined: “Book a discovery call” linking to `/book`
- Apply these labels and visual roles to the header, hero, approval promise, audit block, discovery-call block, and footer.
- Keep “See the work” as the hero’s tertiary link.
- Remove competing labels such as “Free audit,” “Claim your free audit,” “Start with the free audit,” and “Book a call” from these locations.
- Normalize pricing-tier labels to “Start Brand Sprint,” “Start Website / UI-UX,” “Start Design + Build,” and “Start Retainer,” without changing destinations or checkout behavior.

### 4. Clarify the audit offer
- Explain beside the hero action that submitting a URL takes about one minute and the visitor receives a personalized roughly five-minute video teardown by email.
- Rewrite the audit section heading/subcopy and its time tile to distinguish this clearly from the paid 15-minute discovery call.
- Update homepage metadata that currently describes the offer ambiguously as a “5-minute website audit.”

### 5. Correct pricing presentation
- Render the retainer price as `$3,000 /mo`, keeping the same amount.
- Expand the deposit fine print to show 50% and the three exact starting deposits: Brand Sprint `$1,250`, Website / UI-UX `$2,500`, and Design + Build `$4,000`.
- Leave all catalog prices, payment IDs, and checkout behavior unchanged.

### 6. Reduce homepage media cost
- Stop before importing Three.js when the viewport is below 768px, reduced motion is requested, or the existing effects guard rejects heavy effects; show a lightweight static branded background instead.
- Observe the hero and pause/resume the rendering loop when it leaves/re-enters the viewport, while retaining the existing hidden-tab pause.
- Convert the supplied circular logo to a 192px WebP and the existing portrait to an optimized WebP/AVIF-sized derivative, upload both through the project asset flow, and update imports.
- Keep the portrait eager with high fetch priority and set accurate intrinsic width/height to prevent layout shift.

### 7. Accessibility and touch targets
- Audit every homepage image and ensure each has descriptive alt text or explicit empty alt text when decorative.
- Give header, footer, work-grid, pricing, and section links/buttons at least a 44×44px interaction area without enlarging label text unnecessarily.
- Verify red-filled and outlined actions meet WCAG AA contrast in their normal and hover states.

### 8. Simplify the footer copyright
- Remove “Dirt, refined into gold.” from the copyright line.
- Render the copyright as `© 2026 The Roy Effect` while retaining the rest of the footer content and links.

## Technical details
- Reuse the current TanStack `Link`, route structure, semantic tokens/palette, and reduced-motion safeguards.
- Keep the work-card fallback inside React/CSS so it remains available even if the generated asset cannot load.
- Update the roadmap with this focused pass during implementation.

## Verification
- Run the TypeScript check and the existing test suite.
- Use browser checks at 1280px and 360px for `/` and `/work`.
- Confirm all three work images return successfully, all images have valid alt handling, and there are no browser console or page errors.
- Confirm no Three.js request or canvas appears below 768px or with reduced motion, and desktop animation pauses after the hero leaves view.
- Measure visible action hit areas and inspect CTA contrast, pricing order, deposit text, footer copy, and portrait/logo dimensions.
