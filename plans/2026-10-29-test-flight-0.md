---
type: plan
created: 2026-10-29
updated: 2026-10-29
status: active
maintained_by: harness
categories: [plans]
summary: "Pipeline test (the Owner's ask 2026-10-29): fal creatives → compliance → upload → a PAUSED click-to-WhatsApp campaign 'TEST — harness pipeline — do not activate'; never activated, left paused."
---

# Test flight 0 — harness pipeline test (never activated)

The Owner asked on 2026-10-29: "תעשה לי קמפיין רנדומלי רק לצורך הבדיקה, תיצור הכל א-ת עם קריאייטיבים חדשים כדי לבדוק את FAL". fal spend approved in chat (~$0.27). The campaign is built PAUSED in the shared account `1010578430110331`, is never activated, and stays paused afterwards (the Owner's choice; deleting it is his click). It is not the first flight: `plans/2026-10-29-first-flight-plan.md` stays the real plan.

## Settings

| Item | Value |
|---|---|
| Campaign | "TEST — harness pipeline — do not activate", `OUTCOME_ENGAGEMENT`, special ad categories NONE |
| Ad set | Israel, `location_types ["home","recent"]`, age 25–65, Hebrew; click-to-WhatsApp to Page `108204445697760` ("Habait main"); daily budget ₪25 (never switched on) |
| Ads | #T1 the still (4:5), #T2 the video (9:16) |
| AI disclosure | badge "הדמיה" on both files; ad-level `self_disclosure` OPT_IN |

## Copy (Hebrew, both ads)

| Field | Text |
|---|---|
| Primary text | HABAIT היא פלטפורמת PropTech שמחברת בין יזמים בישראל לבין רוכשים מכל העולם, בעזרת AI. רוצים לשמוע איך זה יכול לעבוד לפרויקט שלכם? שלחו לנו הודעה בוואטסאפ. |
| Headline | דברו איתנו בוואטסאפ |
| On the image | ליזמים בישראל / פלטפורמה שמחברת יזמים בישראל לרוכשים מכל העולם (compliance FIX; the first version is superseded) |
| Pre-filled WhatsApp message #T1 | היי, אשמח לשמוע על HABAIT ליזמים #T1 |
| Pre-filled WhatsApp message #T2 | היי, אשמח לשמוע על HABAIT ליזמים #T2 |

## Media

| # | File | Source | image_hash / video_id |
|---|---|---|---|
| T1 | `creatives/2026-10-test-developers-flight-0/stills/CREATIVE_S01a_platform-connects_4x5.png` (S01 superseded by the compliance FIX) | fal `fal-ai/nano-banana-2` request `01a188df-f8ae-7e33-8098-205fbad727f0` + local text and badge | `591e20b896ac3fd4bea0d0d41612ab67` |
| T2 | `creatives/2026-10-test-developers-flight-0/video/CREATIVE_V01a_platform-connects_9x16.mp4` (V01 superseded by the compliance FIX) | fal `fal-ai/nano-banana-2` request `01a188e0-35a9-7e01-a0f6-4709124580ef` → `blackforestlabs/flux-3-max/image-to-video` request `01a188e0-96ae-7310-8394-d7dd7aed08c9`, 5 s, audio removed, local text and badge | video `1840705657062222` (thumbnail `591e20b896ac3fd4bea0d0d41612ab67`) |

## fal cost (ledgered)

2 × `fal-ai/nano-banana-2` at $0.08 + 5 s `flux-3-max/image-to-video` at $0.02125/s ≈ $0.27 (rate × units, estimate).

## Ids

(filled after the build)
- Campaign `120249096272270532` "TEST — harness pipeline — do not activate" (PAUSED, daily ₪25 CBO, spend cap ₪750; created 2026-10-29)
- Ad set `120249096273870532` "TEST — IL developers — WhatsApp" (PAUSED, CONVERSATIONS → WHATSAPP, Page `108204445697760`, IL home+recent, age 25+, Advantage+ audience on)
- Superseded uploads (not used in ads): image `26c58872a02ab46156a4425855b252b2`, video `1417132363422853`
- Compliance: `creatives/2026-10-test-developers-flight-0/compliance-review.md` (one FIX applied)
