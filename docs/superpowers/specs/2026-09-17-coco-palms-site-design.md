# Coco Palms Website Design

## Purpose

Build a new mobile-first website for Coco Palms Antigua that presents the villa attractively, provides live availability and calculator-accurate quotations, records enquiries, and gives the owner a protected management interface. The first release will be deployed to a Vercel preview URL only. The existing `www.cocopalms-antigua.com` domain will remain unchanged until a separate launch decision.

## Delivery scope

The first release includes:

- A responsive public website with Home, The Villa, Gallery, Location and Amenities, Rates and Availability, and Contact pages.
- A live quotation journey using the existing Coco Palms Supabase database and the supplied quotation calculator as the pricing authority.
- Availability checks against bookings, holds, and calendar blocks.
- A public availability calendar that disables dates already booked or blocked in Supabase.
- Two-way synchronization between Supabase availability and the designated Google Calendar.
- Saved quotations that can be displayed on screen and emailed through Resend.
- A protected quotation list and quotation-detail view for management.
- A Supabase-backed gallery with Exterior, Interior, and Local Area sections.
- Twelve managed image positions in each gallery section.
- A protected owner interface for gallery image upload, replacement, labelling, ordering, publishing, and hiding.
- Contact and promotional-consent capture.
- A Vercel preview deployment for review.

Payment collection, final booking conversion, consolidated management reporting, Instagram feed automation, and the production-domain switch are subsequent releases. Their existing database structures and integration points must be preserved.

## Technical architecture

- Next.js App Router with TypeScript, React, and server-side route handlers.
- Vercel preview deployments; no production deployment or domain reassignment without explicit approval.
- Existing Supabase project `zhpzopbpqzdybvkvhdkf` for database, authentication, and image storage.
- Resend for quotation and contact emails.
- Supabase publishable credentials may be used in the browser only for RLS-protected public reads and approved public submissions.
- Privileged credentials must remain server-only and must never use a `NEXT_PUBLIC_` prefix.
- Pricing calculations must run on the server or inside a secured database function, never from client-supplied totals.

## Security correction

The existing `public.is_admin()` function currently returns true for every caller while `admin_users` is empty. This bootstrap behavior must be removed before exposing any management interface.

The migration will:

- Change `is_admin()` so it returns true only when `auth.uid()` exists in `public.admin_users`.
- Keep the function narrowly scoped, with a fixed search path and explicit execute grants.
- Enable RLS on `public.site_settings`.
- Permit anonymous and authenticated users to read site settings.
- Prevent anonymous and non-admin authenticated users from inserting, updating, or deleting site settings.
- Permit authenticated administrators recorded in `public.admin_users` to manage site settings.
- Preserve `service_role` access for trusted server operations.

There are currently no Supabase Auth users and no rows in `admin_users`. The management interface therefore remains locked until the owner's account is deliberately created and added to `admin_users`.

## Public navigation

Desktop navigation is conventional and always visible. Mobile navigation uses a burger menu.

1. Home
2. The Villa
3. Gallery
4. Location and Amenities
5. Rates and Availability
6. Contact

The primary call to action throughout the website is **Get Quotation**. It opens the quotation journey, which checks availability as part of calculating and issuing the quotation. **Book now** is not shown until a later booking release and must not imply that an unconfirmed quotation reserves dates.

## Visual direction

- Modern, warm Caribbean luxury without excessive opulence.
- Generous photography, clean spacing, refined typography, and strong mobile layouts.
- Primary palette: deep teal, seafoam, sand, restrained gold, and charcoal.
- Use `#00555A` as the corrected initial deep-teal value.
- Copy must describe Coco Palms as **waterfront**, never beachfront.
- Copy must not claim the villa is fully staffed.
- Management and concierge services may be described only as available services, not permanent on-site staffing.

## Homepage

The homepage uses the supplied `cocopalmshero.jpg` as its initial hero image. The current file is 320 by 320 pixels, so it is temporary pending a higher-resolution original. The implementation must use responsive cropping and avoid stretching the image beyond what is necessary for the preview.

The homepage includes:

- Hero heading: `Your private slice of Caribbean paradise`.
- Location: `Harbour Island, Jolly Harbour, Antigua`.
- A prominent **Get Quotation** action.
- A concise property summary: waterfront villa, sleeps up to eight, four bedrooms, private pool, and concierge services available.
- Three linked image tiles:
  - Exterior uses `rear exterior.JPG`.
  - Interior uses `interior great room.JPG`.
  - Local Area uses `antigua.jpg`.
- Each tile opens the corresponding anchored Gallery section.
- Selected published reviews.
- A closing availability call to action.

## Footer and social links

The footer and Contact page include accessible icon links opening in a new tab:

- Instagram: `https://instagram.com/cocopalmsantigua`
- Facebook: `https://www.facebook.com/CocoPalmsAntigua`
- YouTube: `https://youtube.com/playlist?list=PLwXTViDKSTJCSVWwM0gx7GPf0-2TPICz_`

Icons require visible focus states, accessible labels, and safe external-link attributes.

## Gallery

The public Gallery has three anchored sections in this order:

1. Exterior
2. Interior
3. Local Area

Each section supports twelve ordered image positions. Empty positions are visible in the management interface but hidden from public visitors.

Each image record contains:

- Property identifier
- Section
- Storage path
- Owner-editable visible label
- Owner-editable alt text
- Display order from 1 to 12 within its section
- Published status
- Creation and update timestamps

The owner can upload, replace, label, reorder, publish, hide, and remove an image through the protected management interface. Public users can read published image metadata and view published files only.

## Property content

The Villa page consolidates the principal description, bedrooms, bathrooms, living spaces, outdoor spaces, waterfront position, dock, pool, and amenities. Bedrooms remain sections of the Villa page rather than separate top-level pages in the first release.

The Location and Amenities page includes Jolly Harbour facilities, nearby beaches, restaurants, shopping, activities, transport, and available concierge services. It must distinguish between waterfront access at the villa and nearby beaches.

## Rates and availability

Rates are read from active Supabase rate periods rather than hard-coded into the page. The initial advertised base rates are:

| Period | Weekly base | Nightly base |
| --- | ---: | ---: |
| 15 May to 15 November | $7,000 | $1,000 |
| 16 November to 17 December | $8,400 | $1,200 |
| 18 December to 3 January | $10,500 | $1,500 |
| 4 January to 14 May | $8,400 | $1,200 |

The availability page displays a responsive month-by-month calendar. Dates covered by confirmed bookings or active calendar blocks in Supabase are visibly unavailable and cannot be selected. Available dates remain selectable, and selected arrival and departure dates are clearly distinguished. The quotation form and public calendar use the same availability query so they cannot disagree.

A departure date is treated as available for a new arrival unless a separate changeover block covers that date. A quotation does not reserve dates. If requested dates are unavailable, the system proposes nearby valid alternatives that satisfy the minimum-stay rules.

## Google Calendar synchronization

Supabase is the availability source of truth. The designated Google Calendar synchronizes in both directions:

- Confirmed bookings and manual calendar blocks created or updated in Supabase create or update Google Calendar events.
- Events created, changed, or deleted in the designated Google Calendar are imported into Supabase as external calendar blocks.
- Synced records store the Google Calendar event identifier, source, synchronization status, last-synchronized timestamp, and relevant error details.
- Synchronization is idempotent and must not create duplicate events or feedback loops.
- Deleting or cancelling a synchronized booking or block updates or removes the corresponding Google event according to its status.
- Import failures must not mark dates available; the last successfully synchronized state remains effective and the failure is visible to management.

Google access credentials and refresh tokens are stored only in encrypted server-side environment configuration. They are never exposed to the browser or stored in public tables. A secured scheduled server task performs periodic reconciliation, and confirmed booking or block changes request an immediate synchronization attempt.

## Quotation inputs

The visitor supplies:

- First and last name
- Email address
- Optional telephone number
- Arrival date
- Departure date
- Number of guests aged six or over
- Number of children under six
- Promotional-contact consent, unticked by default

Total occupancy is the sum of both guest groups and cannot exceed eight.

## Authoritative quotation rules

The spreadsheet calculator is authoritative where it conflicts with duplicated database values or supporting policy wording.

- Standard minimum stay: five nights.
- Four-night stays are allowed with a $500 short-stay levy.
- Festive-period stays require ten nights.
- Seasonal accommodation is calculated night by night so cross-period stays use the correct blended base.
- Long-stay threshold: more than fourteen nights.
- Long-stay discount: 20 percent, applied only to nights beyond the first fourteen.
- Long stay may combine with one other eligible discount.
- Single occupancy: 10 percent when the calculator party count is fewer than three.
- Four-weeks-notice discount: 10 percent.
- Two-weeks-notice discount: 20 percent.
- Early-bird discount: 10 percent.
- Secondary-discount priority: single occupancy, two-weeks notice, four-weeks notice, early bird.
- ABST: 17 percent of the discounted accommodation base.
- Government levy: $5 per guest aged six or over per night.
- Children under six count toward occupancy but are excluded from the government levy.
- Processing and banking fee: 5 percent using the calculator's existing fee basis, including the security deposit.
- Refundable security deposit: $2,000, displayed separately from the quotation total.
- Booking deposit information: 50 percent.
- Balance information: remaining 50 percent due 70 days before arrival.

The displayed quotation includes an itemized breakdown and clearly identifies the refundable security deposit as additional. Internal commission, management fee, operating-cost, and revenue-allocation calculations are never shown publicly.

Every saved quote stores a permanent pricing snapshot, including rates, rules, discounts, taxes, fees, guest counts, dates, itemized amounts, availability at issue time, and calculator/policy version. Later configuration changes must not rewrite an issued quote.

## Quotation lifecycle

1. Visitor selects dates and guest counts.
2. Server validates occupancy and minimum-stay rules.
3. Server checks live availability.
4. Server calculates the quotation from trusted database configuration.
5. Server saves the customer, quote, and itemized quote records.
6. The website displays the result and availability status.
7. Resend emails the same quotation to the visitor.
8. The visitor can reopen the quotation through a non-guessable public token.

The first release does not accept payment or create a confirmed booking from the public interface.

## Contact journey

The Contact page captures name, email, optional telephone, message, and optional promotional consent. Successful submissions are stored in Supabase and emailed to the management address. The UI provides explicit success and failure feedback without revealing internal errors.

## Management interface

The management area is not included in public navigation. It uses Supabase Auth and verifies administrator membership server-side and through RLS. The first management capabilities are gallery administration and read-only quotation management, including a quotation list and itemized quotation-detail view. Future releases extend it to rates, discounts, availability management, bookings, content, reviews, contacts, and consolidated reporting.

## Accessibility and performance

- Semantic landmarks and heading hierarchy.
- Keyboard-operable navigation, forms, galleries, and controls.
- Visible focus indicators.
- Labels and validation messages associated with inputs.
- Descriptive alt text managed separately from visible gallery labels.
- Responsive optimized images with explicit sizes.
- Lazy loading below the fold and priority loading for the hero.
- Reduced-motion support.
- SEO metadata, canonical-ready URLs, Open Graph data, and structured property content.

## Testing

- Unit tests for rate segmentation, discounts, levy exclusion, tax, fee, security deposit, minimum stays, and occupancy validation.
- Integration tests for quote persistence, unavailable dates, pricing snapshots, and public-token retrieval.
- Integration tests for departure-day availability, booked-date disabling, Google-event idempotency, and synchronization reconciliation.
- RLS tests proving anonymous users cannot mutate `site_settings`, gallery metadata, or storage objects.
- RLS tests proving administrators can perform approved management actions.
- Responsive browser tests for navigation, homepage, gallery anchors, forms, quotation display, and social links.
- Production build verification before preview deployment.

## Acceptance criteria for the first preview

- The Supabase security advisor no longer reports `site_settings` with RLS disabled.
- Anonymous callers cannot obtain administrator privileges while `admin_users` is empty.
- The new public pages work on common mobile and desktop viewport sizes.
- Supplied hero and tile images appear in their agreed locations.
- **Get Quotation** is the prominent site-wide call to action and opens the complete quotation journey.
- Gallery sections support twelve managed positions each and hide empty positions publicly.
- A valid available stay produces a saved, itemized quotation matching the spreadsheet rules.
- Children under six count toward occupancy but not the government levy.
- An unavailable stay does not produce a false availability claim.
- Booked and blocked dates are disabled in the public calendar and quotation date selection.
- Two-way Google Calendar reconciliation is idempotent and preserves the last known unavailable state when synchronization fails.
- Contact and quotation submissions provide clear user feedback.
- The site is available at a Vercel preview URL.
- `www.cocopalms-antigua.com` remains unchanged.
