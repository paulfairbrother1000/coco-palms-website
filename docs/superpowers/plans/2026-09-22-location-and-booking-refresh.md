# Location and booking refresh implementation plan

> **For Codex:** Follow the approved design in `docs/superpowers/specs/2026-09-22-location-and-booking-refresh-design.md`. Implement each task test-first and commit only after verification.

**Goal:** Improve hero readability, expand Location & Amenities with the supplied photography and local guide, and consolidate availability and quotation into one canonical page.

**Architecture:** Keep existing quote calculation and API behaviour unchanged. Reuse `QuoteForm` directly on `/rates-and-availability`, turn `/get-quotation` into a compatibility redirect, and change all CTAs to the canonical route. Build the location guide from page-local typed data and responsive CSS; store the six owner-supplied images under `public/images/location/`.

**Tech stack:** Next.js 16 App Router, React 19, TypeScript, CSS, Vitest/Testing Library, Playwright/browser verification, Vercel.

---

## Task 1: Lock the canonical booking route with tests

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/site-header.test.tsx`
- Modify: `src/app/rates-and-availability/page.test.tsx`
- Replace: `src/app/get-quotation/page.test.tsx`

1. Add assertions that homepage and header quotation CTAs use `/rates-and-availability`.
2. Mock `QuoteForm` in the rates-page test and assert the rates, payment terms and quote form render together.
3. Mock `permanentRedirect` and assert `/get-quotation` redirects to the canonical route while preserving arrival/departure query parameters.
4. Run the focused tests and confirm they fail for the expected route/content reasons.

## Task 2: Consolidate booking and quotation

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/site-header.tsx`
- Modify: `src/app/location-and-amenities/page.tsx`
- Modify: `src/app/rates-and-availability/page.tsx`
- Modify: `src/app/get-quotation/page.tsx`
- Modify: `src/features/availability/availability-calendar.tsx`

1. Replace all `/get-quotation` CTA destinations with `/rates-and-availability`.
2. Replace the server-loaded standalone calendar on the rates page with the existing quotation overview and `QuoteForm` journey.
3. Keep published rates and payment wording above the form.
4. Make `/get-quotation` perform a permanent redirect, safely copying supported date query parameters.
5. Run the focused tests until green.

## Task 3: Add local hero contrast

**Files:**
- Modify: `src/app/page.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

1. Add a failing test for a local `.hero-copy-panel` wrapper and continued absence of a full-image `.hero-shade`.
2. Wrap only the hero text/actions in the panel.
3. Add translucent navy background, readable contrast, padding and responsive width without applying filters or overlays to the hero image.
4. Run the homepage test until green.

## Task 4: Add the six-image responsive location guide

**Files:**
- Modify: `src/app/location-and-amenities/page.test.tsx`
- Modify: `src/app/location-and-amenities/page.tsx`
- Modify: `src/app/globals.css`
- Add: `public/images/location/coco-palms-sunset-terrace.jpg`
- Add: `public/images/location/coco-palms-pool-at-night.jpg`
- Add: `public/images/location/coco-palms-aerial.jpg`
- Add: `public/images/location/coco-palms-mooring-twilight.jpg`
- Add: `public/images/location/coco-palms-pool-sunset.jpg`
- Add: `public/images/location/coco-palms-waterfront-sunset.jpg`

1. Add tests for the replacement sentence, exactly six mosaic images, local venue names/links/distances, all three charter operators, and the concierge message.
2. Copy and consistently name the six supplied files.
3. Replace the old collage block with a responsive `next/image` mosaic.
4. Add Jolly Harbour, dining, charter and concierge sections using verified venue spellings and official links where available.
5. Keep the existing 18-item amenities grid intact.
6. Add desktop, tablet and mobile styles for the mosaic and directory cards.
7. Run the location tests until green.

## Task 5: Full verification and review

**Files:**
- Review: all modified `.tsx` and CSS files

1. Run focused tests.
2. Run `npm test`.
3. Run `npm run build`.
4. Start the production server and inspect homepage, Location & Amenities, Rates & Availability, and redirect behaviour at desktop and mobile widths.
5. Run the React best-practices review for the modified TSX components and resolve material findings.
6. Confirm no obsolete `/get-quotation` links remain outside the redirect/test compatibility coverage.

## Task 6: Commit and deploy

1. Commit the verified implementation.
2. Push `codex/location-booking-refresh`.
3. Deploy a preview and smoke-test the public preview routes.
4. Report the preview URL and any remaining content assumptions, especially approximate distances.
