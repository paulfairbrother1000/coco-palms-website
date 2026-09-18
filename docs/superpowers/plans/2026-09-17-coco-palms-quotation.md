# Coco Palms Quotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a calendar-led website quotation journey that reproduces the approved Calculator v15 rules, saves and emails each quote, and emails Coco Palms when the customer selects Book Now.

**Architecture:** The browser owns only date-range selection and form presentation. Next.js route handlers revalidate every request, recheck Supabase availability and use a server-only Supabase client for quotation persistence. Pure pricing and calendar functions remain independently testable, while Resend adapters render and send customer and Book Now emails. A protected scheduled endpoint imports Google iCal events into `calendar_blocks`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, date-fns, Supabase/Postgres, Resend, Vitest, Vercel preview deployments

**Spec:** `docs/superpowers/specs/2026-09-17-coco-palms-quotation-design.md`

## Global Constraints

- Quotation Calculator v15 controls pricing except for explicit later owner instructions.
- Do not apply an automatic discount for parties smaller than three.
- Customers must select dates from the availability calendar; do not use editable date inputs.
- Children under six count toward the eight-person maximum but do not incur the government levy.
- Book Now sends an enquiry to `hello@cocopalms-antigua.com`; it does not create a booking, reserve dates or take payment.
- Supabase remains the availability authority and public users must not receive direct write access to customer or quotation tables.
- Production domain `www.cocopalms-antigua.com` remains unchanged; publication targets a Vercel preview only.

---

### Task 1: Approved website pricing rules

**Files:**
- Modify: `src/features/quotes/calculate-quote.ts`
- Modify: `src/features/quotes/calculate-quote.test.ts`
- Modify: `src/features/quotes/types.ts`
- Create: `supabase/migrations/20260917_remove_website_single_occupancy_discount.sql`

**Interfaces:**
- Consumes: `QuoteInput` with arrival, departure and the three guest counts.
- Produces: `calculateQuote(input: QuoteInput): QuoteCalculation` with seasonal line items and no small-party discount; database `calculate_website_quote(...)` with matching rules.

- [ ] **Step 1: Write failing pricing tests**

Add cases proving that two guests receive no secondary discount, that rate-period subtotals are returned and that the fee and total match hand-calculated Calculator v15 examples.

```ts
it("does not discount a quotation because the party has fewer than three guests", () => {
  const quote = calculateQuote({ arrival: "2027-06-01", departure: "2027-06-08", adults: 2, childrenSixToSeventeen: 0, childrenUnderSix: 0 });
  expect(quote.secondaryDiscount).toBe(0);
  expect(quote.quotationTotal).toBe(8773);
});
```

- [ ] **Step 2: Run the pricing tests and verify the new case fails**

Run: `npm test -- src/features/quotes/calculate-quote.test.ts`

Expected: FAIL because the current implementation applies a 10% single-occupancy discount.

- [ ] **Step 3: Implement the approved TypeScript rules**

Remove the party-size discount selection, retain seasonal nightly calculations and expose `rateBreakdown` entries shaped as `{ period: string; nights: number; rate: number; total: number }`.

- [ ] **Step 4: Add the matching database migration**

Replace the website calculation function so `p_party_size < 3` does not select `single-occupancy`. Preserve the explicit optional-discount parameter for trusted management use, but website quotation creation must pass `null`.

- [ ] **Step 5: Run pricing tests and commit**

Run: `npm test -- src/features/quotes/calculate-quote.test.ts`

Expected: PASS.

Commit: `feat: align website quotation pricing`

### Task 2: Reusable calendar range selection

**Files:**
- Create: `src/features/availability/date-range.ts`
- Create: `src/features/availability/date-range.test.ts`
- Create: `src/features/availability/quotation-calendar.tsx`
- Modify: `src/features/availability/availability-calendar.tsx`

**Interfaces:**
- Produces: `isDateUnavailable(date: Date, ranges: UnavailableRange[]): boolean` and `canSelectRange(arrival: Date, departure: Date, ranges: UnavailableRange[]): boolean`.
- Produces: `QuotationCalendar({ ranges, arrival, departure, onChange })` where `onChange` receives ISO date strings.

- [ ] **Step 1: Write failing range tests**

Cover blocked arrival, a stay crossing a blocked night, departure on the first date of a later booking and an available range.

```ts
expect(canSelectRange(new Date("2027-06-01T00:00:00Z"), new Date("2027-06-05T00:00:00Z"), [{ start_date: "2027-06-05", end_date: "2027-06-09" }])).toBe(true);
```

- [ ] **Step 2: Run the range tests and verify failure**

Run: `npm test -- src/features/availability/date-range.test.ts`

Expected: FAIL because the date-range module does not exist.

- [ ] **Step 3: Implement date-range helpers and calendar**

Use half-open date ranges (`start_date <= night < end_date`). Render blocked days without their date number, highlight the complete selected range and support keyboard button selection.

- [ ] **Step 4: Refactor the availability page to reuse the helpers**

Keep its existing Get Quotation link and query parameters while matching the new blanked-date treatment.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- src/features/availability/date-range.test.ts`

Expected: PASS.

Commit: `feat: add quotation date-range calendar`

### Task 3: Calendar-led quotation form and result

**Files:**
- Modify: `src/features/quotes/quote-form.tsx`
- Create: `src/features/quotes/quote-form.test.tsx`
- Create: `src/features/quotes/quote-result.tsx`
- Modify: `src/app/get-quotation/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `/api/availability` response `{ ranges: UnavailableRange[] }`.
- Consumes: `/api/quotes` response `{ quote: PublicQuote; emailSent: boolean }`.
- Produces: customer input with calendar-selected ISO dates and three guest counts.

- [ ] **Step 1: Write failing interaction tests**

Assert that date inputs are absent, calendar selection populates the stay summary, under-six explanatory text appears, Get Quotation submits selected dates and the result renders seasonal subtotals and Book Now.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/features/quotes/quote-form.test.tsx`

Expected: FAIL because the current form uses date inputs and the result has no Book Now action.

- [ ] **Step 3: Implement the form and result**

Load availability once on page entry, render `QuotationCalendar`, retain values after API errors and show a mobile-first two-column desktop layout with a sticky quote summary only after success.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm test -- src/features/quotes/quote-form.test.tsx`

Expected: PASS.

Commit: `feat: build calendar-led quotation page`

### Task 4: Secure quotation persistence API

**Files:**
- Create: `src/lib/supabase/admin.ts`
- Create: `src/features/quotes/quote-schema.ts`
- Create: `src/app/api/quotes/route.test.ts`
- Modify: `src/app/api/quotes/route.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `createAdminSupabaseClient()` that requires server-only `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: POST `/api/quotes` returning a public quote token and calculation.
- Consumes: database RPC `create_website_quote(text,date,date,integer,integer,text,text)`.

- [ ] **Step 1: Write failing route tests**

Cover invalid guest totals, unavailable dates, successful RPC response, server configuration failure and sanitized database errors. Inject route dependencies through a small factory so tests use real route behavior without live external calls.

- [ ] **Step 2: Run route tests and verify failure**

Run: `npm test -- src/app/api/quotes/route.test.ts`

Expected: FAIL because the route returns an unsaved client-side calculation.

- [ ] **Step 3: Implement server-only persistence**

Validate with Zod, call `get_unavailable_ranges`, then call `create_website_quote` through the admin client. Never return the customer database ID or service credential.

- [ ] **Step 4: Run route tests and commit**

Run: `npm test -- src/app/api/quotes/route.test.ts`

Expected: PASS.

Commit: `feat: save website quotations securely`

### Task 5: Customer quotation email and saved quote page

**Files:**
- Create: `src/lib/email/resend.ts`
- Create: `src/features/quotes/quotation-email.tsx`
- Create: `src/features/quotes/quotation-email.test.tsx`
- Modify: `src/app/api/quotes/route.ts`
- Modify: `src/app/quotation/[token]/page.tsx`

**Interfaces:**
- Produces: `renderQuotationEmail(quote: PublicQuote): { subject: string; html: string; text: string }`.
- Consumes: `RESEND_API_KEY`, `QUOTATION_FROM_EMAIL` and public quote token.

- [ ] **Step 1: Write failing email tests**

Assert that the email includes customer name, dates, party composition, every non-zero line item, total, security deposit, payment schedule and secure return URL.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/features/quotes/quotation-email.test.tsx`

Expected: FAIL because the email renderer does not exist.

- [ ] **Step 3: Implement renderer and Resend adapter**

Send only after persistence. Return `emailSent: false` without deleting the quotation if Resend is unavailable or rejects the message.

- [ ] **Step 4: Update the secure quotation page**

Render the same itemised result component and Book Now button. Expired quotes remain readable but clearly require a refreshed quotation before proceeding.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- src/features/quotes/quotation-email.test.tsx`

Expected: PASS.

Commit: `feat: email and display saved quotations`

### Task 6: Book Now enquiry notification

**Files:**
- Create: `src/features/quotes/book-now-email.ts`
- Create: `src/features/quotes/book-now-email.test.ts`
- Create: `src/app/api/quotes/[token]/book-now/route.ts`
- Create: `src/app/api/quotes/[token]/book-now/route.test.ts`
- Create: `src/features/quotes/book-now-button.tsx`

**Interfaces:**
- Produces: POST `/api/quotes/[token]/book-now`.
- Produces: `renderBookNowEmail(quote: PublicQuote)` addressed to `hello@cocopalms-antigua.com`.
- Records: `quote_events.event_type = 'book_now_requested'` with source `website`.

- [ ] **Step 1: Write failing notification tests**

Assert that the email contains customer contact details, dates, party composition, complete quotation, quotation reference, `Website` source and request time. Route tests must prove a repeat request inside 15 minutes does not send again.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/features/quotes/book-now-email.test.ts src/app/api/quotes/[token]/book-now/route.test.ts`

Expected: FAIL because the renderer and endpoint do not exist.

- [ ] **Step 3: Implement endpoint, event and button**

Load the public quote through a server-only RPC, inspect recent matching events, insert one event, send the owner email and return a customer-safe confirmation.

- [ ] **Step 4: Run tests and commit**

Run: `npm test -- src/features/quotes/book-now-email.test.ts src/app/api/quotes/[token]/book-now/route.test.ts`

Expected: PASS.

Commit: `feat: add Book Now enquiry notification`

### Task 7: Google Calendar iCal synchronization

**Files:**
- Create: `src/features/availability/parse-ical.ts`
- Create: `src/features/availability/parse-ical.test.ts`
- Create: `src/app/api/calendar/sync/route.ts`
- Create: `src/app/api/calendar/sync/route.test.ts`
- Create: `supabase/migrations/20260917_google_calendar_sync.sql`
- Create: `vercel.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `parseGoogleCalendarIcs(ics: string): CalendarEvent[]` with UID, start date, end date and summary.
- Produces: protected POST `/api/calendar/sync`, authorized by `CRON_SECRET`.
- Consumes: `GOOGLE_CALENDAR_ICAL_URL`.

- [ ] **Step 1: Write failing parser and route tests**

Cover all-day VEVENT parsing, folded lines, repeated import, cancelled or removed events, preservation of manual blocks and rejection without the cron secret.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/features/availability/parse-ical.test.ts src/app/api/calendar/sync/route.test.ts`

Expected: FAIL because the synchronization modules do not exist.

- [ ] **Step 3: Implement schema and parser**

Add nullable `external_uid` and `synced_at` columns plus a partial unique index for `source = 'google-calendar'`. Parse only all-day events with valid DTEND values.

- [ ] **Step 4: Implement protected synchronization**

Fetch the iCal URL server-side, upsert current Google events in one RPC or transaction and remove only stale rows whose source is `google-calendar`.

- [ ] **Step 5: Configure the Vercel schedule and commit**

Schedule the endpoint every six hours and keep manual execution available for verification.

Run: `npm test -- src/features/availability/parse-ical.test.ts src/app/api/calendar/sync/route.test.ts`

Expected: PASS.

Commit: `feat: synchronize Google Calendar availability`

### Task 8: Database, end-to-end verification and preview publication

**Files:**
- Modify if required by verification: files created in Tasks 1–7 only

**Interfaces:**
- Consumes: completed quotation flow and environment variables.
- Produces: verified Vercel preview URL; production domain remains untouched.

- [ ] **Step 1: Verify Supabase documentation and changelog**

Check current guidance for server-side service-role use, RLS, scheduled functions and storage of secrets. Confirm no relevant breaking change affects the implementation.

- [ ] **Step 2: Apply migrations and verify database calculations**

Apply the two approved migrations. Run representative SQL calculations for two guests, under-six guests, a seasonal crossover and a 15-night stay. Compare the returned values with independent test fixtures.

- [ ] **Step 3: Run Supabase security advisors**

Run security and performance advisors. Resolve new findings caused by this work and document unrelated pre-existing notices.

- [ ] **Step 4: Run the complete local verification suite**

Run: `npm test -- --reporter=dot && npm run build && git diff --check && test -z "$(git status --porcelain)"`

Expected: all tests pass, the production build succeeds and the worktree is clean after commits.

- [ ] **Step 5: Walk through the browser flow**

Verify mobile and desktop calendar selection, unavailable dates, validation, quote generation, itemised result, secure return page and Book Now confirmation. Confirm no browser console errors.

- [ ] **Step 6: Publish a preview and verify it responds**

Deploy to a new Vercel preview project or deployment. Do not promote, alias or attach `www.cocopalms-antigua.com`.

- [ ] **Step 7: Commit any verification fixes**

Commit: `fix: complete quotation journey verification`

