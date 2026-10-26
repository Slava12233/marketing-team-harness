<!-- Written by /setup on 2026-10-26. Edit by hand or re-run /setup. -->
<!-- FICTIONAL EXAMPLE. Every page, line and asset below is invented. -->

# Product

**Product name:** Acme Fitness membership (gyms + app)

**One-line promise:** "Small classes, real coaches, three gyms, one app."

**What it does:** Gives members access to all three Manchester gyms, coached small-group classes booked in the app, a training plan in the app, and a phone pass to the door. Corporate packages add a monthly on-site session and a usage report by headcount (no names) for the employer.

**What it does not do:** No medical, physiotherapy or nutrition advice; no weight-loss or health-outcome promises; no personal-training packages sold in ads; no online-only membership.

## Funnels

| Name | Audience | Entry | Destination URL | Conversion event | What counts as a result |
|---|---|---|---|---|---|
| Members | Members | Link ad (Feed, Stories, Reels) | https://acmefitness.example/join?ref=meta | `StartTrial` (pixel, fired on the trial confirmation screen after cookie consent) | A 7-day free trial started |
| Corporate wellness | Corporate | Instant form `500000000000001`, or link ad → page | https://acmefitness.example/corporate/call?ref=meta | Lead form submit, or `Schedule` (pixel) on the booking confirmation | A booked 20-minute call |

## Destination pages

| Language | URL | H1 as written | CTA as written | Pixel present | Notes |
|---|---|---|---|---|---|
| English | https://acmefitness.example/join | "Train with us free for 7 days." | "Start my free week" | yes | Pixel fires only after cookie consent. Form: name, email, phone, home gym; notice `join-notice-v1` |
| English | https://acmefitness.example/corporate/call | "20 minutes on your team's wellbeing." | "Book the call" | yes | Pixel fires only after cookie consent. Slots Mon–Fri 09:00–17:00 UK time; notice `corporate-notice-v1` |

## Key copy in use

- "Train with us free for 7 days." (H1, /join, English)
- "7-day free trial, no card needed." (sub-headline, /join, English)
- "Three gyms across Manchester. One app for all of them." (below the form, /join, English)
- "20 minutes on your team's wellbeing." (H1, /corporate/call, English)
- "Cancel anytime." (FAQ, /join, English; not cleared for ads, see `config/claims.md`)

## Existing assets

| Asset | What it is | Where it is | Cleared for ads |
|---|---|---|---|
| Logo | Wordmark SVG, charcoal and white | the website's brand folder (ask the web team) | yes |
| Class photos | 40 real class photos from the three gyms, with signed model releases | held by the web team | yes |
| Gym tour video | One 30-second tour (16:9) and its 9:16 cut, no voice-over, no music | held by the web team | yes |
| App screenshots | Booking screen, plan screen, door pass | the app's store listing | yes |
