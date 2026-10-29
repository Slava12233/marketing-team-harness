---
name: campaign
description: "Part 2 of the onboarding, the first campaign A to Z: a long interview in the Owner's language (as many rounds of four questions as needed: the company, the product and funnels, the audiences in depth, the brand, claims and law, competitors, creative preferences, goals and money, the campaign's own goal and go rules), config/*.md and the vault written, market research by agents in parallel (competitor-researcher on the Meta Ad Library and the web, audience research with targeting ids and reach, offer-design, the account's own past ads) into one dated report, a plan whose every choice cites the research, the Owner's numbered picks, copy through compliance, the creatives (the still rendered, pictures or video through fal only on a stated cost and the Owner's go), uploads, the campaign built PAUSED and shown as Meta's own previews. Nothing activated; the go for activation is a separate message. Use after /connect ends green, when the Operator types /campaign or /setup on a connected harness, or to plan a new campaign later."
---

# /campaign: the first campaign, A to Z

Part 2 of the onboarding. You interview the Owner about the company and the campaign for as long as it takes, research the market, write the plan, then produce, upload and build the campaign PAUSED and show it. `/connect` must have ended green first. You never activate, never raise a budget, never spend on fal without a stated cost and the Owner's go in the same message, and never write consent or disclosure wording.

The step bodies are shared: the interview rounds (a)–(i), the file write, the vault fill and the routines are steps 1, 5, 5.5 and 5.6 of `setup`; the production chain is `ad-copy` → `compliance-check` → `creative-production` → `meta-campaign-build` with `memory/maps/build.md` read first. This page adds the campaign rounds, the research, the order and the Owner's decision points. `CLAUDE.md` wins on any conflict.

## Step 0. Preconditions

0. **This folder's own business.** `node memory/tools/instance.mjs --check` exits 0. Exit 3 means a new copy: every copy is a new business, so a filled `config/` here belongs to someone else. Say so in one line and run `/connect` from its start (it resets the copy); never plan a campaign on another company's files.
1. **Language.** `config/operator.md` holds the chat language (`/connect` asked it). Every question, option, summary and Owner-facing note below is in it; files stay English. If the field is empty, ask the language question of `/connect` step 0 first.
2. **Connected.** Every console-steps row of `config/accounts.md` is `done` or `n/a`, the Meta tools are loaded, and the last `/health` had no red row. Otherwise say so in one line and run `/connect` from its first open chapter.
3. Read `memory/HOT.md`, `memory/state/current.md`, `checklist.md`, `config/*.md` (what is filled, what still holds `{{`), `memory/maps/create.md` and `memory/maps/build.md`, and the plan `current.md` names if one exists. Note today's date.
4. State the rules in two or three sentences: nothing is activated by this command; every budget is a proposal labelled "Needs the Owner's go"; fal costs are stated before any run and need the go in the same message.

## Step 1. The interview: as many rounds as needed

AskUserQuestion, in the chat language, four questions a round, the recommended option first and labelled "(Recommended)" (translated), "Other" always possible. Before every round, one line of progress: "round N of about M" (M is your current estimate; it may grow). **Look things up before you ask:** the Page bio and past posts (`ads_get_user_pages`, the Page in the Owner's Chrome if connected), the account's past campaigns and creatives (`ads_get_ad_entities`, `ads_get_creatives`, only the company's own on a shared account), the website (WebFetch) and the destination pages; what a read answers becomes that question's recommended option "(from your Page / your account / your site)", never a question asked blind. "I don't know" is valid and recorded as `not stated` or `open`.

Rounds, in this order (tick each on the page: `node dashboard/setup-page.mjs --mark interview.<letter>=done` for a–i):

1. **(a)–(i) of `setup`** as written: who runs this (a: confirm the Owner, the Operators and the language from `/connect`; ask timezone and working days), the company (b), the product and funnels (c), the audiences (d), the brand (e), claims and law (f), accounts and tracking (g, g2: mostly confirmed from `config/accounts.md`), routines and the go (h), goals and money (i). Skip a question whose answer `config/` already holds; confirm it in the round's read-back instead.
2. **(j) The campaign.** Its goal in one sentence; which funnel (the first funnel of round (i)); the one promise the Owner would make if only one line were allowed; what was tried before and what happened (the account's past ads shown as the recommended facts); what a good first month looks like in numbers the Owner already uses (conversations, meetings, sales).
3. **(k) The audience in depth** (one round per audience, two if needed): who exactly (role, company size, situation, the moment they look), where (country, regions, cities; the geo granularity Meta needs), the words they use for the problem and for the solution, their objections, what they do instead today (the alternatives, by name), timing and seasonality, who must never be addressed and how (personal attributes, per `config/audiences.md`).
4. **(l) Competitors and the market.** Three to five competitor or alternative names to scan in the Ad Library; what the Owner admires and dislikes in their ads; the category's clichés to avoid; the company's real differences, each with its source (a figure without a source is marked unverified and never used in an ad).
5. **(m) Creative preferences.** Formats (still, silent video, carousel), visual references, people on camera or not, generated imagery allowed or not (the disclosure badge rule of `config/brand.md` applies whenever it is), existing assets to reuse, the register of the copy (formal, peer-to-peer, plain), the call to action wording, the WhatsApp opening message the Owner wants to receive (the `ref` code goes in it), RTL specifics.
6. **(n) The launch and the rules.** The daily budget for this campaign inside the band and below every cap of `config/goals.md` (recommended: the first-flight proposal); start date and the length of the first test (recommended: 14 days before the first judgment); the decision rules (when to pause, when to add 20 %), the reply SLA and who answers, the weekly count the Owner will give (`lead-quality`), anything the harness must never do for this company.

After each round: read the answers back in one short block (in the chat language), keep the working list, write nothing to `config/` until the interview is over. When the Owner says there is nothing more to add and every round is done: `setup` step 5 (write `config/*.md`, `checklist.md`), step 5.5 (fill the vault: `memory/business/`, `memory/state/current.md`, HOME and the Inbox in the chat language, the generators, lint, Obsidian), step 5.6 (the memory routines, one question). Marks `setup.files=done`, `memory.business_filled=done`, `memory.routines=done|na`.

## Step 2. Market research (agents in parallel; about 20 to 40 minutes)

Run in one message, each with its lane map, the `config/` files it needs and a scope that names the market, the language, the audiences of round (k) and the names of round (l); each writes its own dated file under `reports/` with the vault frontmatter and proposes learnings in `memory/inbox/proposals.md`, never canonical notes:

| Agent | Model | Brief | Writes |
|---|---|---|---|
| `competitor-researcher` | sonnet | `competitor-research`: `ads_library_search` for every name of round (l) and for the category's words in the market's language, plus a web read of the category; what they claim, formats, hooks, offers, how long their ads have run, the gaps | `reports/<date>-research-competitors.md` |
| a general-purpose agent with the `audience-research` skill | sonnet | signals and structure for the audiences of round (k); `node creatives/tools/meta-graph.mjs targeting-search` for interest, behaviour, job and place ids with their size ranges, `delivery-estimate` for the daily reach of two or three candidate specs, the special ad category check, the retargeting ladder for later | `reports/<date>-research-audience.md` |
| a general-purpose agent with the `offer-design` skill | opus | what the funnel offers the visitor, the ask, the friction, three offer options with their risks and the claims each needs | `reports/<date>-research-offer.md` |
| `performance-analyst` | sonnet | the account's own past campaigns and ads (only the company's own on a shared account: the Owner's word in round (j)): spend, results, cost per result, what the creatives said; "no data" when the account is new | `reports/<date>-research-past-ads.md` |
| `cro-auditor` (only with a website) | sonnet | `landing-page-cro` on the destination pages of `config/product.md` | `reports/<date>-research-pages.md` |

Then the main session merges them into **`reports/<date>-market-research.md`** (sections: the market and the category; competitors, what they claim and where the gaps are; the audience, its size estimates and the ids; the offer, what to promise and what not; positioning in one paragraph; compliance risks and the special ad category; ranked recommendations, each with its evidence). Tell the Owner the five findings that change the campaign most, in the chat language, in at most ten lines. Mark `flight.research=done`.

## Step 3. The plan and the Owner's picks

`setup` step 6 writes `plans/<date>-first-flight-plan.md` (or `plans/<date>-campaign-<slug>.md` for a later campaign), with every choice citing the research report by section: objective, audience and targeting spec (the ids from the audience research), special ad category with its reason, placements, language and destination, the lead path and the pre-filled WhatsApp message with its `ref` code, the budget and schedule inside the caps (labelled "Needs the Owner's go"), the creative plan (the still and the silent video for the first flight; more only when the Owner asked in round (m)), the media table, the compliance gate, the open questions. Name it as the plan to read first in `memory/state/current.md`.

Then the **numbered recap** in the chat language (one line per decision: 1 objective, 2 audience, 3 geo, 4 placements, 5 budget and schedule, 6 the offer and the promise, 7 the creatives, 8 the WhatsApp message, 9 the decision rules) and one AskUserQuestion round: "Build it as planned" (Recommended) · "Change items …" (then one round per changed item) · "Pause here, I will think". Nothing is produced before the Owner confirms the recap. Mark `setup.plan=done`.

## Step 4. Copy and the gate

`copywriter` (opus) with the `ad-copy` skill: hooks, primary texts, headlines and descriptions in the funnel's language, grounded in the research report and the plan → `plans/copy-<date>-<topic>.md`. Then `compliance-reviewer` (sonnet) with `compliance-check` on every string and the creative specs: PASS / FIX / HOLD. FIX is applied by the copywriter once and re-checked; a HOLD goes to the Owner as a question (never resolved by an agent). The Owner picks the final strings by number. Marks `flight.copy=done`, `flight.compliance=done`.

## Step 5. The creatives

`creative-production` as written: the still from the HTML builder (`timeout 300 node creatives/tools/render-stills.mjs …`, one at a time), the silent video from the still and the hook with the HyperFrames plugin when installed (bounded, foreground) or "bring your own file"; generated pictures or video through the fal MCP **only after the cost is stated in chat and the Owner's go arrives in the same message**, ledgered, with the disclosure badge and the ad-level OPT_IN; the preview site's `ads.js` kept in step with the copy table; the Owner's numbered picks on the set. Marks `flight.creative=done`, `flight.video=done|na`.

## Step 6. Upload, forms and guard rails

`node creatives/tools/meta-upload.mjs <files>` → `image_hash` and `video_id` into the plan's media table (fallback: fal `upload_file` → `ads_creative_upload_media`). When the funnel uses instant forms: `meta-graph.mjs lead-forms create --spec <file>` (`--dry-run` first; the privacy policy URL from `config/product.md`; consent wording never written here). A pause or notification rule the Owner approved: `meta-graph.mjs rules create` (DISABLED). Mark `flight.upload=done`.

## Step 7. Build PAUSED

`media-buyer` (opus) with `meta-campaign-build`, after reading `memory/maps/build.md` and every learning it lists: the campaign, one ad set (targeting from the plan, `special_ad_categories` at creation, `location_types ["home","recent"]`, the budget and schedule from the plan), the ads with inline `object_story_spec`, the eleven feature opt-outs, OPT_IN when anything is generated, `page_welcome_message` at the `object_story_spec` level on WhatsApp ads, `ref` and `utm_*` on every link; every id written into the plan and the campaign note before the next write (the account guard learns ids from reads); read back by id; `ads_get_errors`. Custom audiences first when the plan has a ladder. Mark `flight.build=done`.

## Step 8. Show it

`ads_get_ad_preview` per ad (`MOBILE_FEED_STANDARD`) → `bash creatives/tools/ad-shots.sh <scratchpad>/ads …` → the PNGs sent as files in one call, with each ad's fixed number, name and status from a live read. A `grilling` interview when the Owner asks to check it before running. Mark `flight.preview=done`.

## Step 9. Close

- The vault (`memory-update`): the campaign note and the flight note (`## Current state` with the time of the live read, `## Log`), `memory/state/current.md` (the campaigns table, the plan, the next actions), the session note, `checklist.md`, `node memory/tools/build-hot.mjs --by campaign`, lint. Learnings from the agents' proposals merged at `/sync`.
- **Closing message, in the chat language:** what exists PAUSED (campaign, ad set, ads by number and id), what it will cost per day and per week when turned on against the caps of `config/goals.md`, that nothing is on and nothing was spent (fal costs listed if any, from the ledger), the open items by owner, and the exact go phrasing from `config/operator.md` the Owner would type to activate it in a later message. Then `/sync`.
