---
type: business
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [business]
summary: "FICTIONAL EXAMPLE. The Acme Fitness membership (gyms + app): the promise, the copy in use on /join and /corporate/call (verbatim), languages and the assets cleared for ads."
evidence: "config/product.md"
---

# Product: what it is and what its pages say

> FICTIONAL EXAMPLE. Every page, line and asset is invented. Filled by `/setup` from `config/product.md` on 2026-10-26.

## What

- **Product name:** Acme Fitness membership (gyms + app)
- **One-line promise:** "Small classes, real coaches, three gyms, one app."
- **What it does:** access to all three gyms, coached small-group classes booked in the app, a training plan, a phone pass to the door; corporate packages add a monthly on-site session and a usage report by headcount (no names).
- **What it does not do:** no medical, physiotherapy or nutrition advice; no weight-loss or health-outcome promises; no personal-training packages in ads; no online-only membership.

## Homepage promise (copy in use)

- "Small classes, real coaches, three gyms, one app." (the one-line promise, https://acmefitness.example)

## Main call to action (the page the first funnel sends to)

- https://acmefitness.example/join: H1 "Train with us free for 7 days.", sub-headline "7-day free trial, no card needed.", button "Start my free week"; fields name, email, phone, home gym; notice `join-notice-v1`.

## Path after the conversion

- The trial confirmation screen fires `StartTrial` (after cookie consent); the member books a first class in the app.

## Other destination pages

- https://acmefitness.example/corporate/call: H1 "20 minutes on your team's wellbeing.", button "Book the call"; slots Mon–Fri 09:00–17:00 UK time; notice `corporate-notice-v1`.

## Other pages

- "Three gyms across Manchester. One app for all of them." (below the form, /join)
- "Cancel anytime." (FAQ, /join; not cleared for ads, see [[claims-and-compliance]])

## Languages

- English only, left to right; both destination pages are English.

## Existing assets

- Logo wordmark (charcoal and white), 40 class photos with signed model releases, a 30-second gym tour video (16:9 and 9:16), app screenshots (booking, plan, door pass); all cleared for ads, held by the web team.
