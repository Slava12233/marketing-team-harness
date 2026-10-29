# The Graph tool (`creatives/tools/meta-graph.mjs`)

Meta's official Ads MCP (`meta-ads`) builds campaigns, ad sets and ads, and reads the account. It has no tool for a few jobs the harness needs every week: searching interests and other targeting, estimating how many people an audience reaches, making and listing lead forms, downloading lead rows, automated rules, lookalike audiences, and insights split by age, gender, placement or hour written to a spreadsheet file. `meta-graph.mjs` does those jobs by calling Meta's Graph API directly, with the same System User token the upload tool uses (`creatives/tools/meta-upload.mjs`). Builds stay in the MCP.

You rarely type these commands yourself. Ask in the chat ("find interests for trail running", "how big is this audience", "make the lead form from the plan", "download this week's leads to my Downloads folder", "split last week by age and gender") and the harness runs the command and shows you the answer. The commands are listed here so you can see what happens and check it.

## What each subcommand is for

| Subcommand | In plain words | Changes anything in Meta? |
|---|---|---|
| `check` | Is the token working, whose is it, which ad account does it reach, which permissions does it have | No |
| `targeting-search --q "<text>" [--type ...]` | Find interests, behaviours, job titles, fields of study, places or languages by name, with Meta's audience-size range for each | No |
| `delivery-estimate --targeting <file.json> --goal <GOAL>` | How many people a targeting spec reaches per day and per month for an optimisation goal | No |
| `lead-forms list` | The instant forms on the company's Page, with status and lead counts | No |
| `lead-forms create --spec <file.json>` | Make a new instant form on the Page from a spec file the harness writes | Yes: a new form (it spends nothing) |
| `leads --form <id> --out <file.csv>` | Download the leads of one form into a spreadsheet file **outside** the harness folder | No |
| `insights --level ... --out <file.csv>` | Results per campaign, ad set or ad for a date range, optionally split by age, gender, placement, hour, country or region, written to a spreadsheet file | No |
| `rules list` | The automated rules on the ad account | No |
| `rules create --spec <file.json>` | Make an automated rule that pauses or notifies (nothing else) | Yes: a new rule, created switched off unless the spec says otherwise |
| `rules delete --id <id> --yes` | Remove one rule of this ad account | Yes: removes the rule |
| `audiences list` | The custom and lookalike audiences on the ad account, with their sizes | No |
| `audiences lookalike --origin <id> --ratio 0.01 --country XX --name "<name>"` | Make a lookalike audience from an existing audience | Yes: a new audience (it spends nothing) |

Every subcommand also takes:
- `--dry-run`: prints the exact requests (method, address, parameters) with the token shown as `[token]`, and sends nothing. Use it whenever you want to see what would happen.
- `--json`: prints Meta's raw answer as JSON (for the skills). The human-readable lines then go to the error stream.

Exit codes: `0` done; `1` Meta or the network said no (the message says why); `2` something is missing or the request was refused by the tool's own safety rules (nothing was sent).

## Before the first use (the Owner's steps)

The tool reads four names from the `.env` file in the harness folder and nothing else from that file:

| Name | What it is | Needed for |
|---|---|---|
| `META_AD_ACCOUNT_ID` | The ad account id, digits (`act_` optional) | Every subcommand |
| `META_MARKETING_TOKEN` | The System User token | Every subcommand |
| `META_GRAPH_VERSION` | The Graph API version, default `v23.0` | Optional |
| `META_PAGE_ID` | The Facebook Page id, digits | `lead-forms` (and `leads`, to fetch the Page token) |

The token is the one from step 7 of `docs/meta-setup-guide.md` (the developer app and the upload token). For the lead subcommands it needs a little more:

1. Business Settings → Users → System users → the System User → Assign assets → **Pages** → the company's Page, with the access that covers ads and leads. (The ad account and the app are already assigned from step 7.)
2. On the same System User: **Revoke tokens** for the app first, then **Generate new token** for the app with `ads_management`, `ads_read`, and for lead forms and leads also `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement` and `pages_show_list`.
3. Meta shows the token once, with a Copy button. Click Copy, then in a terminal in the harness folder run `node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN` (it writes the line, clears the clipboard and prints only the character count); the Page id the same way (`printf '%s' <id> | node creatives/tools/env-set.mjs --from-stdin META_PAGE_ID --min-length 6`). In `/connect` the harness does all of this on the Owner's go. Fallback without a clipboard tool: open `.env` in a text editor, paste after `META_MARKETING_TOKEN=` (no space, no quotes), add the Page id after `META_PAGE_ID=`, save.
4. Ask the harness to "check the Graph token" (it runs `node creatives/tools/meta-graph.mjs check`).
5. For lead forms, the Page must have accepted Meta's Lead Ads terms (a console step in `config/accounts.md` and `checklist.md`).

**The token goes only into `.env`.** Never paste it into the chat, an email, a document or a screenshot. A token that reaches the chat is treated as leaked: revoke it and generate a new one. The tool never prints a token and never puts one in a web address; it sends it in a request header and blanks it out of every message it prints. The Page token, which the tool fetches with the System User token for the lead subcommands, is handled the same way and is never written anywhere.

**The tool works only on the ad account in `.env`.** No subcommand takes an account id on the command line, so it cannot touch another ad account. `rules delete` also checks that the rule belongs to that account before it deletes anything.

## Permissions each subcommand needs

| Subcommand | Token permissions | Also needed |
|---|---|---|
| `check` | any valid token | reports `ads_read` and `ads_management` (exit 2 when either is missing), and reports `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement`, `pages_show_list` for the lead subcommands |
| `targeting-search`, `delivery-estimate` | `ads_read` | |
| `insights`, `rules list`, `audiences list` | `ads_read` | |
| `rules create`, `rules delete`, `audiences lookalike` | `ads_management` | lookalikes: the custom audience terms accepted on the ad account |
| `lead-forms list`, `lead-forms create` | `pages_manage_ads`, `pages_read_engagement`, `pages_show_list` | `META_PAGE_ID`; the Page assigned to the System User; Lead Ads terms accepted on the Page |
| `leads` | `leads_retrieval`, `pages_manage_ads`, `pages_read_engagement`, `pages_show_list` | the Page assigned to the System User with leads access |

When Meta refuses the token (code 190: invalid, expired or revoked; code 200 or 10: a missing permission or asset), the tool prints the Owner's fix list (app mode, the System User's asset access, the token's permissions) and stops. It never retries.

## Leads: the personal-data rule

Lead rows hold names, emails and phone numbers. They never enter the harness folder, the chat, memory, plans or reports.

- `leads` writes the file **only outside the harness folder** (for example your Downloads folder). It refuses (exit 2, nothing downloaded) when `--out` is missing or points anywhere inside the folder.
- It never prints a row. It prints only how many leads it wrote, the file path and the column names.
- `--json` is refused for `leads`, because it would print the rows.
- The file is UTF-8 with a byte-order mark so spreadsheet apps show every alphabet correctly, and cells that start with `=`, `+`, `-` or `@` are prefixed with `'` so a spreadsheet never runs them as a formula.
- The Operator forwards the file to the company's own CRM or sheet, then deletes it. The harness works with counts by source and `ref` only.

```
node creatives/tools/meta-graph.mjs leads --form <form id> --since 2026-01-01 --out "<your Downloads folder>/leads-<date>.csv"
```

`--fields` changes the columns (default: id, created time, ad, ad set, campaign and form ids and names, platform, organic flag, and one column per form question).

## Rules: the safety rule

An automated rule acts on the account by itself, so the tool accepts only two kinds:

- `PAUSE`: pause the ad, ad set or campaign when the condition is met. Pausing stops spend; it never starts or raises it.
- `NOTIFICATION`: send a notification to the people on the account.

Any other action (`UNPAUSE`, `CHANGE_BUDGET`, `CHANGE_BID`, `ROTATE`, or anything else) is refused with exit 2, and nothing is sent. Budget changes stay with the Owner's go in the chat.

A rule is created **switched off** (`DISABLED`) unless the spec says `"status": "ENABLED"`, the same way everything else is built paused. The harness shows the Owner the rule (what it watches, the threshold, how often it runs, what it pauses) before it writes `"status": "ENABLED"`. `rules delete` needs `--yes` and checks the rule belongs to the `.env` ad account.

## The ledger

Every write (`lead-forms create`, `rules create`, `rules delete`, `audiences lookalike`) adds an entry to `creatives/uploads/<YYYY-MM-DD>-meta-graph.json`: the time, the subcommand, the account, the request summary (method, path, the names and counts it used, never a lead or a token) and the id Meta returned, or `FAILED` with the error. Reads add nothing. The ledger files are git-ignored, like the upload ledger; the ids that matter are copied into the flight's plan and the campaign note.

## How the skills use it

| Skill | Subcommands |
|---|---|
| `audience-research` | `targeting-search` to find interest, behaviour and job-title ids; `delivery-estimate` to size a draft targeting spec before a build; `audiences list` and `audiences lookalike` for the retargeting and lookalike ladder |
| `meta-campaign-build` | `lead-forms create` for an instant-form flight (spec from the plan; privacy policy URL from `config/product.md`); `lead-forms list` to read the form ids into `config/accounts.md`; `rules create` for a guard-rail rule the Owner approved |
| `meta-performance-report`, `ab-test-design` | `insights` with `--breakdowns` into `reports/data/<date>-<topic>.csv` for the age, gender, placement and hour splits the MCP does not give |
| `scaling-playbook` | `rules list` to see what already acts on the account; pause rules as guard rails |
| `health` | `check` |

Insights files carry campaign names and numbers, no personal data. `reports/data/` is a fine place for them inside a private repository; keep them out of any repository that is shared beyond the company.

## Example spec files

### A lead form (`creatives/briefs/<date>-lead-form.json`)

The privacy policy URL is required (Meta requires it, and the tool refuses a spec without it). It is the company's own privacy page, taken from `config/product.md` or `config/claims.md`. The harness never writes consent or disclaimer wording; a custom disclaimer, if the company needs one, is the Owner's step in Meta's forms library. The questions, texts and thank-you screen come from the copy that passed `compliance-check`.

```json
{
  "name": "Example contact form v1",
  "locale": "en_US",
  "questions": [
    { "type": "FULL_NAME" },
    { "type": "EMAIL" },
    { "type": "PHONE" },
    { "type": "CUSTOM", "key": "best_time", "label": "When is a good time to call?" }
  ],
  "privacy_policy": { "url": "https://www.example.com/privacy", "link_text": "Privacy policy" },
  "thank_you_page": {
    "title": "Thanks, we have your details",
    "body": "We will call you within one working day.",
    "button_type": "VIEW_WEBSITE",
    "button_text": "Visit our website",
    "website_url": "https://www.example.com/"
  },
  "block_display_for_non_targeted_viewer": true,
  "follow_up_action_url": "https://www.example.com/"
}
```

Allowed top-level fields: `name`, `questions`, `privacy_policy` (`url`, `link_text`), `thank_you_page`, `context_card` (the id of an intro card made earlier; leave it out for none), `locale`, `block_display_for_non_targeted_viewer`, `follow_up_action_url`. Any other field is refused.

```
node creatives/tools/meta-graph.mjs lead-forms create --spec creatives/briefs/<date>-lead-form.json --dry-run
node creatives/tools/meta-graph.mjs lead-forms create --spec creatives/briefs/<date>-lead-form.json
```

### A rule: pause an ad set when the cost per result over the last 3 days is above X (`plans/<date>-rule-cost-guard.json`)

```json
{
  "name": "Guard: pause ad set when cost per result over 3 days is above X",
  "status": "DISABLED",
  "evaluation_spec": {
    "evaluation_type": "SCHEDULE",
    "filters": [
      { "field": "entity_type", "value": "ADSET", "operator": "EQUAL" },
      { "field": "id", "value": ["<ad set id>"], "operator": "IN" },
      { "field": "time_preset", "value": "LAST_3_DAYS", "operator": "EQUAL" },
      { "field": "spent", "value": 3000, "operator": "GREATER_THAN" },
      { "field": "cost_per_result", "value": 2500, "operator": "GREATER_THAN" }
    ]
  },
  "execution_spec": { "execution_type": "PAUSE" },
  "schedule_spec": { "schedule_type": "DAILY" }
}
```

How to read it: once a day, Meta looks at the named ad set over the last 3 days; when it has spent more than 30.00 (so a single early result does not trip it) and the cost per result is above 25.00, Meta pauses the ad set.

- **X** is the target cost per result from `config/goals.md`, with headroom the Owner agrees to. Money values in rules are in the account currency's smallest unit (cents): `2500` means 25.00. Confirm on the first rule by opening it in Ads Manager → Rules.
- The `id` filter keeps the rule on one ad set. Without it, the rule applies to **every** ad set in the account.
- Metric field names (`spent`, `cost_per_result`) follow Meta's Ad Rules filter list for the Graph version in `.env`; a field Meta does not know is rejected by Meta with an error and nothing is created. Run `--dry-run` first, then create it switched off, read it back with `rules list`, and switch it on (`"status": "ENABLED"` in a new rule, or the toggle in Ads Manager → Rules) only after the Owner has seen it.
- For a warning instead of a pause, use `"execution_spec": { "execution_type": "NOTIFICATION" }`.

### A targeting spec for `delivery-estimate` (`plans/<date>-targeting-draft.json`)

```json
{
  "geo_locations": { "countries": ["GB"], "location_types": ["home", "recent"] },
  "age_min": 25,
  "age_max": 55,
  "flexible_spec": [{ "interests": [{ "id": "<interest id from targeting-search>", "name": "<interest name>" }] }]
}
```

```
node creatives/tools/meta-graph.mjs delivery-estimate --targeting plans/<date>-targeting-draft.json --goal LEAD_GENERATION
```

When an audience sits in a special ad category (`config/audiences.md`), Meta limits age, gender, postcode and detailed targeting, and lookalike audiences cannot be used for those ad sets; the estimate is then a ceiling, not a plan. Whether a customer list may be the origin of a lookalike is a legal question for the Owner (`config/claims.md`), never the harness's call.

## Other examples

```
node creatives/tools/meta-graph.mjs check
node creatives/tools/meta-graph.mjs targeting-search --q "trail running" --type adinterest
node creatives/tools/meta-graph.mjs targeting-search --q "Manchester" --type adgeolocation
node creatives/tools/meta-graph.mjs insights --level adset --preset last_7d --breakdowns age,gender --out reports/data/<date>-adset-age-gender.csv
node creatives/tools/meta-graph.mjs insights --level ad --since 2026-01-01 --until 2026-01-31 --breakdowns publisher_platform,platform_position --async --out reports/data/<date>-placements.csv
node creatives/tools/meta-graph.mjs audiences lookalike --origin <audience id> --ratio 0.01 --country GB --name "LAL 1% site visitors GB"
```

Notes:
- `targeting-search` without `--type` uses the ad account's unified search; with `--type` it uses Meta's typed search (`adbehavior` is Meta's behaviours category).
- `insights` default columns: campaign, ad set and ad names, spend, impressions, reach, frequency, clicks, CTR, CPM, actions and cost per action, with the attribution windows 7-day click and 1-day view. Each action type becomes its own column, `action:<type>` and `cpa:<type>`. Common `--breakdowns`: `age`, `gender`, `publisher_platform`, `platform_position`, `hourly_stats_aggregated_by_advertiser_time_zone`, `country`, `region` (Meta allows only some combinations). `--ids` limits the rows to the listed campaigns, ad sets or ads. `--async` is for long ranges or many breakdowns: Meta prepares the report and the tool checks every 5 seconds, at most 60 times, then downloads it.
- Lists follow Meta's pages to the end, at most 500 pages per request.

## What goes wrong

| You see | What it means | What to do |
|---|---|---|
| exit 2, "No .env" or "is not set" | `.env` is missing or a line is empty | The Owner fills `.env` (names only in chat) |
| exit 1, code 190 | The token is wrong, expired or revoked | The Owner revokes, generates a new token, Copy → `env-set.mjs --from-clipboard META_MARKETING_TOKEN`, runs `check` |
| exit 1, code 200 or 10 | A permission or an asset is missing (often the Page for the lead subcommands) | The Owner follows the printed fix list |
| exit 2, "inside the repository" | `leads --out` points into the harness folder | Choose a folder outside it, such as Downloads |
| exit 2, "is refused: this tool only creates rules that PAUSE or send a NOTIFICATION" | The rule spec asks for another action | Change the action, or leave budget moves to the Owner's go |
| exit 1, "no Page token returned" | The System User does not have the Page | The Owner assigns the Page to the System User (step 1 above) |
| exit 1, "not finished after 60 polls" | Meta's async report is still running | Run again later, or ask for a shorter range or fewer breakdowns |
