# Cinematic homepage design system

## Goal
Port the supplied cinematic prototype into the live homepage while keeping the current site’s copy, prices, routes, metadata, consent language, and business wiring authoritative. The preview will remain unpublished.

## Implementation

1. **Global visual system**
   - Replace the public-site palette and font tokens in `src/styles.css` with ink, soot, bone, ash, gold, and ember.
   - Load Instrument Serif, Figtree, and JetBrains Mono from the root document head with `display=swap`.
   - Add reusable cinematic styles for hairlines, section scaffolds, pills, chamfered tech buttons, film grain, cursor, marquee, scroll cue, reveal motion, ledger rows, package rows, process lines, forms, and reduced-motion fallbacks.
   - Restyle shared header/footer and review all named public routes for readable contrast, spacing, and typography under the new tokens. Admin and portal business behavior will not change.

2. **Homepage component set**
   - Build focused components for the gated film grain and custom cursor, spinning work badge, before/after slider, ledger work list, package table, process grid, and inline lead form.
   - Gate grain and cursor with `shouldRunHeavyEffects()`, hover capability, and reduced-motion preferences. Reveal content will start visible and only gain movement when JavaScript is available.
   - Preserve semantic headings, keyboard operation, visible focus states, 44px targets, server-rendered copy, and a usable range input for the comparison slider.

3. **Header and hero**
   - Restyle `SiteHeader` with the prototype wordmark treatment, existing navigation, gradient scrim, and the two standard audit/book pills.
   - Rebuild the homepage hero around the existing optimized Rory WebP portrait, responsive scrims, email-only social rail until real social URLs are supplied, requested headline/tagline/lede, tech-button call link, optional resume button hidden while its URL is null, spinning work badge, factual side column, and scroll cue.
   - Add nullable `LINKEDIN_URL`, `X_URL`, and `RESUME_URL` constants in `src/lib/site.ts`.
   - Remove the homepage Three.js background and unused Three.js package/files if no remaining import needs them.

4. **Homepage sections in the requested order**
   - Add the looping service marquee.
   - Render `SHOWCASE_WORK` as linked ledger rows using the existing SVGs, supplied heading, honesty note, and process link.
   - Add the clearly labeled fictional “Marlow & Sons” before/after illustration and supporting copy without presenting it as client work.
   - Restyle the existing Approval Promise and Fit copy without changing their claims.
   - Render the four live packages from current service/catalog content, including featured state, add-ons, exact prices, deposits, refund/retainer fine print, and `/pricing` links only.
   - Render all five current `PROCESS_STEPS`, audit panel, free discovery-call panel, and Houston SEO block with existing copy and destinations.
   - Add the two-column contact area and inline form using the existing SMS consent component.
   - Keep the shared footer’s complete link groups and add the “Stand out online” sign-off.

5. **Contact submission wiring**
   - Submit without reload to the existing `/api/public/contact` endpoint with inline pending, success, validation, and failure states.
   - Extend the endpoint narrowly so this form sends the approved `website_home_form` source and `website-lead` tag to the existing GHL sync while retaining rate limiting, database storage, email delivery, consent capture, and existing audit/contact callers.

6. **Metadata and shared behavior**
   - Preserve the homepage canonical, OG metadata, LocalBusiness JSON-LD, optimized portrait loading, and all current content routes.
   - Preserve the delayed LeadConnector widget and ensure this pass does not add another widget or auto-open behavior.
   - Keep no-invented-claims safeguards: no awards, testimonials, client identities, logos, or fabricated outcomes.

## Validation
- Run the TypeScript check and complete existing test suite.
- Use Playwright at 1280px and 360px to verify section order, form behavior, slider input, responsive hero crop, menu/header/footer links, no horizontal overflow, no missing images, and no browser errors.
- Repeat with reduced motion and a headless/bot context to confirm all copy remains visible and heavy decorative effects stay disabled.
- Confirm all named public routes render successfully with the new tokens and fonts.
- Do not publish.

## Assets still expected from Rory
- Resume PDF or public resume URL.
- LinkedIn profile URL.
- X profile URL.
