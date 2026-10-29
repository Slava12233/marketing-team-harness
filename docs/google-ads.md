# The Google Ads tool (`creatives/tools/google-ads.mjs`)

Google's own Google Ads MCP server is read-only and runs on Python, so it cannot build anything. The harness talks to the Google Ads API itself through one Node file with no dependencies, `creatives/tools/google-ads.mjs`, in the same shape as the Meta tool `meta-graph.mjs`:
- every subcommand takes `--dry-run`, which prints the exact requests and makes no network call;
- secrets come from `.env` only and are never printed;
- the account comes from `.env` only, and the tool refuses to run when it differs from `google_ads_customer_id` in `config/accounts.md`;
- everything it builds is created PAUSED.

You rarely type these commands. Ask in the chat ("build the Search campaign from the plan", "how did Google do last week", "pause the Google campaign", "which searches brought clicks"), and the harness runs the command and shows you the answer. They are listed here so you can see what happens and check it.

## What each subcommand is for

| Subcommand | In plain words | Changes anything in Google Ads? |
|---|---|---|
| `login` | Opens Google's sign-in; the Owner clicks Allow. The login is saved in `.env` without anyone seeing it | No |
| `check` | Does the login work, which account does it reach, is the account enabled, how many conversion actions exist | No |
| `accounts` | Every Google Ads account the login can open (to pick the company's) | No |
| `search --gaql "SELECT …"` | Any read in Google's query language (SELECT only); `--out file.csv` writes a spreadsheet | No |
| `report --level campaign\|ad_group\|ad\|keyword\|search_term --range LAST_7_DAYS` | The baseline numbers (cost, conversions, cost per conversion, CTR, average CPC, impressions, clicks) in the account currency; `--since` / `--until` for a date range | No |
| `geo-search --q "<place>" [--country XX]` | The id of a country, region, city or area, with its reach | No |
| `language-ids [--q hebrew]` | The id of a language | No |
| `conversions list [--tags --out <file.md>]` | The conversion actions; with `--tags`, the Google tag snippets written into a request for whoever ships the site | No |
| `conversions create --spec <file.json>` | A website conversion action (a lead form sent, a contact, a purchase) | Yes: one conversion action |
| `build --spec <file.json> [--validate]` | A Search campaign from a spec: budget, bidding, places, languages, ad groups, keywords, negatives, responsive search ads, sitelinks, callouts. Google checks the whole batch first; then everything is created in one go, the campaign PAUSED. `--validate` stops after Google's check | Yes: a PAUSED campaign (it spends nothing) |
| `pause --resource <campaign, ad group or ad>` | Pause it. Always allowed | Yes: stops delivery |
| `enable --resource <campaign> --go "<the Owner's words>"` | Turn a campaign on. Refused without the Owner's words; the go log gets a row | Yes: **starts spending** |
| `budget --resource <budget> --amount <n> [--go "…"]` | Change the daily budget. A raise needs the Owner's words, is at most +20 % a step, and stays under the Google share of the caps; a cut needs no go | Yes |

`--json` prints the raw answer (human lines go to the error stream). Exit codes: 0 ok, 1 Google or the network refused, 2 a missing setting, a bad argument or a refusal by the tool.

## Before the first use

1. **The company's own Google Cloud project and OAuth client.** Chapter G of `/connect` drives it in the Owner's Chrome (`docs/google-setup-guide.md`):
   - the project, with the Google Ads API enabled;
   - the consent screen published, with the Google Ads scope;
   - a client of type Desktop app.

   Its id and secret are copied in the console and moved into `.env` by `node creatives/tools/env-set.mjs --from-clipboard GOOGLE_ADS_CLIENT_ID` (then `GOOGLE_ADS_CLIENT_SECRET`), unseen.
2. **API access.** A new project reaches test accounts only (Test access). The Owner applies for Explorer in the Cloud Console (Google Ads API → Overview → Upgrade access level). Google sunset developer tokens on 2026-09-09; access follows the project now.
3. **The login.** `node creatives/tools/google-ads.mjs login`. The Owner signs in with the Google user who can open the company's Google Ads account and clicks Allow. The tool catches Google's answer on this computer (a local address, `127.0.0.1`), writes `GOOGLE_ADS_REFRESH_TOKEN` into `.env`, and prints only its length.
4. **The account.** Set it up in this order:
   - `accounts` lists the accounts the login reaches;
   - put the company's own account into `.env` as `GOOGLE_ADS_CUSTOMER_ID`, and into `config/accounts.md` as `google_ads_customer_id`;
   - when the account is reached through a manager account (an agency MCC), put the manager into `.env` as `GOOGLE_ADS_LOGIN_CUSTOMER_ID`;
   - then `check`.

## The build spec

The spec is a JSON file next to the plan (`plans/<date>-google-<flight>.json`). Its fields, its rules and an example are in the `google-ads-build` skill. Before anything is sent, the tool refuses a spec with any of these problems:
- a status: the campaign is always PAUSED;
- a headline over 30 characters, or a description over 90;
- fewer than 3 headlines, or fewer than 2 descriptions;
- a final URL that is not a destination page of `config/product.md`;
- a keyword match type other than EXACT, PHRASE or BROAD;
- a daily budget above half the Google share of the daily cap in `config/goals.md`. Google may spend up to twice a daily budget on one day.

It warns when `config/product.md` or `config/goals.md` is not filled yet, and when the click tracking (`final_url_suffix` with `utm_source`) is missing.

The real build sends Google's `validateOnly` first. Only when Google accepts the whole batch does it send the batch again for real: one atomic request, all or nothing. It then reads the campaign back and warns (exit 1) if it is not PAUSED.

## The ledger and what the folder knows

Every write appends to `creatives/uploads/<date>-google-ads.json`: the command, the account, a summary, the resource names, the status, and the error if any. Reads append nothing.

The resource names a build or a conversion creates are kept in `memory/state/known-objects-google.json`. `enable` and `budget` act only on a resource listed there or named in the vault, the plans, the reports, the config or the checklist. This is the Google side of the account guard: another company's campaign cannot be turned on from this folder.

## The go

`enable --go "<words>"` and a `budget` raise append a row to `memory/money/go-log.md`: the date, the time, the channel (`--channel`, default `chat`), the Owner's words quoted exactly, the resource, the daily budget, the cap and share, the end date, and who executed it.

The main session runs these only after the Owner's go in the same message, as `CLAUDE.md` says. The tool's own refusal is the second lock, not a replacement for the first.

## What goes wrong

| What you see | What it means | What to do |
|---|---|---|
| `invalid_grant` | The login expired or was revoked. A consent screen still in Testing expires it after 7 days | Publish the consent screen (Google Auth Platform → Audience → Publish app), then `login` again |
| "Test only" / `DEVELOPER_TOKEN_NOT_APPROVED` / a test-account error | The Cloud project's access is Test | The Owner applies for Explorer; meanwhile only test accounts work |
| `USER_PERMISSION_DENIED` | The signed-in user cannot open this account, or reaches it only through a manager | Set `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, or add the user in Google Ads → Admin → Access and security |
| `CUSTOMER_NOT_ENABLED` | The account has no billing yet, or was cancelled | Google Ads → Billing |
| `SERVICE_DISABLED` | The Google Ads API is off in the project | Cloud Console → APIs & Services → Library → Google Ads API → Enable |
| `EU_POLITICAL_ADVERTISING_DECLARATION_REQUIRED` | An old campaign in the account has no EU political ads answer | The Owner answers it in that campaign's settings |
| "refused: .env holds … bound to …" | `.env` names another account than `config/accounts.md` | Another company's account is another harness folder; if this company's account changed, change both |

Nothing is ever retried automatically.

## Optional: Google's read-only MCP

For ad-hoc questions in chat, Google's own server (`googleads/google-ads-mcp`, Python, `pipx run`) can be added to `.mcp.json` by the Owner. It needs Python, pipx and Application Default Credentials (`gcloud auth application-default login` with the company's own OAuth client). It adds no capability the tool's `search` lacks, so the harness does not ship it.
