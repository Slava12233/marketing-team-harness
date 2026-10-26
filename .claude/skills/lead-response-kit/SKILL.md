---
name: lead-response-kit
description: "Write the lead response kit for one funnel: what happens in the first minutes and hours after someone clicks a click-to-WhatsApp ad or sends an instant form. The WhatsApp pre-filled first message (the page_welcome_message object), the greeting, the off-hours auto-reply, a qualification script (at most four questions), a booking script, holding lines, the reply SLA, the qualification rubric and the escalation line; for instant forms the thank-you screen, the first call script and the Leads Center path. In the company's language, compliance-checked, for the Owner to approve before any line is used. Use before the first click-to-WhatsApp or lead-form ad of a funnel runs, when the person who answers leads changes, or when the Owner asks for reply scripts."
---

# Lead response kit

The ad buys a click; the reply decides whether the click becomes a customer. This skill writes, for one funnel, every line the person who answers leads will send or set up, so the first reply is fast, consistent, compliant and asks only what qualifies the lead.

**Output:** `plans/YYYY-MM-DD-lead-response-kit.md` (one kit per funnel; add `-<funnel>` to the name when the company has more than one, for example `plans/2026-11-03-lead-response-kit-members.md`), a living plan with the vault frontmatter (below). **Language:** the plan's frame (headings, notes, the rubric's reasoning) in English; every line a lead will read, in the language of the funnel's audience from `config/brand.md` and `config/audiences.md`, quoted as written; the chat summary in the chat language of `config/operator.md`.

**Owner-facing.** The kit is a draft until the Owner approves it. No line is used, set in WhatsApp, pasted into a form or put into an ad before that approval. The harness never sends a message, never answers a lead, never reads an inbox or a lead row to write this kit.

## Read first
1. `config/operator.md`: the chat language, the timezone, the **working days**, the replies row of "Who clicks what" (who answers leads, and within how long).
2. `config/product.md`: the funnels table (audience, entry, destination, **what counts as a result**), what the product does and **does not do**, the destination pages and key copy in use (quoted verbatim), any booking link.
3. `config/claims.md`: allowed claims with their sources, forbidden words and claims, lines that need clearance, consent and notice ids (by id only), the jurisdiction notes ("verify with your lawyer"), whether marketing messages need prior written consent.
4. `config/audiences.md` (who the audience is, its language, what it must never be addressed as) and `config/brand.md` (languages and direction, tone of voice, form of address, do-not-do list).
5. `config/accounts.md`: `whatsapp_number_names` (names only), `lead_form_ids`, `lead_delivery` (Leads Center by default).
6. `config/goals.md`: the target cost per result for the funnel (the rubric's bar is set by what the Owner pays for).
7. `config/intake.md`, section 8 "The lead path", when it exists: the Owner's own answers on hours, the reply promise, what qualified, booked and closed mean.
8. The platform notes: [[2026-10-26-page-welcome-message-exact-spec]], [[2026-10-26-whatsapp-inbox-reads]], [[2026-10-21-instant-form-button-types]] (under `memory/learnings/meta-platform/`), and `memory/business/funnels.md`.

A fact the files do not give (hours, the reply promise, what "qualified" means) is asked of the Operator with AskUserQuestion (English, four questions a round, recommended option first); never invented. "Not stated" is written as such and becomes an open question in the kit.

## The kit, section by section

Write the sections that apply to the funnel's entry (`config/product.md`): sections 1–3 for every funnel, 4 for click-to-WhatsApp, 5 for instant forms, 6–7 always.

### 1. Header
Funnel, entry (click-to-WhatsApp / instant form), audience, language and direction, the WhatsApp number by name or the form by id and name, who answers (a role or first name from `config/operator.md`; never a phone number or email), working days and hours with the timezone, status (`draft` until the Owner approves).

### 2. The SLA
- **First reply** within N working hours, N from the replies row of `config/operator.md` (or the intake's promise); recommended when unstated: within 1 hour inside working hours, and by the first working hour of the next working day outside them.
- **Outside working hours** the off-hours auto-reply (section 4.3) answers at once and names when a person will reply, in the timezone of `config/operator.md` and the working days written there.
- **Follow-up:** one reminder after 24 hours of silence from the lead, then none; a lead who says stop is never written to again.
- On the WhatsApp Business **Platform** (API) rather than the app, a business message outside the 24-hour window after the lead's last message needs an approved template: say so in the kit when `config/accounts.md` does not say which one the number runs on.

### 3. The qualification rubric
What makes a lead **qualified** for this funnel, built from `config/product.md` (who the product is for, what it does not do, the result) and the intake's answer: two to four criteria, each observable from the conversation or the form (for example: in the service area; wants what the product actually offers; timing within N weeks; the right size or budget band when the product has one). Then the definitions the `lead-quality` skill counts: **lead** (a conversation started or a form sent), **qualified** (meets every criterion), **booked** (the funnel's next step agreed: a call, a visit, a trial), **closed** (the funnel's final result as `config/product.md` defines it). Never a criterion on a personal attribute (religion, origin, ethnicity, health, family status, sexual orientation, financial hardship, age beyond a legal minimum) and never a criterion the special ad category of `config/audiences.md` forbids targeting on.

### 4. Click-to-WhatsApp
**4.1 The pre-filled first message** (what the lead sends with one tap; the conversation counts as started only once it is sent). One short line per ad language, a question the greeting can answer, no personal data asked for, nothing the claims sheet does not allow. It goes into the ad at creation (creatives are immutable) as `page_welcome_message` at the **`object_story_spec` level** of the inline creative, as a JSON string, exactly this shape from [[2026-10-26-page-welcome-message-exact-spec]]:

```json
{"type":"VISUAL_EDITOR","version":2,"landing_screen_type":"welcome_message","media_type":"text","text_format":{"customer_action_type":"autofill_message","message":{"autofill_message":{"content":"<the pre-filled line, in the ad's language>"}}}}
```

Inside `link_data` the same object makes the MCP return a bare INTERNAL error. Without it the chat opens with Meta's English default. Ice-breakers (up to four, 80 characters each) are the alternative the earlier note names; their object shape is not in a platform note, so verify it before a build. Write the line into the flight plan's copy table too, so `meta-campaign-build` uses it; many chats may still open with Meta's default pre-fill (cause unverified, [[2026-10-26-whatsapp-inbox-reads]]): the greeting must read well after either.

**4.2 The greeting** (the business's automatic first reply to a new chat): thanks, who is answering, one line of what happens next, the first qualification question. Set by the person who holds the number: WhatsApp Business app → Settings → Business tools → Greeting message (labels drift; the outcome is an automatic reply to new chats).

**4.3 The off-hours auto-reply:** received, when a person will answer (working days and hours from `config/operator.md`, with the timezone), and an optional question to answer meanwhile. Set in Business tools → Away message → "Outside of business hours", with the business hours set in the business profile.

**4.4 The qualification script:** at most **four questions**, one at a time, each tied to a rubric criterion (section 3); plain, polite, in the brand's form of address; the reply when a lead does not qualify (thank them, say plainly what the company does not offer, point to nothing the claims sheet does not allow). Never ask for an id number, a card or bank detail, a password, or health, religion, origin or any personal attribute.

**4.5 The booking script:** offer the next step as two concrete options (two time slots inside working hours, or the booking link from `config/product.md`), confirm in writing (what, when, how long, who calls whom), one reminder line for the day before. Mark the chat in the app (a label "booked") so the weekly count is easy; the harness never reads the chats.

**4.6 Holding lines** (three to five): for "I'll check and come back", "a colleague will answer this", a price question the claims sheet does not clear ("the price depends on …; <role> will send it today"), a question outside the product's scope, a late reply ("sorry for the wait"). Save them and the scripts as Quick replies in the WhatsApp Business app (Business tools → Quick replies) so they are typed with a shortcut.

### 5. Instant form
**5.1 The thank-you screen** (the form's completion screen): headline, one or two lines of what happens next and when (the SLA in the lead's words), and the button the form editor offers (for example View website or Call business, pointing at a destination of `config/product.md`). Set by the Owner in Meta Business Suite → All tools → Instant forms, on the form named in `config/accounts.md` (there is no lead-form tool; a published form cannot be edited, so a change is a new form and a new ad).
**5.2 The first call script:** who is calling and why ("you asked about … on Facebook / Instagram"), the qualification questions of 4.4 adapted to a call, the booking of 4.5, the not-qualified close, and the voicemail line plus one written follow-up (by the channel the lead gave consent for, as `config/claims.md` says; consent wording is never written here).
**5.3 The Leads Center path:** Meta Business Suite → All tools → Leads Center (the default `lead_delivery`; or the route `config/accounts.md` names): new-lead notifications reach the person who answers; each lead is moved through stages that mirror section 3 (new, contacted, qualified, booked, closed, not qualified; rename or add stages where Leads Center allows, else use its notes). The weekly counts of `lead-quality` are read from those stages **by the Owner or the Operator**, never by the harness. Leads stay in Leads Center (or the company's CRM); never exported into this folder.

### 6. The escalation line
When a person (the Owner or the role named) takes over at once, and the line the answerer sends: a complaint or an angry lead; a legal, medical, financial, tax or other regulated question (the product's own limit from `config/product.md` quoted; no advice given); a request to see, correct or delete personal data; a minor; anything the claims sheet marks HOLD. "Stop" or "unsubscribe" ends all messages to that lead at once.

### 7. Compliance verdict and approval
The `compliance-check` verdict table for every string (PASS / FIX / HOLD), then **Safe to use: yes/no**. Then the approval block: `Approved by the Owner: <date>, "<the Owner's words, quoted>"`, blank until given.

## Compliance rules for every line
- **No consent or notice wording of our own.** Where a line needs consent text (a form notice, a marketing opt-in), quote the id from `config/claims.md`; when none exists, the line is a HOLD for the Owner, never drafted.
- **No regulated advice** (medical, legal, financial, tax, licensed activities): the scripts route those questions to the escalation line.
- **Never a claim that is not in `config/claims.md`** with its source; lines that need clearance are used only once cleared; no price, discount, guarantee or date promise the page does not make.
- **Personal attributes are never used:** no question, label or reply that assumes or asks a religion, origin, ethnicity, health, family status, sexual orientation or financial hardship; language and intent framing only.
- **Replies, not marketing.** The kit answers the lead's own request. Any later marketing message (a broadcast, a newsletter, an SMS campaign) needs the prior consent `config/claims.md` describes and is outside this kit.
- No personal data in the plan: roles or first names of the answerers only, never a lead's name, phone or email, never a number.

## Procedure
1. Read the files above; pick the funnel (ask the Operator with AskUserQuestion when more than one has a click-to-WhatsApp or instant-form entry; recommended: the first funnel of `config/goals.md`).
2. Ask, in one round of at most four questions, only what the files leave open (hours, the reply promise, the qualification criteria, who takes escalations), recommended option first.
3. Draft the kit in the plan file (sections 1–7). Drafting may be delegated to `copywriter` (opus) with the file paths above; the main session keeps the plan.
4. **Run the `compliance-check` skill on the whole kit** (every string, every language), or hand it to `compliance-reviewer` (sonnet): apply each FIX in the file, list each HOLD for the Owner. Write the verdict table into section 7. A kit with an open HOLD is not offered for approval as "safe to use".
5. Hand it over in the chat language: the funnel, the SLA, the four questions, the HOLDs, and the question "approve the kit?" (AskUserQuestion: "Approve as written (Recommended)", "Change some lines", "Not now"). Never mark it approved on an Operator's word alone.
6. **On the Owner's approval** (main session): the approval block filled with the Owner's words quoted, `status: active` in the frontmatter, a decision note `memory/decisions/YYYY-MM-DD-lead-response-kit-<funnel>.md` (one writer), the pre-filled line copied into the flight plan's copy table, a line in today's session note, and a `checklist.md` row for each setup click (greeting, away message, quick replies, business hours, thank-you screen, Leads Center stages and notifications), owner Owner or the answerer. The rubric's definitions go to the funnel's flight note under `## Lead counts` (see `lead-quality`).

## Plan frontmatter
```yaml
---
type: plan
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft            # active once the Owner approves
maintained_by: harness   # or agent:copywriter when drafted by the agent
categories: [plans, leads]
summary: "Lead response kit for the <funnel> funnel: pre-filled message, greeting, off-hours reply, qualification and booking scripts, SLA, rubric, escalation; awaiting the Owner's approval."
funnel: <funnel name as in config/product.md>
---
```

## Do not
- Send, schedule or paste anything into WhatsApp, Messenger, a form or a CRM: every setup step is a click list for the person who holds that tool.
- Read an inbox, a chat, Leads Center or a CRM to "learn the voice" or count leads; an inbox is read only when the Owner asks, mouse only, nothing copied here ([[2026-10-26-whatsapp-inbox-reads]]).
- Change a live ad to fix a pre-filled message: creatives are immutable, a new line means a new ad (`meta-campaign-build`).
