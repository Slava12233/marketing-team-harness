# How Meta's server behaves (platform notes)

Platform knowledge gathered while running real campaigns through Meta's official Ads MCP (`https://mcp.facebook.com/ads`) and the Graph API. Account ids, campaign ids, company names and people are removed; the dates stay because Meta changes things, and a dated note tells you how old an observation is. When a session observes new durable behaviour, add a dated bullet here (no ids) and, if it changes how builds must be done, update the summary in `CLAUDE.md` → "Meta platform behaviour".

## Draft-mode accounts (observed 2026-10-12)

On accounts where the MCP stages writes as Ads Manager drafts:

- Writes are staged as Ads Manager DRAFTS, not live objects. A created campaign does not exist live until it is published. Reading it "live" by id returns nothing until then.
- Publishing a draft sets it ACTIVE. The paused status requested at creation is not honoured by the draft flow. Safe pattern: stage the draft, have the Owner review it in Ads Manager, publish there, then pause immediately if it should not run yet.
- Unpublished draft campaigns cannot be discarded through the MCP. Setting status DELETED on a draft returns `success: true` but Meta rejects it with error 1487564 and the draft stays. Drafts are discarded only in Ads Manager (Review and Publish → Discard), and that click is all-or-nothing for the account and is blocked for Claude by the permission classifier; the Owner clicks it.
- Draft **ads** can be removed: `ads_update_entity` status DELETED on a draft ad sticks. Draft ad sets cannot be deleted (error 1487246). A draft ad under a **live** ad set cannot be set DELETED (error 1487839); PAUSED works.
- **Never update `targeting` on a draft ad set with `ads_update_entity`.** The draft vanishes from the Ads Manager table and its editor hangs, while the MCP still reports VALIDATED. Scalar updates (name, start_time, status) are safe. Set targeting at creation; to change it, the Owner discards the draft and Claude recreates.
- Draft reads (`object_state: draft`) may answer "being gradually rolled out" on accounts where they are not available; then drafts are verified in Ads Manager.

## Real-object accounts (observed 2026-10-20)

- On some accounts there is no draft staging: every create returns a real object in status PAUSED (not DRAFT), and `object_state: draft` reads answer "being gradually rolled out". Paused objects spend nothing; edits to them (targeting included) are ordinary live edits; `ads_activate_entity` is the only step that makes anything run and stays behind the Owner's go. The draft rules above may return if Meta enables drafts on the account. Check which kind of account you have with the first create and record it in `memory.md`.
- **Ads Manager drafts still exist on such accounts (2026-10-21):** any edit in the ad-set editor is auto-saved as an unpublished draft ("Unpublished edits", "All edits saved"; the top bar shows "Review and publish (1)" and "Discard drafts"); the editor footer's "Discard draft" discards that object's draft after an in-page confirm. The "Estimated audience size" card updates per edit, so an empty paused ad set is a safe sizing sandbox; the sizes shown beside search suggestions are worldwide, not for the targeted country; Escape in the editor opens a "Publish draft items?" dialog (click Close, never Publish).

## Live objects, publishing and review (observed 2026-10-12, confirmed later)

- Live objects can be deleted by setting status DELETED. A deleted campaign still returns on read with status DELETED.
- `ads_activate_entity` returns PUBLISHING even when the publisher then rejects objects; nothing reports it back. Always re-read live objects and any drafts afterwards. Ads Manager shows the reason under "Review and publish" → details. Publishing only the listed `object_ids` leaves the rest in the draft.
- Scalar edits to live ad sets (start_time, name) work: `ads_update_entity` stages, `ads_activate_entity` with those ad set ids applies.
- Ads Manager's editor takes about 20 s to render MCP-made ad sets and ads; grey placeholders for that long are not a hang.
- The ad account must have a verified phone number before any ad can be activated (Ads Manager error #3858013). Owner-only step.
- Ad review took 2–6 minutes per ad after publish (up to about 15 minutes for some ads and videos). After approval and before first impressions, `ads_get_ad_entities` `delivery` shows `{"status":"pending","substatuses":["preparing"]}` and `ads_get_errors` stays empty: normal warm-up, not a blocker. A Planned A/B study with a future start does not change delivery status; if a study held the ad sets the sub-status would read `scheduled`.
- The activity log (`ads_account_get_activity_logs`) comes back in the account's language; `run_status` codes: 1 = active, 9 = pending review, 17 = pending publish. A whole campaign's log exceeds the tool-output limit; filter the saved file with jq.
- Live deletes run through a `claude -p` subprocess tripped the auto-mode classifier. Expect to ask the Owner to run or approve destructive commands.
- **Activation sequence that worked (2026-10-25):** a scalar `start_time` edit on the ad set, then `ads_activate_entity` on the ads, the ad set and the campaign; ads still `IN_PROCESS` / `pending_process` at activation went `active` within three minutes once review passed, and a set whose `start_time` is minutes ahead reads `scheduled` until it ticks.

## Creatives (observed 2026-10-12 to 2026-10-25)

- Do not build ads from `ads_create_creative` creatives when a headline is set: the tool adds a deprecated `call_to_action.value.link_title`, and Ads Manager rejects the ad with #1815589 even though the MCP says VALIDATED and the preview renders. Build ads with an inline `object_story_spec` in `ads_create_ad` instead.
- **`standard_enhancements` is deprecated** (publisher error 3858504, not caught by the MCP validator). In `degrees_of_freedom_spec.creative_features_spec` opt out of individual features instead: image_brightness_and_contrast, enhance_cta, text_optimizations, image_templates, inline_comment, image_touchups, image_uncrop, image_background_gen, add_text_overlay, site_extensions, video_auto_crop.
- **Creatives are immutable (2026-10-25):** `ads_update_entity` refuses `creative` and `creative_id`, so a one-word change to a primary text means new ads (`ads_create_ad`, same media hashes) plus `status: DELETED` on the old ones, which sticks on paused real objects (`is_draft` false, read back DELETED); record the old ids and strings in the plan first.
- **AI self-disclosure (2026-10-25):** the ad-level AI self-disclosure is accepted only as the object `"generative_asset_spec":{"transparency_metadata":{"self_disclosure":{"enroll_status":"OPT_IN"}}}` (the bare string → code 100).
- Meta deduplicates image uploads by content (the same picture returns the existing hash) (2026-10-21).

## Targeting (observed 2026-10-12 to 2026-10-25)

- There is no targeting-search tool. Look interest, job-title and behaviour names and sizes up in the Ads Manager ad set editor (detailed targeting search box), add one to an empty paused (or draft) ad set through the UI, read it back with the MCP to get the ids; or reuse ids from the account's earlier ad sets.
- **`location_types: ["home"]` is a removed option (Meta, 2023):** the API accepts it at creation and `ads_get_errors` stays empty, but the editor shows "Review 1 error: Your audience contains a location targeting option that has been removed (people living in, …)" on any edit and stops re-estimating; use the default (home + recent) or set it explicitly (2026-10-21).
- `location_types` omitted at creation is stored as the removed `["home"]` (ON_AD) or `["frequently_in","home"]` (WhatsApp): set `["home","recent"]` explicitly; WhatsApp sets keep `frequently_in` (2026-10-21).
- **Advantage+ audience language control (2026-10-25):** under Advantage+ audience, languages are an audience CONTROL together with locations, minimum age and excluded custom audiences (Meta help article 938372127764391), so a `locales` filter holds; `age_max` is only a suggestion.
- Meta's help says detailed targeting is not available for click-to-WhatsApp and that Advantage+ detailed targeting is applied automatically to conversation-optimised sets: read the set's audience panel before trusting its spec (2026-10-21).

## Click-to-WhatsApp (observed 2026-10-21 to 2026-10-25)

- Click-to-WhatsApp ads built inline without `page_welcome_message` open the chat with Meta's English default ("Hello! Can I get more info on this?"): set a pre-filled message in the ad's language, or ice-breakers (up to four, 80 characters), at creation.
- **Pre-filled message:** pass `page_welcome_message` at the `object_story_spec` level of the inline creative (a JSON string, VISUAL_EDITOR v2, `autofill_message`); inside `link_data` the MCP returns a bare INTERNAL error.
- **WhatsApp numbers (2026-10-25):** the MCP cannot set or change a click-to-WhatsApp ad set's number (`whatsapp_phone_number` is unknown to `ads_get_field_context`; a `promoted_object` update returns a bare INTERNAL error); a number is connected in Page settings → Linked accounts → WhatsApp → "Connect another number" or in the ad-set editor (Conversion → WhatsApp), only once it already lives on the WhatsApp Business app (Meta stops with "install WhatsApp Business for this number" otherwise), and it is selected per ad set in the editor; a second number must not become the Page's primary (sets without an explicit choice follow the primary).
- **WhatsApp reads (2026-10-25):** on WhatsApp ads `clicks` (all) includes Page-name and "see more" taps, `link_click` is the WhatsApp open, and `results` (`messaging_conversation_started_7d`) counts only after the person sends the pre-filled message, with a reporting delay of up to a few hours; a campaign whose ad sets have different optimisation goals shows "Multiple conversions" / "—" as its campaign-level result.

## Lead ads (observed 2026-10-21)

- There is no lead-form tool in the MCP: form ids come from Meta Business Suite's forms library.
- The lead-ads guide lists APPLY_NOW, DOWNLOAD, GET_QUOTE, LEARN_MORE, SIGN_UP and SUBSCRIBE as instant-form buttons; expect CONTACT_US to be refused.
- Before any instant-form ad runs, the lead webhook (developer app with Webhooks, `leadgen` subscription, a long-lived Page token) must carry the form id; otherwise leads sit only in the forms library.

## Budgets and reads (observed 2026-10-21 to 2026-10-25)

- Meta's weekly cap on daily budgets: up to 7× the daily budget per Sunday–Saturday week, prorated, so a 15-day set at budget B a day costs at most 15 × B and a 14-day one 14 × B.
- A campaign `spend_cap` (in the account currency's minor unit) is a live scalar edit on real-object accounts (2026-10-25).
- `last_7d` / `last_14d` / `last_30d` exclude today in the MCP and in Ads Manager (a campaign that started today shows an empty row under them; use `today` or `maximum`) (2026-10-25).

## Media uploads (observed 2026-10-20 to 2026-10-23)

- The MCP's own upload route is public URL only (`ads_creative_upload_media`, `upload_source` URL). A public host such as fal's CDN works (`mcp__fal__upload_file` prepare → curl PUT → `file_url`), but fal's CDN refuses uploads while the fal account is out of credits, so a fal top-up then gates the Meta uploads. Create tools and reads keep working regardless.
- `ads_creative_upload_local_image` is "gradually rolled out" and was not available on the account observed (2026-10-20).
- **Direct uploads outside the MCP (2026-10-23, live-tested): the default upload route.** `creatives/tools/meta-upload.mjs <files>` posts local images and videos to `act_<account>/adimages` and `/advideos` through Meta's Graph API, waits for a video's `ready`, and returns the `image_hash` / `video_id` that `ads_create_ad` takes (ledger in `creatives/uploads/`). It needs `META_MARKETING_TOKEN` and `META_AD_ACCOUNT_ID` in the repo-root `.env` (names only, never a value in chat): the token of a System User (Employee in the Business portfolio, Manage campaigns on the ad account, Develop app on a Business-type app, `ads_management` + `ads_read`). Generating, rotating or revoking that token is the Owner's click in Business Settings → System users. `--check` verifies the token (names only). The public-URL route remains the fallback.
