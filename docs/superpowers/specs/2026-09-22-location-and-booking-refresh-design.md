# Coco Palms location and booking refresh

## Goals

- Restore homepage hero-copy readability without darkening the photograph.
- Replace the current Location & Amenities collage with the six supplied photographs in a responsive editorial layout.
- Expand the location page with useful, current links for Jolly Harbour facilities, restaurants and boat charters.
- Make Rates & Availability the single canonical page for checking dates and obtaining a quotation.

## Homepage hero

The photograph remains unfiltered. The eyebrow, title, supporting copy and actions sit inside a compact, translucent navy panel. The panel follows the content width, uses modest rounding and padding, and becomes nearly full-width on small screens. This keeps the contrast local to the words rather than placing an overlay across the image.

## Location & Amenities page

The opening sentence changes to: “Coco Palms is situated on Harbour Island on Antigua’s west coast, within the gated Jolly Harbour community.”

The existing single collage is removed. The six supplied images form an editorial mosaic:

- the aerial waterfront view is the wide visual anchor;
- portrait sunset and mooring photographs retain taller crops;
- pool and terrace photographs fill the supporting landscape tiles;
- desktop uses a structured multi-column grid;
- tablet and mobile progressively reduce to two columns and then one column without horizontal scrolling.

The page content is organised into four guest-focused sections:

1. Jolly Harbour on the doorstep, including Jolly Harbour village and the Sports Centre/Village.
2. Nearby dining, with concise descriptions, approximate mileage from Coco Palms and external links.
3. From the Coco Palms mooring, featuring Barefoot Antigua, Antigua Vibes and Catch the Cat.
4. Concierge support, explaining that the on-island concierge can help with reservations, charters and other guest needs.

“Palms” is intentionally omitted following the owner’s clarification. Venue names use their verified spellings, including Catherine’s Café, Wild Tamarind, Loose Cannon and Shirley Heights.

External links open in a new tab and use `rel="noreferrer"`. Distances are presented as approximate guest-planning guidance rather than exact navigation promises. The Hut, which is reached by boat, is described with an approximate boat distance instead of road mileage.

## Canonical rates and quotation journey

`/rates-and-availability` becomes the canonical booking page. It contains:

- the existing Rates & Availability heading and introductory copy;
- payment information and the published seasonal rates;
- the interactive quotation calendar;
- party and contact details;
- immediate itemised quotation results and the existing email/booking-request flow.

The page reuses the existing `QuoteForm`, so there is only one selectable calendar and no duplicated availability state.

Every “Get Quotation” call to action points to `/rates-and-availability`. The navigation’s Rates & Availability link already points there. `/get-quotation` becomes a permanent server redirect to the canonical page, preserving arrival and departure query parameters when present.

## Accessibility and responsive behaviour

- All supplied images receive descriptive alternative text.
- The hero panel maintains readable contrast while leaving the rest of the image untouched.
- External directory links have clear names and visible keyboard focus inherited from the site.
- Location cards and the image mosaic reflow at the existing tablet and mobile breakpoints.
- The quote form preserves its current mobile number steppers and one-column result layout.

## Verification

- Component tests assert the hero panel exists and that all quotation links use the canonical route.
- Location tests assert the new opening copy, six-image mosaic, venue/charter links, distances and concierge message.
- Rates tests assert the complete quotation form and rate/payment information appear together.
- Redirect tests verify `/get-quotation` preserves supported query parameters.
- Full unit tests, production build and browser checks at desktop and phone widths are required before deployment.
