---
type: report
created: 2026-10-29
updated: 2026-10-29
status: done
maintained_by: agent:compliance-reviewer
categories: [reports, compliance]
summary: "Compliance gate for test flight 0 (PAUSED, never activated): primary text, headline, WhatsApp messages and badge pass; on-image headline needs one FIX (outcome framing); video checked from its overlay source only."
---

# Compliance review: test flight 0 (2026-10-29)

Scope: copy table of `plans/2026-10-29-test-flight-0.md`, S01 still, V01 video. Market Israel, audience real-estate developers, Hebrew, click-to-WhatsApp. Rules: `config/claims.md`, `config/brand.md`, `config/audiences.md`.

## Strings

| Element | Verdict | Reason |
|---|---|---|
| Primary text | PASS | Both statements restate the two allowed Page-bio claims (platform connecting developers in Israel with buyers worldwide; uses AI). No price, yield, outcome, fee or broker claim. Addresses developers as a business ("לפרויקט שלכם"). The invitation to message on WhatsApp is not a promise. |
| Headline "דברו איתנו בוואטסאפ" | PASS | A plain call to action, no claim. |
| On-image kicker "ליזמים בישראל" | PASS | Business framing, no personal attribute. |
| On-image headline "הפרויקט שלכם פוגש רוכשים מכל העולם" | FIX | It states as fact that the viewer's project meets buyers. That is an outcome statement, beyond the allowed claim, which says only that Habait connects developers with buyers (Forbidden list: results and outcome promises; brand tone: no promises of results). Replace with "פלטפורמה שמחברת יזמים בישראל לרוכשים מכל העולם" (the allowed claim 1), or "הפרויקט שלכם, מול רוכשים מכל העולם". Re-render S01 and V01 overlay after the change. |
| Pre-filled WhatsApp message #T1 | PASS | Neutral request for information. The "#T1" tag is an attribution marker, not consent wording. |
| Pre-filled WhatsApp message #T2 | PASS | Same as #T1. |

## Files

| File | Verdict | Reason |
|---|---|---|
| `stills/CREATIVE_S01_global-buyers_4x5.png` | PASS (text per the FIX above) | Generated building photo carries the badge "הדמיה" (white on #041F6E, bottom-left, inside the safe zone), as `config/brand.md` requires. Nothing presents it as a real project or address, and it shows no price, date, button, logo or competitor. It is a generic construction scene, not a specific project for sale, so special ad category NONE holds. Per `config/claims.md`, confirm that in Ads Manager before activation (it is never activated here); declare HOUSING if a specific project is shown. Architecture and palms look Mediterranean, not clearly Israeli; the badge covers that. Minor: AI lettering on the crane is unreadable and is not a brand name. |
| `video/CREATIVE_V01_global-buyers_9x16.mp4` | PASS, with a caveat | I could not play or decode the mp4. I checked the overlay source `V01-badge-9x16.html` (same text, badge "הדמיה" white on #041F6E, bottom-left, 300px above the bottom edge, inside the Reels safe zone). It is silent, so there is no AI-voice or music rights question. The FIX applies to this overlay too. Before upload, someone should open the rendered mp4 and confirm the badge is on every frame and the generated clip shows no logo, readable brand or distorted text. |

## Ad-level and build conditions (not copy)
- Set ad-level AI self-disclosure OPT_IN on both ads, because both assets are generated (brand rule).
- Special ad category NONE in Israel stands for this B2B test. Confirm in Ads Manager before any real activation.
- The Page-bio line "ללא עמלת תיווך" is not used. It stays on the clearance list.
- No consent or notice sentence is introduced; none needed for a click-to-WhatsApp ad.
- The test is built PAUSED in the shared account and never activated.

Safe to build: no (one FIX on the on-image headline; apply it, then yes).
