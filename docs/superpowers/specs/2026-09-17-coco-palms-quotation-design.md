# Coco Palms quotation page design

## Purpose

The quotation page will let a customer select available dates, describe the travelling party and receive an immediate itemised quotation. The website will record the quotation and email the customer a secure return link.

Quotation Calculator v15 is the pricing authority unless this specification records a later owner instruction. The owner has explicitly removed the calculator's automatic single-occupancy discount from website quotations.

## Customer journey

The page will use one mobile-first journey:

1. Select arrival and departure from a visual calendar.
2. Enter the number of adults, children aged 6–17 and children under 6.
3. Enter name and email address and accept the privacy wording.
4. Select **Get Quotation**.
5. See an availability result and a complete itemised quotation on the same page.
6. Receive the quotation by email with a secure return link.
7. Use **Book Now** from the result or secure quotation page to tell Coco Palms that they want to proceed.

The form retains the customer's entries when validation or availability checks fail. It displays a specific correction beside the relevant section and a summary near the action button.

## Calendar and availability

The quotation page will embed the same availability source used by the availability page. The customer will select both dates from this calendar rather than typing dates into date fields.

The calendar will:

- show one month at a time with previous and next controls;
- disable past dates;
- render booked or blocked nights without a selectable date number;
- allow an available arrival date followed by an available departure date;
- highlight every night in the selected stay;
- prevent a range that crosses an unavailable night;
- allow the departure date to equal the first day of a following booking;
- explain the normal five-night minimum, the four-night charge and the festive minimum before submission;
- remain fully usable on a mobile screen and with a keyboard.

Supabase remains the website's availability authority. `get_unavailable_ranges` combines confirmed bookings, active holds and `calendar_blocks`. A server-side synchronization job will read the approved public Google Calendar iCal feed and replace the Google-sourced rows in `calendar_blocks`. The import will be idempotent, preserve manual blocks and record the source as `google-calendar`.

The synchronization endpoint will require a server-held secret and will run on a schedule. The quotation API will always check Supabase again at submission time so an older browser calendar cannot create a quotation for dates that have since become unavailable.

## Party details

The customer will enter three values:

- adults;
- children aged 6–17;
- children under 6.

All guests count toward the maximum occupancy of eight. Only adults and children aged 6–17 incur the government levy. At least one adult is required. The quotation and stored record retain the under-six count.

## Pricing rules

The server will calculate the quotation from the active Supabase property, rate-period and booking-policy records. The customer browser will not supply prices or discount rates.

The approved website rules are:

- $1,000 per night from 15 May through 15 November;
- $1,200 per night from 16 November through 17 December;
- $1,500 per night from 18 December through 3 January;
- $1,200 per night from 4 January through 14 May;
- a five-night normal minimum;
- a four-night stay is permitted with a $500 short-stay charge;
- a stay containing a festive-period night requires at least ten nights;
- after the first 14 nights, each additional night receives a 20% discount based on the blended nightly rate;
- no automatic discount applies because of party size;
- no notice or early-booking discount is selected by a public customer;
- ABST is 17% of the discounted accommodation plus any four-night charge;
- the government levy is $5 per chargeable guest per night;
- banking and administration fees are 5% of accommodation after discounts, the four-night charge, ABST, government levy and the $2,000 security deposit;
- the refundable $2,000 security deposit remains separate from the quotation total;
- 50% of the quotation total is due to confirm;
- the remaining 50% is due ten weeks before arrival.

The server will round monetary line items to cents. The result will include rate-period subtotals when a stay crosses seasons.

## Quotation result

The result will display:

- the selected dates and number of nights;
- the party composition;
- each seasonal accommodation subtotal;
- the long-stay discount when applicable;
- the four-night charge when applicable;
- ABST;
- the government levy and the number of charged guests;
- banking and administration fees;
- the quotation total;
- the separate refundable security deposit;
- the amount due to confirm;
- the balance and its calendar due date;
- the quotation's expiry date and reference.

The wording will state that a quotation does not reserve dates. Selecting **Book Now** sends an enquiry to Coco Palms and does not create a booking or reserve the selected dates.

## Persistence, email and security

The browser will post only customer input to the Next.js quotation endpoint. The endpoint will validate the request, recheck availability and call the database quotation function with a server-side Supabase credential. Anonymous users will not receive direct write access to customer or quotation tables.

The server will save the customer, quotation, quotation items and creation event. It will return only the calculated result, public quotation reference and random public token. The public token must not expose a sequential database identifier.

After the database transaction succeeds, Resend will send an HTML and plain-text quotation email. An email failure will not discard the saved quotation. The result will tell the customer if the email could not be sent and allow a safe retry. The API will apply request throttling and generic error messages to reduce spam and data disclosure.

## Book Now enquiry

**Book Now** will not create a booking, reserve dates or take payment in this delivery. The server will email `hello@cocopalms-antigua.com` with:

- the customer's name and email address;
- arrival and departure dates;
- adults, children aged 6–17 and children under 6;
- the full itemised quotation and total;
- the quotation reference and secure management reference;
- `Website` as the quotation source;
- the time at which the customer selected **Book Now**.

The server will record a `book_now_requested` quotation event so management can distinguish an interested customer from someone who only generated a quotation. The customer will see confirmation that Coco Palms has received the request and will contact them. Repeated selections will not send duplicate emails within a short protection window.

## Data changes

The implementation will use the existing `properties`, `rate_periods`, `booking_policies`, `calendar_blocks`, `bookings`, `holds`, `customers`, `quotes`, `quote_items` and `quote_events` structures.

Required changes are limited to:

- removing the single-occupancy branch from the website calculation function;
- adding secure Google Calendar synchronization metadata if the existing `calendar_blocks.source` field is insufficient for stable event reconciliation;
- recording a `book_now_requested` event using the existing quotation event model;
- keeping all customer and quotation tables protected by RLS and revoking public execution of privileged write functions.

## Components

The existing availability calendar will be split into shared calendar-selection logic and page-specific presentation. The quotation flow will use:

- a selectable availability calendar;
- a party-details form;
- customer details and consent;
- an itemised quotation result;
- a secure saved-quotation page;
- a server quotation endpoint;
- a server Book Now enquiry endpoint;
- a Google Calendar synchronization endpoint;
- a customer quotation email template;
- a Coco Palms Book Now notification email template.

Calculation and validation will remain separate from presentation so the same cases can be verified in TypeScript and against the database function.

## Verification

Automated tests will cover:

- each seasonal boundary and a stay crossing rate periods;
- four-night, five-night and festive minimum rules;
- long-stay calculations at 14 and 15 nights;
- the absence of a small-party discount;
- children under 6 counting toward occupancy but not the levy;
- fee, ABST, deposit and balance calculations against Calculator v15 examples;
- unavailable-date and stale-calendar rejection;
- range selection that cannot cross blocked dates;
- Google iCal import, repeat import and removal of cancelled Google events;
- API validation and protection against public database writes;
- quotation persistence and customer email rendering;
- Book Now notification content, source attribution and duplicate-send protection.

Before preview publication, the implementation will run the full unit-test suite, production build, database security checks and a mobile browser walkthrough of the complete quotation journey.
