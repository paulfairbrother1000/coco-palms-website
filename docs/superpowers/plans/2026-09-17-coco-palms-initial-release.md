# Coco Palms Initial Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, mobile-first Coco Palms website with a live availability calendar, calculator-accurate quotations, managed gallery, basic quotation administration, two-way Google Calendar synchronization, and a Vercel preview deployment.

**Architecture:** A Next.js App Router application uses Supabase for public configuration, availability, quotes, authentication, gallery metadata, and image storage. Pricing is implemented as a pure tested TypeScript domain module and persisted as immutable quote items and snapshots through server-only handlers. Supabase remains the availability source of truth, with a secured idempotent Google Calendar synchronization service and scheduled reconciliation route.

**Tech Stack:** Node.js 22, Next.js App Router, React, TypeScript, Vitest, Testing Library, Playwright, Supabase Postgres/Auth/Storage, Resend, Google Calendar API, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-17-coco-palms-site-design.md`

## Global Constraints

- Deploy only to a Vercel preview URL; do not change `www.cocopalms-antigua.com`.
- Use the existing Supabase project `zhpzopbpqzdybvkvhdkf`.
- The supplied spreadsheet calculator is authoritative for quotation arithmetic.
- The primary call to action is `Get Quotation`.
- Describe Coco Palms as waterfront, never beachfront, and do not claim that it is fully staffed.
- Total occupancy is guests aged six or over plus children under six and cannot exceed eight.
- Children under six are excluded from the government levy.
- Supabase is the availability source of truth.
- No privileged key, Google credential, or Resend credential may be exposed to the browser.
- Implement behavior test-first and verify each red-green cycle.

---

### Task 1: Secure the Existing Supabase Project

**Files:**
- Create: `supabase/migrations/20260917_secure_site_settings_and_admin.sql`
- Create: `supabase/tests/security_rls.sql`

**Interfaces:**
- Produces: safe `public.is_admin()`, RLS-protected `public.site_settings`, public read-only settings, admin write access.

- [ ] **Step 1: Write the security verification SQL**

Create assertions that check RLS is enabled, `is_admin()` does not contain the empty-table bootstrap, anonymous roles have no mutation policy, and public read plus authenticated-admin management policies exist.

- [ ] **Step 2: Run the verification query and confirm it fails**

Run the equivalent read-only assertions against project `zhpzopbpqzdybvkvhdkf`. Expected: failure because `site_settings.relrowsecurity` is false and `is_admin()` contains `count(*) = 0`.

- [ ] **Step 3: Apply the minimal migration**

The migration must:

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users a
      where a.user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

alter table public.site_settings enable row level security;

create policy "public_read_site_settings"
on public.site_settings for select
to anon, authenticated
using (true);

create policy "admin_manage_site_settings"
on public.site_settings for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
```

Explicitly revoke `INSERT`, `UPDATE`, `DELETE`, and `TRUNCATE` from `anon`, while retaining only required grants.

- [ ] **Step 4: Re-run the security assertions**

Expected: all assertions pass; an anonymous role can select settings but cannot mutate them; `is_admin()` returns false when no authenticated admin exists.

- [ ] **Step 5: Run Supabase security advisors**

Expected: the `site_settings` RLS-disabled finding is gone. Record any unrelated findings without broadening this migration.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260917_secure_site_settings_and_admin.sql supabase/tests/security_rls.sql
git commit -m "fix: secure Coco Palms admin settings"
```

### Task 2: Scaffold the Application and Test Harness

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `src/test/setup.ts`
- Create: `.env.example`
- Create: `.gitignore`

**Interfaces:**
- Produces: buildable Next.js shell, `npm test`, `npm run build`, and browser-test commands.

- [ ] **Step 1: Configure the Sites execution profile**

Run the Sites execution-profile script in the project root and read the selected project-setup reference before installing dependencies.

- [ ] **Step 2: Write a failing application smoke test**

Test that the home route renders `Coco Palms` and a `Get Quotation` link.

- [ ] **Step 3: Run the smoke test and confirm failure**

Expected: failure because the application shell does not exist.

- [ ] **Step 4: Create the minimal application shell**

Use pinned compatible versions, Node.js 22, App Router, strict TypeScript, ESLint, Vitest, Testing Library, and Playwright. Add only the minimal home content required by the smoke test.

- [ ] **Step 5: Run tests and production build**

Expected: smoke test passes and `npm run build` exits successfully.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json vitest.config.ts playwright.config.ts src .env.example .gitignore
git commit -m "chore: scaffold Coco Palms application"
```

### Task 3: Implement the Calculator-Accurate Pricing Domain

**Files:**
- Create: `src/features/quotes/types.ts`
- Create: `src/features/quotes/calculate-quote.ts`
- Create: `src/features/quotes/calculate-quote.test.ts`
- Create: `src/features/quotes/validation.ts`
- Create: `src/features/quotes/validation.test.ts`

**Interfaces:**
- Produces: `calculateQuote(input, configuration): QuoteCalculation` and `validateQuoteRequest(input): ValidationResult`.

- [ ] **Step 1: Write failing tests for seasonal segmentation**

Cover stays inside one rate period and across multiple periods, asserting the accommodation base equals the sum of nightly segments.

- [ ] **Step 2: Run tests and confirm the expected failures**

- [ ] **Step 3: Implement minimal nightly segmentation**

- [ ] **Step 4: Add failing tests for occupancy, minimum stay, four-night levy, and festive ten-night minimum**

- [ ] **Step 5: Implement validation and confirm tests pass**

- [ ] **Step 6: Add failing tests for long-stay and secondary-discount priority**

Assert 20 percent applies only to nights after night fourteen and combines with at most one secondary discount in the required priority order.

- [ ] **Step 7: Implement discounts and confirm tests pass**

- [ ] **Step 8: Add failing tests for ABST, levy, fee basis, and security deposit**

Assert 17 percent ABST, $5 levy for guests aged six or over only, 5 percent fee using the spreadsheet basis including security, and separate $2,000 refundable security display.

- [ ] **Step 9: Implement totals and confirm the complete pricing suite passes**

- [ ] **Step 10: Commit**

```bash
git add src/features/quotes
git commit -m "feat: implement Coco Palms quotation calculator"
```

### Task 4: Add Supabase Data Access and Gallery Schema

**Files:**
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/types.ts`
- Create: `supabase/migrations/20260917_add_gallery_and_calendar_sync.sql`
- Create: `supabase/tests/gallery_rls.sql`

**Interfaces:**
- Produces: typed clients, `gallery_sections`, `gallery_images`, storage bucket `coco-palms-gallery`, and calendar synchronization metadata.

- [ ] **Step 1: Write failing schema and RLS assertions**

Assert three gallery sections, positions 1-12, public access only to published rows/files, admin mutation access, and required calendar sync columns and uniqueness constraints.

- [ ] **Step 2: Run assertions and confirm failure**

- [ ] **Step 3: Apply the minimal schema migration**

Create normalized gallery metadata, constraints preventing duplicate section positions, the image bucket, storage policies, and calendar sync fields/indexes. Do not insert placeholder public image rows; the management UI renders empty positions from the section capacity.

- [ ] **Step 4: Seed section definitions and supplied image metadata**

Create Exterior, Interior, and Local Area definitions with capacity twelve. Upload the supplied initial images through the controlled storage path and add published metadata for the homepage assets where appropriate.

- [ ] **Step 5: Generate TypeScript database types**

- [ ] **Step 6: Re-run schema and RLS assertions**

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase supabase/migrations/20260917_add_gallery_and_calendar_sync.sql supabase/tests/gallery_rls.sql
git commit -m "feat: add secure gallery and calendar schema"
```

### Task 5: Build the Public Layout and Content Pages

**Files:**
- Create: `src/components/site-header.tsx`
- Create: `src/components/site-header.test.tsx`
- Create: `src/components/site-footer.tsx`
- Create: `src/components/social-links.tsx`
- Create: `src/components/get-quotation-cta.tsx`
- Create: `src/app/the-villa/page.tsx`
- Create: `src/app/location-and-amenities/page.tsx`
- Create: `src/app/contact/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `public/images/cocopalmshero.jpg`
- Create: `public/images/rear-exterior.jpg`
- Create: `public/images/interior-great-room.jpg`
- Create: `public/images/antigua.jpg`

**Interfaces:**
- Produces: responsive navigation, footer, social links, content pages, and consistent `Get Quotation` actions.

- [ ] **Step 1: Write failing navigation and copy tests**

Assert the required routes, mobile menu semantics, primary CTA text, `waterfront` wording, absence of `beachfront` and `fully staffed`, and accessible social-link labels.

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement the shared layout and pages**

Use the approved palette, supplied images, responsive `next/image`, keyboard access, and concise SEO metadata.

- [ ] **Step 4: Run component tests and build**

- [ ] **Step 5: Commit**

```bash
git add src public/images
git commit -m "feat: build Coco Palms public experience"
```

### Task 6: Build Public Gallery and Homepage Tiles

**Files:**
- Create: `src/features/gallery/data.ts`
- Create: `src/features/gallery/gallery-grid.tsx`
- Create: `src/features/gallery/gallery-grid.test.tsx`
- Create: `src/components/home-gallery-tiles.tsx`
- Create: `src/app/gallery/page.tsx`

**Interfaces:**
- Produces: `getPublishedGallery()` and anchored Exterior, Interior, and Local Area sections.

- [ ] **Step 1: Write failing tests for section order, labels, empty-slot hiding, and tile anchors**

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement server-side gallery loading and responsive grids**

- [ ] **Step 4: Run tests and build**

- [ ] **Step 5: Commit**

```bash
git add src/features/gallery src/components/home-gallery-tiles.tsx src/app/gallery src/app/page.tsx
git commit -m "feat: add managed public gallery"
```

### Task 7: Build Availability Calendar and Query Service

**Files:**
- Create: `src/features/availability/types.ts`
- Create: `src/features/availability/get-availability.ts`
- Create: `src/features/availability/get-availability.test.ts`
- Create: `src/features/availability/availability-calendar.tsx`
- Create: `src/features/availability/availability-calendar.test.tsx`
- Create: `src/app/rates-and-availability/page.tsx`
- Create: `src/app/api/availability/route.ts`

**Interfaces:**
- Produces: `getUnavailableRanges(start, end)`, `isStayAvailable(arrival, departure)`, and a public calendar/API.

- [ ] **Step 1: Write failing range tests**

Cover bookings, holds, blocks, overlap boundaries, and a new arrival on a prior guest's departure date.

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement the minimal availability service**

- [ ] **Step 4: Write failing calendar interaction tests**

Assert unavailable dates are disabled and labelled, selection cannot cross unavailable dates, and available ranges can populate the quote form.

- [ ] **Step 5: Implement the calendar UI and API**

- [ ] **Step 6: Run tests and build**

- [ ] **Step 7: Commit**

```bash
git add src/features/availability src/app/rates-and-availability src/app/api/availability
git commit -m "feat: add live availability calendar"
```

### Task 8: Build and Persist the Quotation Journey

**Files:**
- Create: `src/features/quotes/quote-form.tsx`
- Create: `src/features/quotes/quote-form.test.tsx`
- Create: `src/features/quotes/repository.ts`
- Create: `src/features/quotes/service.ts`
- Create: `src/features/quotes/service.test.ts`
- Create: `src/features/quotes/quote-result.tsx`
- Create: `src/app/get-quotation/page.tsx`
- Create: `src/app/quotation/[token]/page.tsx`
- Create: `src/app/api/quotes/route.ts`

**Interfaces:**
- Consumes: `calculateQuote`, `validateQuoteRequest`, and availability service.
- Produces: saved quote snapshot, itemized quote records, public token view, and customer-visible result.

- [ ] **Step 1: Write failing service tests**

Assert validation precedes pricing, unavailable stays are rejected, trusted configuration is loaded from Supabase, quote items and immutable snapshot are stored atomically, and no client-provided total is accepted.

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement repository and quotation service**

- [ ] **Step 4: Write failing form tests**

Cover guest groups, occupancy, under-six levy exclusion, dates, contact fields, consent default, loading, validation, unavailable responses, and successful redirect.

- [ ] **Step 5: Implement form, API, and result page**

- [ ] **Step 6: Run quotation tests and build**

- [ ] **Step 7: Commit**

```bash
git add src/features/quotes src/app/get-quotation src/app/quotation src/app/api/quotes
git commit -m "feat: deliver online quotation journey"
```

### Task 9: Add Resend Notifications and Contact Submission

**Files:**
- Create: `src/lib/email/resend.ts`
- Create: `src/features/quotes/quote-email.tsx`
- Create: `src/features/contact/contact-form.tsx`
- Create: `src/features/contact/contact-form.test.tsx`
- Create: `src/app/api/contact/route.ts`
- Modify: `src/app/api/quotes/route.ts`
- Modify: `src/app/contact/page.tsx`

**Interfaces:**
- Produces: quotation and contact email delivery with stored delivery outcome.

- [ ] **Step 1: Write failing tests for safe email content and submission behavior**

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement server-only Resend adapter and email templates**

Escape user-controlled content, send the same totals stored in the quote, and do not fail quote creation solely because email delivery fails.

- [ ] **Step 4: Implement contact persistence and feedback**

- [ ] **Step 5: Run tests and build**

- [ ] **Step 6: Commit**

```bash
git add src/lib/email src/features/contact src/features/quotes/quote-email.tsx src/app/api/contact src/app/api/quotes src/app/contact
git commit -m "feat: add quotation and contact emails"
```

### Task 10: Add Two-Way Google Calendar Synchronization

**Files:**
- Create: `src/lib/google/calendar-client.ts`
- Create: `src/features/calendar-sync/types.ts`
- Create: `src/features/calendar-sync/reconcile.ts`
- Create: `src/features/calendar-sync/reconcile.test.ts`
- Create: `src/app/api/internal/calendar-sync/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Produces: `reconcileCalendar()` and secured scheduled synchronization endpoint.

- [ ] **Step 1: Write failing idempotency and reconciliation tests**

Cover Supabase-to-Google create/update/delete, Google-to-Supabase create/update/delete, stored event IDs, loop prevention, retryable errors, and preservation of last known unavailable state.

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement the calendar adapter and reconciliation service**

Use injected adapters in tests and server-only Google credentials in production.

- [ ] **Step 4: Implement secured scheduled route**

Require a server-side cron secret and configure periodic Vercel invocation. Booking/block changes request best-effort immediate synchronization without blocking persistence.

- [ ] **Step 5: Run tests and build**

- [ ] **Step 6: Commit**

```bash
git add src/lib/google src/features/calendar-sync src/app/api/internal/calendar-sync vercel.json
git commit -m "feat: synchronize Google Calendar availability"
```

### Task 11: Add Protected Gallery and Quotation Management

**Files:**
- Create: `src/features/auth/require-admin.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/gallery/page.tsx`
- Create: `src/features/gallery/admin-gallery.tsx`
- Create: `src/features/gallery/admin-gallery.test.tsx`
- Create: `src/app/admin/quotations/page.tsx`
- Create: `src/app/admin/quotations/[id]/page.tsx`

**Interfaces:**
- Produces: protected admin boundary, gallery position management, and read-only quotation management.

- [ ] **Step 1: Write failing authorization tests**

Assert anonymous and non-admin sessions are redirected or forbidden and admin membership is checked server-side.

- [ ] **Step 2: Run tests and confirm failure**

- [ ] **Step 3: Implement authentication boundary**

- [ ] **Step 4: Write failing gallery-management tests**

Cover upload, replacement, editable label and alt text, ordering, publish/hide, and public omission of empty positions.

- [ ] **Step 5: Implement gallery administration and quotation views**

- [ ] **Step 6: Run tests and build**

- [ ] **Step 7: Commit**

```bash
git add src/features/auth src/features/gallery/admin-gallery.tsx src/features/gallery/admin-gallery.test.tsx src/app/admin
git commit -m "feat: add protected Coco Palms management"
```

### Task 12: Verify and Deploy the Vercel Preview

**Files:**
- Create: `tests/e2e/public-site.spec.ts`
- Create: `tests/e2e/quotation.spec.ts`
- Create: `tests/e2e/admin-security.spec.ts`
- Create: `docs/verification/initial-preview.md`

**Interfaces:**
- Produces: verified private preview URL and evidence report.

- [ ] **Step 1: Write browser tests for the agreed user journeys**

Cover mobile navigation, homepage hero and tiles, Gallery anchors, social links, availability-disabled dates, valid quotation, under-six levy exclusion, public quote retrieval, and admin denial.

- [ ] **Step 2: Run unit and integration tests**

Run `npm test`. Expected: all tests pass with no warnings.

- [ ] **Step 3: Run the production build**

Run `npm run build`. Expected: successful build.

- [ ] **Step 4: Start the local preview and run browser verification**

Inspect desktop and mobile renders. Correct clipping, contrast, crop, focus, validation, and responsive-layout defects before deployment.

- [ ] **Step 5: Re-run Supabase security assertions and advisors**

Confirm the RLS issue is fixed and no new critical findings were introduced by the gallery/calendar schema.

- [ ] **Step 6: Configure preview environment variables**

Add only preview-scoped Supabase, Resend, Google Calendar, and cron credentials. Do not add or change the production domain.

- [ ] **Step 7: Deploy a Vercel preview**

Deploy without `--prod`, verify READY status, and run browser tests against the deployment URL.

- [ ] **Step 8: Record verification evidence and commit**

```bash
git add tests docs/verification/initial-preview.md
git commit -m "test: verify Coco Palms preview release"
```

