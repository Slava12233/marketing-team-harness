---
type: map
created: 2026-10-27
status: active
maintained_by: generated
categories: [memory]
summary: One line per note in the vault, grouped by folder; generated, grep it.
generated_at: 2026-10-27T17:30+00:00
content_hash: 2bcf6a70a1c7dcce
---

# INDEX

Never hand-edit; run node memory/tools/build-hot.mjs
98 notes (HOT and this index are not listed). One line each: `- [[name]] · type · summary`. Grep it; never read it whole past 300 lines.

## memory
- [[HOME]] · map · FICTIONAL EXAMPLE. The Owner's page for Acme Fitness - today, money vs caps, open items by owner (generated block), then the dashboards and the links.
- [[memory/README|README]] · contract · The contract of the harness memory vault - folders, note types, frontmatter, caps, who writes, cadences, generated files, the two languages, hooks and lint.

## memory/audiences
- [[memory/audiences/_about|_about]] · contract · One note per audience or targeting idea: spec, ids, size with as_of, where used, verdicts.

## memory/bases
- [[memory/bases/README|README]] · contract · The seven .base dashboards embedded in HOME; their column and view labels are Hebrew and how to change them.

## memory/business
- [[memory/business/audiences|audiences]] · business · FICTIONAL EXAMPLE. Two audiences in Greater Manchester: Members (adults 25-45 near the gyms) and Corporate (HR and office managers at employers with 20-250 staff); pains from interviews, never body or health framing.
- [[memory/business/brand|brand]] · business · FICTIONAL EXAMPLE. Acme Fitness brand: charcoal #1F2A36, one ember-orange #FF6B35 accent per creative, Inter, a single-fill wordmark, a warm direct tone, real class photos first.
- [[claims-and-compliance]] · business · FICTIONAL EXAMPLE. What an Acme Fitness ad may say: four allowed claims with sources, no weight or health outcomes, "Cancel anytime." not cleared, notices by id, UK notes to verify with a lawyer, special ad category NONE.
- [[memory/business/company|company]] · business · FICTIONAL EXAMPLE. Acme Fitness Ltd: three boutique gyms in Manchester and a membership app opening 2026-11-16; live; memberships and corporate packages.
- [[funnels]] · business · FICTIONAL EXAMPLE. Two funnels: Members (link ad → /join, StartTrial) and Corporate wellness (instant form or /corporate/call, a booked call); ref attribution, the consent-gated pixel, GA, Leads Center.
- [[memory/business/goals|goals]] · business · FICTIONAL EXAMPLE. Band £600-£1,500 a month; £12 per trial target for Members; caps £60 a day, £420 a week, £1,500 a month, £750 per campaign; success = 40 trials at £12 or less in 30 days.
- [[memory/business/product|product]] · business · FICTIONAL EXAMPLE. The Acme Fitness membership (gyms + app): the promise, the copy in use on /join and /corporate/call (verbatim), languages and the assets cleared for ads.
- [[where-product-truth-lives]] · business · FICTIONAL EXAMPLE. A two-person web team ships the site, notices and pixel; no shared repository; product truth is read from the live pages; requests go as dated plan files the Operator emails.

## memory/campaigns
- [[memory/campaigns/_about|_about]] · contract · One note per campaign, named after the campaign; ids, ad sets, ads, status, caps, dates and links, no live metrics.
- [[2026-11-CORPORATE-Call]] · campaign · FICTIONAL EXAMPLE. Corporate wellness funnel: leads on instant form 500000000000001, one ad set Corporate-GM-HR, ads #4-#5, all PAUSED; stays paused until domain verification.
- [[2026-11-MEMBERS-Trial]] · campaign · FICTIONAL EXAMPLE. Members funnel: sales optimised for StartTrial, one ad set Members-GM-25-45, ads #1-#3, all PAUSED with a placeholder budget; waits for the Owner's go.

## memory/capabilities
- [[memory/capabilities/_about|_about]] · contract · Generated: skills, agents, commands, connections and hooks, from .claude/ and .mcp.json.
- [[agents]] · capability · The 10 sub-agents under .claude/agents with model, job and tool access, generated.
- [[commands]] · capability · The 6 workflow commands (/morning, /health, /next-round, /sync, /consolidate, /setup) and what each writes, generated from their skills.
- [[connections]] · capability · The 2 MCP servers and tool families the harness knows (name, URL, tool prefix), generated; no tokens.
- [[hooks]] · capability · The 2 hook scripts under .claude/hooks, their events and whether project settings install them, generated.
- [[skills]] · capability · The 35 skills under .claude/skills (14 third-party, pinned in skills-lock.json), generated.

## memory/decisions
- [[memory/decisions/_about|_about]] · contract · One note per ruling by the Owner, YYYY-MM-DD-slug.md; never edited, superseded by a newer note.
- [[2026-10-26-corporate-waits-for-domain-verification]] · decision · FICTIONAL EXAMPLE. The corporate campaign stays PAUSED until acmefitness.example is verified in Business Settings, whatever its other gates say.
- [[2026-10-26-funnels-never-share-a-campaign]] · decision · FICTIONAL EXAMPLE. The Members and Corporate wellness funnels never share a campaign: one campaign per funnel, each with its own result and cap.
- [[2026-10-26-the-owner-pauses]] · decision · FICTIONAL EXAMPLE. The Owner pauses, on a click list from the morning report; the harness pauses only when the Owner asks in chat.

## memory/experiments
- [[memory/experiments/_about|_about]] · contract · One note per experiment: frozen hypothesis, one variable, metric, decision rule, dates, verdict.
- [[2026-11-members-photo-vs-app-screen]] · experiment · FICTIONAL EXAMPLE. Planned, not created: does a real class photo (#1) start more trials per pound than the app screenshot (#2)? Starts only after the Members cell has a week of data and the Owner's go.

## memory/flights
- [[memory/flights/_about|_about]] · contract · One note per creative flight: the numbered creatives table, hashes and video ids, the preview site, winners.
- [[2026-11-first-flight]] · flight · FICTIONAL EXAMPLE. The first flight: five creatives #1-#5 (three Members, two Corporate), from real class photos, an app screenshot and the tour video; all built PAUSED on 2026-10-27.

## memory/inbox
- [[owner]] · inbox · FICTIONAL EXAMPLE. The Owner's inbox in English - the Owner writes in plain language, the harness answers under each line every morning.
- [[proposals]] · inbox · Sub-agents append proposed learnings and corrections here; the main session merges them at /sync and empties the list.

## memory/learnings/audiences
- [[memory/learnings/audiences/_about|_about]] · contract · One audience learning per note: what a targeting choice did, with evidence and as_of.
- [[2026-10-27-age-floor-is-a-control-ceiling-a-suggestion]] · learning · FICTIONAL EXAMPLE. The members ad set reads Advantage+ audience with age 25-45: the floor of 25 holds as a control, the ceiling of 45 is only a suggestion; quote sizes from the audience panel.

## memory/learnings/creative
- [[memory/learnings/creative/_about|_about]] · contract · One creative learning per note: what worked or failed in images, video, copy and formats, with evidence.
- [[2026-10-27-headline-text-never-repeated-on-the-image]] · learning · FICTIONAL EXAMPLE. The brand rule 'no text on the image that repeats the headline' sent #5 Usage-Report's card back once before the build: the card now shows the report, the headline asks for the call.

## memory/learnings/meta-platform
- [[memory/learnings/meta-platform/_about|_about]] · contract · How Meta's server, Ads Manager and the Ads MCP behave: one platform fact per note, read before every build.
- [[2026-10-12-account-needs-a-verified-phone-to-activate]] · learning · Ads Manager error #3858013: the ad account must have a verified phone number before any ad can be activated; an owner-only step.
- [[2026-10-12-activate-returns-publishing-even-when-rejected]] · learning · ads_activate_entity returns PUBLISHING even when objects are then rejected and nothing reports it back; always re-read live objects and the draft; the reason is under Review and publish → details.
- [[2026-10-12-activity-log-language-run-status-and-size]] · learning · ads_account_get_activity_logs answers in the account language; run_status 1 active, 9 pending review, 17 pending publish; a whole campaign's log exceeds the output limit, so filter the saved file with jq.
- [[2026-10-12-ad-review-takes-minutes-then-preparing]] · learning · Review took 2-6 minutes per ad; after approval delivery reads pending/preparing with ads_get_errors empty, a normal warm-up and not a blocker.
- [[2026-10-12-create-creative-with-headline-breaks-the-ad]] · learning · ads_create_creative with a headline adds a deprecated call_to_action.value.link_title; Ads Manager rejects the ad with #1815589 though the MCP says VALIDATED. Build with an inline object_story_spec.
- [[2026-10-12-draft-campaigns-cannot-be-discarded-through-the-mcp]] · learning · Status DELETED on a draft campaign returns success but Meta rejects it (error 1487564); drafts are discarded only in Ads Manager, an all-or-nothing click that is the Owner's.
- [[2026-10-12-draft-delete-rules-by-object-level]] · learning · Draft ads: DELETED sticks. Draft ad sets: cannot be deleted (error 1487246). A draft ad under a live ad set: DELETED fails (error 1487839), PAUSED works.
- [[2026-10-12-editor-renders-mcp-objects-in-about-20-seconds]] · learning · The Ads Manager editor takes about 20 seconds to render MCP-made draft ad sets and ads; grey placeholders for that long are not a hang.
- [[2026-10-12-live-objects-are-deleted-by-status]] · learning · Live objects can be deleted by setting status DELETED; a deleted campaign still returns on read with status DELETED.
- [[2026-10-12-never-update-targeting-on-a-draft-ad-set]] · learning · A targeting update on a draft ad set makes it vanish from the Ads Manager table and hang its editor while the MCP reports VALIDATED; set targeting at creation.
- [[2026-10-12-no-targeting-search-tool]] · learning · No targeting search: look interest, job-title and behaviour names and sizes up in the Ads Manager ad set editor, add one through the UI, read it back with the MCP for the ids.
- [[2026-10-12-planned-ab-study-does-not-change-delivery-status]] · learning · A Planned A/B study with a future start leaves delivery status unchanged; if a study held the ad sets the sub-status would read scheduled.
- [[2026-10-12-publishing-a-draft-sets-it-active]] · learning · Publishing a draft sets it ACTIVE; the PAUSED status requested at creation is not honored. Safe pattern: the Owner reviews, publishes, pauses at once if it should not run.
- [[2026-10-12-publishing-listed-object-ids-leaves-the-rest-in-draft]] · learning · ads_activate_entity publishes only the object_ids it is given; everything else stays in the draft.
- [[2026-10-12-scalar-edits-to-live-ad-sets-stage-then-apply]] · learning · Scalar edits (start_time, name) to live ad sets work: ads_update_entity stages, ads_activate_entity with those ad set ids applies.
- [[2026-10-12-standard-enhancements-is-deprecated]] · learning · standard_enhancements fails at the publisher (error 3858504, not caught by the validator); opt out of the eleven creative features individually in creative_features_spec.
- [[2026-10-12-writes-staged-as-drafts]] · learning · On a draft-mode account MCP writes are Ads Manager drafts; a created campaign does not exist live until published and a live read by id returns nothing.
- [[2026-10-20-mcp-upload-route-is-public-url-only]] · learning · ads_creative_upload_local_image may not be rolled out on an account; then the MCP route is ads_creative_upload_media by public URL (fal's CDN as one host); it is the fallback behind direct Graph uploads.
- [[2026-10-20-no-lead-form-tool]] · learning · The MCP has no lead-form tool and returns no lead rows; instant-form ids come from Meta Business Suite's forms library.
- [[2026-10-20-some-accounts-create-real-paused-objects]] · learning · On some ad accounts every create returns a real PAUSED object and draft reads say "being gradually rolled out"; paused objects spend nothing, edits are live edits, activate is the only step that makes anything run.
- [[2026-10-21-editor-edits-autosave-as-drafts]] · learning · Any edit in the Ads Manager ad-set editor is auto-saved as an unpublished draft (Review and publish (1), Discard drafts); the footer's Discard draft discards one object's draft after an in-page confirm.
- [[2026-10-21-empty-paused-ad-set-is-a-sizing-sandbox]] · learning · The editor's "Estimated audience size" card updates per edit, so an empty paused ad set is a safe sizing sandbox; sizes beside search suggestions are worldwide, not for the targeted country.
- [[2026-10-21-escape-in-the-editor-opens-a-publish-dialog]] · learning · Pressing Escape in the ad-set editor opens a "Publish draft items?" dialog; click Close, never Publish.
- [[2026-10-21-image-uploads-are-deduplicated-by-content]] · learning · Uploading the same picture again returns the existing image hash.
- [[2026-10-21-instant-form-button-types]] · learning · The lead-ads guide lists APPLY_NOW, DOWNLOAD, GET_QUOTE, LEARN_MORE, SIGN_UP and SUBSCRIBE as instant-form buttons; expect CONTACT_US to be refused.
- [[2026-10-21-location-types-home-is-removed]] · learning · location_types ["home"] was removed by Meta in 2023 yet is accepted at creation and stored when location_types is omitted; set ["home","recent"] explicitly (WhatsApp sets keep frequently_in).
- [[2026-10-21-weekly-cap-is-seven-times-daily-budget]] · learning · Meta's weekly cap on daily budgets is 7× per Sunday-Saturday week, prorated: a 15-day set at 100 a day costs at most 1,500, a 14-day one 1,400.
- [[2026-10-21-whatsapp-ads-have-no-detailed-targeting]] · learning · Meta's help says detailed targeting is not available for click-to-WhatsApp and Advantage+ detailed targeting is applied automatically to conversation-optimised sets; read the audience panel before trusting the spec.
- [[2026-10-21-whatsapp-ads-need-page-welcome-message]] · learning · Without page_welcome_message a WhatsApp ad opens with Meta's English default; pass it at object_story_spec level as a JSON string (VISUAL_EDITOR v2, autofill_message); inside link_data the MCP returns INTERNAL.
- [[2026-10-23-direct-graph-uploads-are-the-default-route]] · learning · creatives/tools/meta-upload.mjs posts local files to the ad account's adimages/advideos and returns image_hash/video_id; it needs META_MARKETING_TOKEN (a System User token) whose generation is the Owner's click.
- [[2026-10-25-activation-sequence-that-worked]] · learning · Scalar start_time edit on the ad set, then ads_activate_entity on the ads, the ad set and the campaign; ads still IN_PROCESS went active within three minutes; a set with start_time minutes ahead reads scheduled.
- [[2026-10-25-advantage-plus-languages-are-a-control]] · learning · Under Advantage+ audience, languages are a control with locations, minimum age and excluded custom audiences (Meta help 938372127764391), so a locales filter holds; age_max is only a suggestion.
- [[2026-10-25-ai-self-disclosure-is-an-object]] · learning · The AI self-disclosure OPT_IN is accepted only as "generative_asset_spec":{"transparency_metadata":{"self_disclosure":{"enroll_status":"OPT_IN"}}}; the bare string returns code 100.
- [[2026-10-25-campaign-spend-cap-is-a-live-scalar-edit]] · learning · A campaign spend_cap (in the currency's minor unit, e.g. cents) is changed as a live scalar edit.
- [[2026-10-25-creatives-are-immutable]] · learning · ads_update_entity refuses creative and creative_id; a one-word copy change means new ads on the same media hashes plus status DELETED on the old ones, which sticks on paused real objects; record the old ids and strings first.
- [[2026-10-25-last-n-day-presets-exclude-today]] · learning · In the MCP and in Ads Manager the last_7d, last_14d and last_30d presets exclude today; a campaign that started today shows an empty row; use today or maximum.
- [[2026-10-25-mcp-cannot-set-a-whatsapp-number]] · learning · whatsapp_phone_number is unknown to the MCP and a promoted_object update returns INTERNAL; a number is connected in Page settings or the ad-set editor, only once it is on the WhatsApp Business app, chosen per ad set, and a second number must not become primary.
- [[2026-10-25-mixed-optimisation-goals-show-multiple-conversions]] · learning · A campaign whose ad sets have different optimisation goals shows "Multiple conversions" / "-" as its campaign-level result.
- [[2026-10-25-whatsapp-ad-metrics-meaning]] · learning · On WhatsApp ads clicks (all) includes Page-name and "see more" taps, link_click is the WhatsApp open, and results (messaging_conversation_started_7d) count only after the person sends the pre-filled message, with up to a few hours' delay.
- [[2026-10-26-page-welcome-message-exact-spec]] · learning · The exact page_welcome_message object a click-to-WhatsApp ad takes at the object_story_spec level (VISUAL_EDITOR v2, autofill_message); inside link_data the call fails with a bare INTERNAL error.
- [[2026-10-26-whatsapp-inbox-reads]] · learning · In WhatsApp Business Web each click-to-WhatsApp chat carries the ad card above the first message, the only per-lead attribution; many chats open with Meta's default pre-fill (cause unverified); read only on the Owner's ask, mouse only, no PII in the repo.

## memory/learnings/money
- [[memory/learnings/money/_about|_about]] · contract · One money learning per note: costs, pacing, budget behaviour and verdict thresholds, with as_of and source.
- [[2026-10-27-placeholder-budget-is-the-minimum]] · learning · FICTIONAL EXAMPLE. Paused builds carry the account's minimum daily budget (1.00 GBP) as a placeholder; the real budget is set only with the go, and the Owner's £20/day idea stays under every cap (at most £140 a week against £420).

## memory/learnings/tooling
- [[memory/learnings/tooling/_about|_about]] · contract · One tooling learning per note: a behaviour of a local tool, a script or a connection, with evidence.
- [[2026-10-27-uploads-by-public-url-until-the-token]] · learning · FICTIONAL EXAMPLE. Without the System User token meta-upload.mjs --check fails, so the first flight's five files went up by public URL through the MCP; switch to direct uploads once the Owner creates the token.

## memory/maps
- [[build]] · map · The Build lane map - media-buyer and the main session read every meta-platform learning listed here before any create, update or activate.
- [[close]] · map · The Close lane map - harness-librarian and the main session at /sync and /consolidate: the contract, the procedure, the generated notes and the inboxes.
- [[create]] · map · The Create lane map - creative-director, copywriter and competitor-researcher: brand, claims, audiences, the flights and every creative and audience learning.
- [[gate]] · map · The Gate lane map - compliance-reviewer and test-designer: claims, notices, special ad categories, AI imagery, the experiments and their decision rules.
- [[measure]] · map · The Measure lane map - performance-analyst, signals-auditor and cro-auditor: what to read before a report, an audit or a signals check.

## memory/open
- [[memory/open/_about|_about]] · contract · One note per open item with owner (owner, operator, harness, product-team or lawyer) and status open until done.
- [[budgets-and-go-for-the-first-flight]] · open · FICTIONAL EXAMPLE. The daily budgets, caps and dates of both campaigns, then the go in the phrasing of config/operator.md; Members first.
- [[domain-verification-gates-corporate]] · open · FICTIONAL EXAMPLE. Verify acmefitness.example in Business Settings → Brand safety → Domains; the corporate campaign waits for it.
- [[signals-audit-start-trial]] · open · FICTIONAL EXAMPLE. Signals audit: confirm pixel 400000000000001 received StartTrial in the last 24 h before any go on Members.

## memory/reviews
- [[memory/reviews/_about|_about]] · contract · The weekly review YYYY-Www.md in the Owner's chat language, written by /next-round.

## memory/sessions/2026-10
- [[2026-10-27]] · session · FICTIONAL EXAMPLE. The build session: the Owner's numbered picks #1-#5, compliance PASS, two campaigns built PAUSED and read back; nothing activated.

## memory/state
- [[current]] · state · FICTIONAL EXAMPLE. Acme Fitness account facts as last verified (live read-back 2026-10-27 17:10 Europe/London), two PAUSED campaigns, the plan to read first and the next actions.

## memory/tooling
- [[memory/tooling/_about|_about]] · contract · Hand-maintained tool knowledge: upload routes, what each connection cannot do, procedures.

## memory/tools
- [[consolidate]] · tooling · The /consolidate procedure as a checklist - find duplicates, stale facts, closed items and cap breaches, propose, apply on the main session's judgment, regenerate, lint, report.

## plans
- [[2026-10-26-first-flight-plan]] · plan · First flight plan
- [[experiments-log]] · plan · Experiments log

## reports
- [[2026-10-28-morning]] · report · Morning report, 2026-10-28 08:30 Europe/London
