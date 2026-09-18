# Coco Palms Booking Request Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-step Book Now confirmation that records booking intent in Supabase and reliably emails the authoritative quotation details to Coco Palms.

**Architecture:** Keep `customers`, `quotes` and `quote_events` as the system of record. A server-only Supabase function atomically marks a quotation accepted, the API reloads authoritative data and sends an idempotent Resend notification, and the client displays a confirmation dialog before calling that API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library, Supabase Postgres, `@supabase/supabase-js`, Resend.

**Spec:** `docs/superpowers/specs/2026-09-18-booking-request-confirmation-design.md`

## Global Constraints

- This action is a booking request, not a confirmed booking or date hold.
- Dates remain available until Coco Palms confirms the booking and receives the required deposit.
- Do not create a duplicate leads or booking-requests table.
- Every quotation remains in `public.quotes`; `status = 'accepted'` and `accepted_at` identify requests to proceed.
- The browser sends only the quotation token when confirming and never supplies trusted prices, dates or party details.
- No public role receives write access to `quotes` or `quote_events`, or execute access to the new server functions.
- Do not create a booking, date hold or payment as part of this change.
- Do not submit a live booking request during verification without the user's explicit action-time approval.
- Use `TZ=UTC npm test` for the complete test suite to avoid the repository's known local-time date-test sensitivity.

## File Structure

- The timestamped `booking_request_confirmation.sql` migration emitted by `supabase migration new` — schema column, event uniqueness and service-role-only state-transition functions.
- `supabase/tests/security_rls.sql` — database permissions and schema regression checks.
- `src/lib/email/resend.ts` — generic optional Resend idempotency-key support.
- `src/lib/email/resend.test.ts` — verifies the key is forwarded correctly.
- `src/features/quotes/types.ts` — shared `QuoteConfirmationDetails` contract.
- `src/features/quotes/book-now-email.ts` — owner notification content.
- `src/features/quotes/book-now-email.test.ts` — complete content and unsecured-date wording.
- `src/app/api/quotes/[token]/book-now/route.ts` — authoritative acceptance, email retry and persistence workflow.
- `src/app/api/quotes/[token]/book-now/route.test.ts` — route outcome, expiry and idempotency tests.
- `src/features/quotes/book-now-button.tsx` — accessible confirmation dialog and submission states.
- `src/features/quotes/book-now-button.test.tsx` — dialog interaction and displayed-detail tests.
- `src/features/quotes/quote-result.tsx` — passes confirmation details to the action.
- `src/features/quotes/quote-result.test.tsx` — confirms Book Now availability and expired behaviour.
- `src/features/quotes/quote-form.tsx` — retains the submitted party/dates for the immediate quotation result.
- `src/features/quotes/quote-form.test.tsx` — confirms immediate results receive the correct details.
- `src/app/quotation/[token]/page.tsx` — supplies stored quotation details and disables expired requests.
- `src/app/globals.css` — confirmation-dialog presentation and responsive layout.

---

### Task 1: Add the Supabase Booking-Request State Transition

**Files:**
- Create: the exact timestamped `supabase/migrations/YYYYMMDDHHMMSS_booking_request_confirmation.sql` path reported by the CLI command in Step 2
- Modify: `supabase/tests/security_rls.sql`

**Interfaces:**
- Produces: `public.quotes.booking_request_email_sent_at timestamptz`.
- Produces: `public.accept_website_quote(p_token text) returns jsonb`.
- Produces: `public.mark_website_booking_request_notified(p_quote_id uuid) returns timestamptz`.
- Both functions are executable by `service_role` only.

- [ ] **Step 1: Discover the installed Supabase CLI commands**

Run:

```bash
supabase --version
supabase migration new --help
supabase test db --help
```

Expected: CLI version and current command syntax are printed. Do not guess flags that are not shown.

- [ ] **Step 2: Create the migration file using the CLI**

Run:

```bash
supabase migration new booking_request_confirmation
```

Expected: one new timestamped SQL file under `supabase/migrations/`.

- [ ] **Step 3: Add failing database contract checks**

Append checks to `supabase/tests/security_rls.sql` that fail until the migration exists:

```sql
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quotes'
      and column_name = 'booking_request_email_sent_at'
      and data_type = 'timestamp with time zone'
  ) then
    raise exception 'quotes.booking_request_email_sent_at is missing';
  end if;

  if to_regprocedure('public.accept_website_quote(text)') is null then
    raise exception 'accept_website_quote(text) is missing';
  end if;

  if to_regprocedure('public.mark_website_booking_request_notified(uuid)') is null then
    raise exception 'mark_website_booking_request_notified(uuid) is missing';
  end if;

  if has_function_privilege('anon', 'public.accept_website_quote(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.accept_website_quote(text)', 'EXECUTE') then
    raise exception 'public roles must not execute accept_website_quote';
  end if;
end
$$;
```

- [ ] **Step 4: Run the database test to verify the contract fails**

Run:

```bash
supabase test db
```

Expected: FAIL because the column and functions do not exist in the local test database. If the local Supabase stack is unavailable, record that blocker and use an isolated transaction on the connected Coco Palms project after the migration is applied in Task 5; do not claim this red step passed.

- [ ] **Step 5: Implement the migration**

Write the generated migration with this behavior:

```sql
alter table public.quotes
  add column if not exists booking_request_email_sent_at timestamptz;

create unique index if not exists quote_events_one_book_now_request
  on public.quote_events (quote_id, event_type)
  where event_type = 'book_now_requested';

create unique index if not exists quote_events_one_book_now_notification
  on public.quote_events (quote_id, event_type)
  where event_type = 'book_now_notification_sent';

create or replace function public.accept_website_quote(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_quote public.quotes%rowtype;
  v_first_request boolean;
begin
  select * into v_quote
  from public.quotes
  where public_token = p_token
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;

  if v_quote.accepted_at is null
     and v_quote.expires_at is not null
     and v_quote.expires_at < now() then
    return jsonb_build_object('outcome', 'expired');
  end if;

  v_first_request := v_quote.accepted_at is null;

  if v_first_request then
    update public.quotes
    set status = 'accepted', accepted_at = now()
    where id = v_quote.id
    returning * into v_quote;

    insert into public.quote_events (quote_id, event_type, event_payload)
    values (
      v_quote.id,
      'book_now_requested',
      jsonb_build_object('source', 'website', 'requested_at', v_quote.accepted_at)
    )
    on conflict do nothing;
  end if;

  return jsonb_build_object(
    'outcome', 'accepted',
    'quote_id', v_quote.id,
    'requested_at', v_quote.accepted_at,
    'first_request', v_first_request,
    'notification_sent', v_quote.booking_request_email_sent_at is not null
  );
end;
$$;

create or replace function public.mark_website_booking_request_notified(p_quote_id uuid)
returns timestamptz
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_sent_at timestamptz;
begin
  update public.quotes
  set booking_request_email_sent_at = coalesce(booking_request_email_sent_at, now())
  where id = p_quote_id
  returning booking_request_email_sent_at into v_sent_at;

  if v_sent_at is null then
    raise exception 'Quotation not found';
  end if;

  insert into public.quote_events (quote_id, event_type, event_payload)
  values (p_quote_id, 'book_now_notification_sent', jsonb_build_object('sent_at', v_sent_at))
  on conflict do nothing;

  return v_sent_at;
end;
$$;

revoke all on function public.accept_website_quote(text) from public, anon, authenticated;
revoke all on function public.mark_website_booking_request_notified(uuid) from public, anon, authenticated;
grant execute on function public.accept_website_quote(text) to service_role;
grant execute on function public.mark_website_booking_request_notified(uuid) to service_role;
```

- [ ] **Step 6: Run local database tests**

Run:

```bash
supabase test db
```

Expected: PASS, including the new column/function/permission checks.

- [ ] **Step 7: Commit the migration contract**

```bash
git add supabase/migrations supabase/tests/security_rls.sql
git commit -m "Add booking request state transition"
```

---

### Task 2: Add Resend Idempotency-Key Support

**Files:**
- Modify: `src/lib/email/resend.ts`
- Modify: `src/lib/email/resend.test.ts`

**Interfaces:**
- Produces: `sendEmail(message: EmailMessage, options?: { idempotencyKey?: string }): Promise<void>`.

- [ ] **Step 1: Write a failing idempotency test**

Add to `src/lib/email/resend.test.ts`:

```ts
it("passes an idempotency key to Resend", async () => {
  await sendEmail(
    { to: "hello@cocopalms-antigua.com", subject: "Booking request", text: "Text", html: "<p>Text</p>" },
    { idempotencyKey: "booking-request-quote-id" },
  );

  expect(mocks.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: "hello@cocopalms-antigua.com" }),
    { idempotencyKey: "booking-request-quote-id" },
  );
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
TZ=UTC npm test -- src/lib/email/resend.test.ts
```

Expected: FAIL because `sendEmail` does not accept or forward the options argument.

- [ ] **Step 3: Implement the optional argument**

Change the function contract and Resend call:

```ts
type SendEmailOptions = { idempotencyKey?: string };

export async function sendEmail(message: EmailMessage, options: SendEmailOptions = {}) {
  // existing configuration
  const { error } = await new Resend(apiKey).emails.send(
    { from, to: message.to, cc: message.cc, subject: message.subject, html: message.html, text: message.text, replyTo: message.replyTo },
    options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
  );
  if (error) throw new Error("Email could not be sent.");
}
```

Update the existing CC test to expect the optional second argument (`undefined`) without changing its behavior.

- [ ] **Step 4: Run the focused tests**

Run:

```bash
TZ=UTC npm test -- src/lib/email/resend.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/resend.ts src/lib/email/resend.test.ts
git commit -m "Support idempotent email delivery"
```

---

### Task 3: Make the Book Now API Authoritative and Retry-Safe

**Files:**
- Modify: `src/app/api/quotes/[token]/book-now/route.ts`
- Modify: `src/app/api/quotes/[token]/book-now/route.test.ts`
- Modify: `src/features/quotes/book-now-email.ts`
- Modify: `src/features/quotes/book-now-email.test.ts`

**Interfaces:**
- Consumes: `accept_website_quote(text)` and `mark_website_booking_request_notified(uuid)` from Task 1.
- Consumes: `sendEmail(message, { idempotencyKey })` from Task 2.
- Produces: POST outcomes `{ ok: true, alreadySent: boolean }`, HTTP 404, HTTP 410, or recoverable HTTP 503 with `{ recorded: true }` after notification failure.

- [ ] **Step 1: Replace route tests with the desired dependency contract**

Define test dependencies around these exact methods:

```ts
type Acceptance =
  | { outcome: "not_found" }
  | { outcome: "expired" }
  | { outcome: "accepted"; quoteId: string; requestedAt: string; notificationSent: boolean };

type Dependencies = {
  acceptQuote(token: string): Promise<Acceptance>;
  getQuote(quoteId: string): Promise<PublicQuote | null>;
  sendNotification(quote: PublicQuote, requestedAt: string, idempotencyKey: string): Promise<void>;
  markNotificationSent(quoteId: string): Promise<void>;
};
```

Add separate tests asserting:

```ts
expect((await missingResponse.json()).error).toBe("Quotation not found.");
expect(missingResponse.status).toBe(404);

expect((await expiredResponse.json()).error).toBe("This quotation has expired. Please request a new quotation.");
expect(expiredResponse.status).toBe(410);

expect(sendNotification).toHaveBeenCalledWith(quote, requestedAt, "coco-palms-booking-request-quote-id");
expect(markNotificationSent).toHaveBeenCalledWith("quote-id");

expect(sendNotification).not.toHaveBeenCalled(); // when notificationSent is true

expect(failedResponse.status).toBe(503);
expect(await failedResponse.json()).toEqual({
  error: "Your request was recorded, but the notification could not be sent. Please try again.",
  recorded: true,
});
```

- [ ] **Step 2: Run the route tests and verify failure**

Run:

```bash
TZ=UTC npm test -- 'src/app/api/quotes/[token]/book-now/route.test.ts'
```

Expected: FAIL because the route still uses the old recent-event dependency and sends before recording acceptance.

- [ ] **Step 3: Update the owner-email tests first**

Add assertions to `book-now-email.test.ts`:

```ts
expect(email.text).toContain("Nights: 7");
expect(email.text).toContain("Children under 6: 1");
expect(email.text).toContain("Due to confirm: $4,404.88");
expect(email.text).toContain("Balance: $4,404.87");
expect(email.text).toContain("Separate refundable security deposit: $2,000.00");
expect(email.text).toContain("The dates are not secured until the required deposit has been paid.");
```

Run:

```bash
TZ=UTC npm test -- src/features/quotes/book-now-email.test.ts
```

Expected: FAIL on the missing nights and unsecured-dates statement.

- [ ] **Step 4: Implement the new route workflow**

The handler must follow this shape:

```ts
const acceptance = await dependencies.acceptQuote(token);
if (acceptance.outcome === "not_found") return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
if (acceptance.outcome === "expired") return NextResponse.json({ error: "This quotation has expired. Please request a new quotation." }, { status: 410 });
if (acceptance.notificationSent) return NextResponse.json({ ok: true, alreadySent: true });

const quote = await dependencies.getQuote(acceptance.quoteId);
if (!quote) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });

try {
  await dependencies.sendNotification(
    quote,
    acceptance.requestedAt,
    `coco-palms-booking-request-${acceptance.quoteId}`,
  );
  await dependencies.markNotificationSent(acceptance.quoteId);
  return NextResponse.json({ ok: true, alreadySent: false });
} catch {
  return NextResponse.json(
    { error: "Your request was recorded, but the notification could not be sent. Please try again.", recorded: true },
    { status: 503 },
  );
}
```

Default dependencies must call the two service-role RPCs and select the stored quotation by internal ID. Convert snake-case RPC fields explicitly rather than relying on unsafe casts.

- [ ] **Step 5: Update the owner email**

Add `Nights: ${quote.calculation.nights}` to both text and HTML. Replace the final statement with:

```text
The customer has requested to proceed. No booking or date hold has been created. The dates are not secured until the required deposit has been paid.
```

Keep `to: "hello@cocopalms-antigua.com"` and `replyTo: quote.email`.

- [ ] **Step 6: Run focused API and email tests**

Run:

```bash
TZ=UTC npm test -- 'src/app/api/quotes/[token]/book-now/route.test.ts' src/features/quotes/book-now-email.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/api/quotes/[token]/book-now/route.ts' 'src/app/api/quotes/[token]/book-now/route.test.ts' src/features/quotes/book-now-email.ts src/features/quotes/book-now-email.test.ts
git commit -m "Record and notify booking requests"
```

---

### Task 4: Add the Customer Confirmation Dialog

**Files:**
- Modify: `src/features/quotes/types.ts`
- Modify: `src/features/quotes/book-now-button.tsx`
- Create: `src/features/quotes/book-now-button.test.tsx`
- Modify: `src/features/quotes/quote-result.tsx`
- Modify: `src/features/quotes/quote-result.test.tsx`
- Modify: `src/features/quotes/quote-form.tsx`
- Modify: `src/features/quotes/quote-form.test.tsx`
- Modify: `src/app/quotation/[token]/page.tsx`
- Create: `src/app/quotation/[token]/page.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: `QuoteConfirmationDetails` with `arrival`, `departure`, `nights`, `adults`, `childrenSixToSeventeen`, `childrenUnderSix`, `quotationTotal`, `dueToConfirm`, and `securityDeposit`.
- Produces: `BookNowButton({ token, details, disabled }: { token?: string; details?: QuoteConfirmationDetails; disabled?: boolean })`.
- `disabled` is true for expired public quotations.

- [ ] **Step 1: Define the shared confirmation type**

Add to `src/features/quotes/types.ts`:

```ts
export interface QuoteConfirmationDetails {
  arrival: string;
  departure: string;
  nights: number;
  adults: number;
  childrenSixToSeventeen: number;
  childrenUnderSix: number;
  quotationTotal: number;
  dueToConfirm: number;
  securityDeposit: number;
}
```

- [ ] **Step 2: Write failing dialog interaction tests**

Create `book-now-button.test.tsx` using Testing Library and `userEvent`. Cover these exact observations:

```ts
expect(fetchMock).not.toHaveBeenCalled();
await user.click(screen.getByRole("button", { name: "Book Now" }));
expect(screen.getByRole("dialog", { name: "Confirm your booking request" })).toBeInTheDocument();
expect(screen.getByText("1 June 2027")).toBeInTheDocument();
expect(screen.getByText("8 June 2027")).toBeInTheDocument();
expect(screen.getByText("Adults").nextSibling).toHaveTextContent("2");
expect(screen.getByText("Children aged 6 or over").nextSibling).toHaveTextContent("1");
expect(screen.getByText("Children under 6").nextSibling).toHaveTextContent("0");
expect(screen.getByText("$8,809.75")).toBeInTheDocument();
expect(screen.getByText(/dates are not secured until coco palms confirms/i)).toBeInTheDocument();
```

Add one test where **Go back** closes without fetching, one where **Confirm booking request** sends exactly one POST, one where Escape closes, and one where `{ recorded: true }` produces the recoverable retry message.

- [ ] **Step 3: Run the component test and verify failure**

Run:

```bash
TZ=UTC npm test -- src/features/quotes/book-now-button.test.tsx
```

Expected: FAIL because the current button posts immediately and has no dialog/details prop.

- [ ] **Step 4: Implement the dialog state machine**

Use these states:

```ts
type Status = "idle" | "confirming" | "sending" | "sent" | "recorded-email-failed" | "error";
```

Required UI behavior:

- `idle` → Book Now opens the dialog and moves to `confirming`.
- Go back or Escape → closes the dialog and returns to `idle`.
- Confirm → `sending`, POST token only.
- Successful POST → close, `sent`, button reads **Request sent**.
- HTTP 503 with `recorded: true` → keep a retry action and explain that the request is stored but notification needs retrying.
- Other failures → show the existing generic error without claiming the request was recorded.

Render an accessible overlay:

```tsx
<div className="booking-confirmation-backdrop" role="presentation">
  <section
    className="booking-confirmation-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="booking-confirmation-title"
  >
    <h2 id="booking-confirmation-title">Confirm your booking request</h2>
    {/* exact date, party and price summary */}
    <p className="booking-confirmation-warning">
      This is a request to proceed with the booking. Your dates are not secured until Coco Palms confirms the booking and the required deposit has been paid.
    </p>
    <div className="booking-confirmation-actions">
      <button type="button" className="button booking-confirmation-back" onClick={close}>Go back</button>
      <button type="button" className="button" onClick={send}>Confirm booking request</button>
    </div>
  </section>
</div>
```

Move focus to the dialog heading or first action on open, restore focus to Book Now on close, and attach/remove an Escape-key listener while open.

- [ ] **Step 5: Add failing data-plumbing tests**

Update `quote-result.test.tsx` to render confirmation details and assert the button can open a dialog containing them. Add/modify `quote-form.test.tsx` so the submitted form values become the confirmation details attached to the returned quote. Test the public quotation page separately or through its existing page test to assert expired quotes pass `disabled` and valid quotes do not.

Run:

```bash
TZ=UTC npm test -- src/features/quotes/quote-result.test.tsx src/features/quotes/quote-form.test.tsx 'src/app/quotation/[token]/page.test.tsx'
```

Expected: FAIL until the new props are connected. The new page test mocks `get_public_quote` with fixed valid and expired fixtures.

- [ ] **Step 6: Connect immediate and public quotation details**

After a successful immediate quotation, retain the exact validated submission details alongside the API response:

```ts
setQuote({
  ...result,
  confirmation: {
    arrival,
    departure,
    adults: payload.adults,
    childrenSixToSeventeen: payload.childrenSixToSeventeen,
    childrenUnderSix: payload.childrenUnderSix,
    nights: result.calculation.nights,
    quotationTotal: result.calculation.quotationTotal,
    dueToConfirm: result.calculation.dueToConfirm,
    securityDeposit: result.calculation.securityDeposit,
  },
});
```

On the public page, build the same shape from `PublicQuote`. Pass `disabled={expired}`. `QuoteResult` passes `token`, `details` and `disabled` into `BookNowButton`.

- [ ] **Step 7: Add responsive dialog styling**

Add focused classes to `globals.css`:

```css
.booking-confirmation-backdrop{position:fixed;inset:0;z-index:100;background:rgba(7,23,37,.68);display:grid;place-items:center;padding:1rem}
.booking-confirmation-dialog{background:#fff;width:min(620px,100%);max-height:calc(100svh - 2rem);overflow:auto;padding:clamp(1.25rem,4vw,2.5rem);border-radius:12px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
.booking-confirmation-summary{display:grid;grid-template-columns:1fr auto;gap:.65rem 1rem;margin:1.5rem 0}
.booking-confirmation-summary dt{font-weight:700}.booking-confirmation-summary dd{margin:0;text-align:right}
.booking-confirmation-warning{background:#edf9fc;border-left:4px solid var(--teal);padding:1rem}
.booking-confirmation-actions{display:flex;justify-content:flex-end;gap:.75rem;flex-wrap:wrap}
.booking-confirmation-back{background:#e9eef2;color:var(--deep)}
@media(max-width:520px){.booking-confirmation-actions .button{width:100%}}
```

- [ ] **Step 8: Run all focused UI tests**

Run:

```bash
TZ=UTC npm test -- src/features/quotes/book-now-button.test.tsx src/features/quotes/quote-result.test.tsx src/features/quotes/quote-form.test.tsx 'src/app/quotation/[token]/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/quotes src/app/quotation src/app/globals.css
git commit -m "Confirm booking requests before sending"
```

---

### Task 5: Apply and Verify the Coco Palms Supabase Migration

**Files:**
- No additional source files unless verification exposes a migration defect.

**Interfaces:**
- Consumes the Task 1 migration.
- Produces the verified live Coco Palms database contract used by the Book Now API.

- [ ] **Step 1: Re-read current Supabase guidance and inspect the target**

Use Supabase documentation search for current function/RLS guidance, then list tables for project `zhpzopbpqzdybvkvhdkf` and confirm the target is named **Coco Palms**. Do not apply the migration to Pace Shuttles or Antigua Boats.

- [ ] **Step 2: Capture the pre-migration state**

Run read-only SQL through Supabase MCP:

```sql
select
  count(*) as quote_count,
  count(*) filter (where status = 'accepted') as accepted_count
from public.quotes;
```

Record the result so existing data preservation can be verified afterward.

- [ ] **Step 3: Apply the exact committed migration**

Read the generated migration file and execute its full SQL against project `zhpzopbpqzdybvkvhdkf` using Supabase `execute_sql`. Do not edit the SQL only in the dashboard; the committed migration remains the source of truth.

- [ ] **Step 4: Verify schema and permissions**

Run:

```sql
select
  to_regprocedure('public.accept_website_quote(text)') is not null as accept_function_exists,
  to_regprocedure('public.mark_website_booking_request_notified(uuid)') is not null as mark_function_exists,
  has_function_privilege('anon', 'public.accept_website_quote(text)', 'execute') as anon_can_accept,
  has_function_privilege('authenticated', 'public.accept_website_quote(text)', 'execute') as authenticated_can_accept,
  has_function_privilege('service_role', 'public.accept_website_quote(text)', 'execute') as service_can_accept;
```

Expected: functions exist; public roles are `false`; service role is `true`.

- [ ] **Step 5: Verify state transition inside a rollback transaction**

Execute one SQL batch that selects an existing quote, temporarily makes it valid, resets its booking-request state, invokes `accept_website_quote` twice, asserts a single request event, and rolls everything back:

```sql
begin;
do $$
declare
  v_id uuid;
  v_token text;
  v_first jsonb;
  v_second jsonb;
  v_events integer;
begin
  select id, public_token into v_id, v_token
  from public.quotes
  where public_token is not null
  order by created_at desc
  limit 1;

  if v_id is null then raise exception 'No quotation available for rollback verification'; end if;

  delete from public.quote_events
  where quote_id = v_id and event_type in ('book_now_requested', 'book_now_notification_sent');

  update public.quotes
  set status = 'quotation', accepted_at = null,
      booking_request_email_sent_at = null,
      expires_at = now() + interval '1 day'
  where id = v_id;

  v_first := public.accept_website_quote(v_token);
  v_second := public.accept_website_quote(v_token);

  select count(*) into v_events
  from public.quote_events
  where quote_id = v_id and event_type = 'book_now_requested';

  if v_first->>'outcome' <> 'accepted' or (v_first->>'first_request')::boolean is not true then
    raise exception 'First acceptance failed: %', v_first;
  end if;
  if (v_second->>'first_request')::boolean is not false then
    raise exception 'Repeated acceptance was not idempotent: %', v_second;
  end if;
  if v_events <> 1 then raise exception 'Expected one request event, found %', v_events; end if;
end
$$;
rollback;
```

Expected: completes without exception and leaves the chosen quotation unchanged.

- [ ] **Step 6: Verify existing row counts remain intact**

Repeat the Task 5 Step 2 count query. Expected: total and accepted counts match the pre-migration values.

- [ ] **Step 7: Run Supabase advisors**

Run both security and performance advisors for project `zhpzopbpqzdybvkvhdkf`. Investigate any new issue attributable to this migration before continuing; do not attempt unrelated database cleanup.

- [ ] **Step 8: Commit any verified migration corrections**

If verification required a correction, update the same migration only if it has not been deployed outside this controlled dev environment; otherwise create a new CLI-generated corrective migration. Then run the checks again and commit:

```bash
git add supabase/migrations supabase/tests/security_rls.sql
git commit -m "Verify booking request database migration"
```

If no source correction was needed, do not create an empty commit.

---

### Task 6: Full Verification, Review, Publish and Deploy

**Files:**
- All files changed in Tasks 1–5.

**Interfaces:**
- Produces the deployed dev-site booking-request flow and verified Supabase tracking.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
TZ=UTC npm test
```

Expected: every test passes with zero failures.

- [ ] **Step 2: Run the production build and diff checks**

Run sequentially, not concurrently:

```bash
npm run build
git diff --check
git status --short
```

Expected: build exit 0, no whitespace errors, and only intentional files changed.

- [ ] **Step 3: Request code review**

Use `superpowers:requesting-code-review` against the implementation base and current HEAD. Fix every Critical or Important finding, rerun affected tests, and commit fixes. Record or fix Minor findings based on impact.

- [ ] **Step 4: Verify the local confirmation flow visually**

Run the development server and use the browser verifier at desktop and mobile widths. Confirm:

- Book Now opens the dialog without a network request;
- dates, party values and money values match the quotation;
- warning copy is visible;
- Go back and Escape close correctly;
- focus enters and returns correctly; and
- expired quotations cannot submit.

Do not press **Confirm booking request** against a live/test quotation at this step.

- [ ] **Step 5: Publish the reviewed commit to GitHub main**

Confirm GitHub main has not moved unexpectedly. Publish a fast-forward commit to `paulfairbrother1000/coco-palms-website` and record the remote SHA.

- [ ] **Step 6: Wait for both Vercel checks**

Poll the remote commit until both report `success`:

- `Vercel – coco-palms-dev-site`
- `Vercel – coco-palms-preview-v2`

If either fails, inspect the build failure, fix with a failing regression test where applicable, and redeploy.

- [ ] **Step 7: Verify the live dialog without submitting**

Open the deployed quotation URL created for the controlled test and confirm the same visual and accessibility checks as Step 4. Confirm that the page is served from the new remote commit.

- [ ] **Step 8: Request explicit approval for the live email action**

Immediately before pressing **Confirm booking request**, ask the user to approve sending the controlled test booking-request email to `hello@cocopalms-antigua.com` and recording the controlled request in Supabase. State the exact test customer identity and quotation reference. Do not proceed without that action-time approval.

- [ ] **Step 9: Complete the approved end-to-end test**

After approval, confirm once and verify:

- the customer sees the success message;
- `quotes.status = 'accepted'`;
- `accepted_at` is populated;
- `booking_request_email_sent_at` is populated;
- exactly one `book_now_requested` event exists;
- exactly one `book_now_notification_sent` event exists; and
- the owner email is received with correct dates, party and price details.

Repeat the POST once through the controlled test client and verify no second email or event is created.

- [ ] **Step 10: Final evidence report**

Report the dev URL, GitHub commit, Vercel check states, test count, build result, migration/advisor result and controlled email verification outcome. Clearly distinguish a recorded booking request from a secured booking.
