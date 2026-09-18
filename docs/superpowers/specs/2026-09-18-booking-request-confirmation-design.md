# Coco Palms Booking Request Confirmation Design

Date: 18 September 2026

## Purpose

Require a customer to review and explicitly confirm their quotation before Coco Palms is notified that they wish to proceed. Preserve every quotation request and make booking intent easy to identify in Supabase without adding an admin interface or creating a second, competing customer dataset.

This action is a booking request, not a confirmed booking or a date hold. The customer must be told that the dates are not secured until Coco Palms confirms the booking and receives the required deposit.

## Existing System

The website already:

- stores customer identities in `public.customers`;
- stores each quotation, including dates, party composition and pricing, in `public.quotes`;
- stores an audit history in `public.quote_events`;
- exposes a token-protected quotation page;
- sends a Book Now email to `hello@cocopalms-antigua.com`; and
- prevents duplicate notifications for 15 minutes.

The existing `quotes.status` enum already includes `accepted`, and `quotes.accepted_at` already exists. These fields will represent a customer asking to proceed. They do not mean the booking is confirmed or that the dates are held.

## Data Model

Do not create a duplicate leads or booking-requests table.

Continue using:

- `customers`: one customer per normalised email address;
- `quotes`: one row per quotation request; and
- `quote_events`: an immutable audit history for each quotation.

When a customer confirms a booking request:

- set `quotes.status` to `accepted`;
- set `quotes.accepted_at` on the first confirmation only;
- insert one `quote_events` row with `event_type = 'book_now_requested'`; and
- after successful notification delivery, insert a `book_now_notification_sent` event.

Add `quotes.booking_request_email_sent_at timestamptz null`. This makes the notification state directly filterable in Supabase and allows safe retries after a delivery failure without confusing the original quotation-email fields.

Supabase users can therefore see:

- all quote requests by viewing `quotes`;
- the associated customer through `customer_id` or the snapshot fields `contact_name` and `contact_email`;
- customers who asked to proceed by filtering `status = 'accepted'`;
- when they asked by viewing `accepted_at`; and
- whether Coco Palms was notified by viewing `booking_request_email_sent_at`.

All affected public tables retain RLS. The browser receives no direct write access to `quotes` or `quote_events`; mutations remain server-only through the service-role client. Any new database function is revoked from `public`, `anon` and `authenticated`, and granted only to `service_role`.

## Atomic Booking-Request Transition

Add a service-role-only database function, `accept_website_quote(p_token text)`, which performs the state transition atomically.

The function will:

1. Lock the matching quotation row while processing it.
2. Return `not_found` when the public token does not exist.
3. Return `expired` when the quotation has expired and was not previously accepted.
4. On the first valid request, set `status = 'accepted'`, set `accepted_at = now()`, and add the `book_now_requested` event.
5. On a repeated request, preserve the original `accepted_at` and avoid adding another request event.
6. Return the quote identifier, whether this was the first request, and whether the owner-notification email was already sent.

This function does not create a booking, create a hold, block availability or mark a deposit as paid.

After Resend accepts the email, the server updates `booking_request_email_sent_at` and inserts the `book_now_notification_sent` event. Email delivery uses a deterministic Resend idempotency key based on the quotation identifier so request retries do not create duplicate owner emails.

## Customer Confirmation Experience

The existing **Book Now** button becomes a two-step action.

Pressing it opens an accessible confirmation dialog containing:

- arrival date;
- departure date;
- number of nights;
- adults;
- children aged 6 or over;
- children under 6;
- quotation total in USD;
- amount due to confirm; and
- the separate refundable security deposit.

Zero-value child groups remain visible in this confirmation because the purpose is to verify the complete party composition before submission.

The warning reads:

> This is a request to proceed with the booking. Your dates are not secured until Coco Palms confirms the booking and the required deposit has been paid.

The actions are:

- **Go back** — closes the dialog without sending or changing Supabase; and
- **Confirm booking request** — submits the token to the existing Book Now API route.

The dialog will have an accessible name, `aria-modal`, keyboard focus management and Escape-key cancellation. While submission is in progress, the confirmation action is disabled.

On success, the dialog closes and the page shows:

> Thank you. Coco Palms has received your request. Your dates are not secured until your booking is confirmed and the required deposit has been paid.

The button then reads **Request sent** and remains disabled.

Expired quotations cannot be submitted. The public quotation page continues to explain that a fresh quotation is required, and the API independently enforces expiry even if a request is made outside the interface.

## Server and Email Flow

The browser sends only the quotation token. It does not send trusted dates, prices, party counts or customer details.

The Book Now route will:

1. Call `accept_website_quote` using the server-only Supabase client.
2. Translate `not_found` to HTTP 404 and `expired` to HTTP 410.
3. Reload the authoritative quotation details from Supabase.
4. Return success without sending again when `booking_request_email_sent_at` is already populated.
5. Otherwise send the owner email using the quotation identifier as the Resend idempotency key.
6. Mark the notification as sent and write the notification event.

The email is sent to `hello@cocopalms-antigua.com`, with the customer email as `Reply-To`. It includes:

- customer name and email;
- quotation reference;
- request date and time;
- arrival and departure dates;
- nights;
- adults, children aged 6 or over, and children under 6;
- the complete quotation breakdown;
- quotation total;
- amount due to confirm;
- balance due;
- separate refundable security deposit; and
- a clear statement that no booking or date hold has been created and the dates remain unsecured until the deposit is paid.

If the database records the request but the email provider fails, the endpoint returns a recoverable error. The interface explains that the request was recorded but the notification could not be sent and offers a retry. A retry attempts only the missing notification; it does not alter `accepted_at` or add another request event.

## Components and Files

Expected implementation areas:

- a Supabase migration for `booking_request_email_sent_at` and `accept_website_quote`;
- `src/features/quotes/book-now-button.tsx` for the dialog and states;
- `src/features/quotes/quote-result.tsx` and the quote-form/public-page callers for confirmation details;
- `src/app/api/quotes/[token]/book-now/route.ts` for authoritative validation, idempotency and persistence;
- `src/features/quotes/book-now-email.ts` for the final owner message;
- `src/lib/email/resend.ts` for an optional idempotency key; and
- focused component, route, email and database-security tests.

## Security and Privacy

- Never expose the Supabase service-role key to the browser.
- Never trust confirmation values supplied by the browser; reload the quotation server-side.
- Keep `quotes`, `customers` and `quote_events` protected by RLS.
- Do not grant the public roles direct write access or execution rights for the acceptance function.
- Keep public quotation tokens unguessable and avoid returning internal database identifiers.
- Store only operational booking-request data already supplied for the quotation.

## Testing and Verification

Use test-driven development.

Component tests will verify:

- Book Now opens the confirmation dialog without sending;
- all dates, prices and party numbers are displayed;
- the unsecured-dates warning is present;
- Go back closes without a request;
- confirmation sends once and disables repeated submission;
- success and recoverable failure messages are correct; and
- keyboard/dialog accessibility behaviour works.

API tests will verify:

- authoritative Supabase data is used;
- missing and expired quotes are rejected;
- first confirmation records acceptance and sends the owner email;
- a repeated confirmation does not duplicate the request event or email;
- a recorded request with a failed notification can safely retry; and
- a successful notification is marked in Supabase.

Email tests will verify the recipient, Reply-To, subject, dates, party composition, complete price breakdown, deposits and unsecured-dates wording.

Database verification will confirm the migration, function permissions, RLS posture, first-request transition and idempotent repeated-request behaviour. Supabase security and performance advisors will be checked after applying the migration.

Before deployment, run the full test suite, production build and live end-to-end verification against a test quotation. The verification must not submit a real customer request without explicit approval.

## Rollout

1. Add tests and implement the application changes locally.
2. Apply and verify the migration in the Coco Palms Supabase project.
3. Run advisors, the full automated test suite and production build.
4. Publish to GitHub and allow the linked Vercel dev deployments to complete.
5. Verify the confirmation dialog and Supabase state on the dev site using a controlled test quotation.

No admin interface, date hold, booking creation or payment collection is included in this change.
