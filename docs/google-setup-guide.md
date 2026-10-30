# Google Ads setup guide (the command line, then the Owner's browser steps)

What Google needs before the harness can read and build: the company's own Google Ads account, its own Google Cloud project with the Google Ads API, a service account the harness signs in with, API access at Explorer, and a conversion action. The Cloud side runs from the command line (`creatives/tools/google-cloud-setup.mjs` drives Google's own CLI, gcloud): no Cloud Console clicking. What Google offers no API for stays in the browser, and `/connect` chapter G drives it in the Owner's own Chrome, one go per chapter: the Google Ads account, billing, verification, adding the service account in Google Ads, and the Explorer application. The Owner types every password and code, accepts every terms screen, and enters the card and the identity documents. This page keeps the steps with their pitfalls for when something goes wrong, or for setting it up by hand.

Only when Google is one of the platforms in `config/operator.md`. Every row below has the same name in the console-steps table of `config/accounts.md` and a `google.*` item in the setup wizard.

## Words used

- **Google Ads account (customer):** where the campaigns live; a 10-digit id shown as 123-456-7890. The company's own, never an agency's.
- **Manager account (MCC):** an account that manages others (agencies). The harness never builds in one. When the company's account is reached through one, its id goes into `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.
- **Google Cloud project:** the container that owns the API access and the service account. The company's own, made for this harness.
- **Service account:** a robot Google user of the project (`harness-google-ads@<project>.iam.gserviceaccount.com`). Its key is a file gcloud writes into `.secrets/google-ads-key.json` (never committed, never shown); `.env` holds only its path, `GOOGLE_ADS_JSON_KEY_FILE`. Added as a user of the Google Ads account, it signs in with no refresh token and nothing expires.
- **gcloud:** Google's command line for Cloud. `google-cloud-setup.mjs install` puts it on the computer; `login` signs the Owner in once in the browser.
- **Access level:** Test (test accounts only), Explorer (real accounts, 2,880 operations a day), Basic, Standard. It belongs to the Cloud project since 2026-09-09; developer tokens were sunset.

## Steps

### G1. Google Ads account (`google.account`)
1. `ads.google.com`, signed in as the Google user who will own the logins (the account switcher shows them).
2. Existing account: the 10-digit id from the account menu, recorded in the console-steps table as "existing, verified <date>".
3. New account: start the setup, then **Switch to Expert mode** (the link under the first screens) → **Create an account without a campaign** → the country, the time zone and the currency. The time zone and currency are permanent: confirm them in chat.

**Pitfall:** the guided Smart campaign flow creates and runs a campaign at once. Always switch to Expert mode before the first campaign screen.

### G2. Billing on the Google Ads account (`google.billing`)
Google Ads → Admin (the gear) → Billing → Settings: the country, the payment profile and the card. The card is the Owner's hard stop. Nothing is charged while every campaign is PAUSED.

### G3. Advertiser verification on Google Ads (`google.verification`)
Google usually asks within days of the first ad (Admin → Advertiser verification). The organisation's documents and identity are the Owner's. Until it is done, ads may stop serving after the deadline Google states.

### G4. Cloud project, Google Ads API and service account, from the command line (`google.cloud`)
1. `node creatives/tools/google-cloud-setup.mjs check`. No gcloud: `node creatives/tools/google-cloud-setup.mjs install` (winget `Google.CloudSDK` on Windows, the Homebrew cask on a Mac; on Linux, Google's install page).
2. `node creatives/tools/google-cloud-setup.mjs login`: Google's sign-in opens; the Owner signs in as the Google user who owns (or will own) the company's Cloud project. The password and the code are the Owner's.
3. The project id: an existing project of this company, or a new id (6–30 lower-case letters, digits and hyphens; global across Google). `run` without `--project` suggests one from `config/company.md`.
4. `node creatives/tools/google-cloud-setup.mjs run --project <id>`. It reuses what exists and creates what is missing, in this order: the project, the Google Ads API (`googleads.googleapis.com`), the service account `harness-google-ads`, and its key (into `.secrets/google-ads-key.json`, limited to this user, never shown). Then it writes `GOOGLE_ADS_JSON_KEY_FILE=.secrets/google-ads-key.json` into `.env`. `--dry-run` prints the gcloud lines first.
5. Record `google_cloud_project_id` and `google_service_account` (the e-mail it prints) in `config/accounts.md`.

**Pitfalls:**
- An organization created after May 2024 (a Google Workspace domain) blocks service account keys by default (`iam.disableServiceAccountKeyCreation`). The tool stops and prints the one command an organization admin runs to lift it for this project only. When there is no such admin, use the fallback below.
- gcloud signed in as another business's Google user: `gcloud auth list` shows it; run `login` again with this company's user.
- Never reuse a project, a service account or a key from another business on this computer.

### G5. Service account added to the Google Ads account (`google.oauth`)
Google Ads → Admin (the gear) → **Access and security** → **+** under Users → the service account's e-mail (`run` prints it) → **Standard** → Add account. Google has no API for this step. Email-only access does not work for a service account; Admin is granted later only if an API call needs it.

### G6. Google Ads API access level Explorer (`google.access`)
Cloud Console → APIs & Services → Google Ads API → **Overview**. The access level of a new project is Test. **Upgrade access level** → Explorer → Apply, and fill the form (the Owner's). The review is usually automated; Google does not promise a time.

Do this right after G4 (`run` prints the link), so the review runs meanwhile. Record the level as `google_api_access_level`.

**Pitfalls:**
- Explorer has no Keyword Planner and no billing services: keyword research runs in the Google Ads interface.
- Basic needs brand verification first.
- Google lists a known issue where some upgrades are not honoured yet. If `check` still says Test a day after approval, re-check the Overview page.

### G7. The account and the check (`google.login`)
1. `node creatives/tools/google-ads.mjs accounts`: the accounts the service account was added to. The Owner picks the company's (not a manager, not a test account).
2. Run `printf %s <id> | node creatives/tools/env-set.mjs --from-stdin GOOGLE_ADS_CUSTOMER_ID --min-length 10`, and write `google_ads_customer_id` in `config/accounts.md`.
3. When the account is reached through a manager, do the same with `GOOGLE_ADS_LOGIN_CUSTOMER_ID` and `google_ads_manager_id`.
4. `node creatives/tools/google-ads.mjs check`: green. "has not added the service account yet" means G5 is not done.

### G8. Google conversion action and Google tag (`google.conversion`)
1. `google-ads.mjs conversions list`.
2. No action for the funnel's result yet and a website exists: run `google-ads.mjs conversions create --spec <file>` on the go, then `conversions list --tags --out plans/<date>-request-google-tag.md`. The snippets go to the product team (or the Owner) as a request.
3. The harness never installs a tag or writes consent wording. Consent gating follows `config/accounts.md`, as for the Meta pixel.
4. No website: `n/a`. Search campaigns bid on clicks.

## The fallback: an OAuth client (when service account keys are blocked)

Only when G4 stops on `iam.disableServiceAccountKeyCreation` and no organization admin can lift it. These are console steps, driven in the Owner's Chrome:
1. Google Auth Platform (APIs & Services → OAuth consent screen) → **Get started**: the app name (the company's), the support e-mail (typed by the Owner), **External**, the contact e-mail.
2. **Data access** → Add or remove scopes → add `https://www.googleapis.com/auth/adwords` (Google Ads API) → Save.
3. **Audience** → **Publish app** (In production). In Testing, Google expires the login after 7 days. The app does not need Google's verification for the company's own users: the Owner clicks through the "unverified app" screen once.
4. **Clients** → Create client → **Desktop app** (a Web application client does not work for the local sign-in) → a name → Create.
5. Copy the **client id**, then run `node creatives/tools/env-set.mjs --from-clipboard GOOGLE_ADS_CLIENT_ID --min-length 20`; copy the **client secret**, then the same with `GOOGLE_ADS_CLIENT_SECRET`. Each command clears the clipboard and prints only a character count. Never paste either value in chat.
6. `node creatives/tools/google-ads.mjs login` (bounded: `timeout 330`): the Owner signs in as the user who can open the company's Google Ads account, passes the unverified-app screen, keeps the Google Ads permission ticked and clicks **Allow**; the refresh token goes into `.env` unseen. Then G7.

Leave `GOOGLE_ADS_JSON_KEY_FILE` empty in this route: when it is set, the service account wins. Write "OAuth fallback: <reason>" in the note of the `Service account added to the Google Ads account` row.

## If you get stuck

`docs/google-ads.md` "What goes wrong" maps every error the tool prints to its fix. `/health` rows 29 and 30 read the login, the account, the objects and the spend.

## Checklist rows the wizard writes

`Google Ads account`, `Billing on the Google Ads account`, `Advertiser verification on Google Ads`, `Cloud project with the Google Ads API enabled`, `Service account added to the Google Ads account`, `Google Ads API access level Explorer`, `Google login checked`, `Google conversion action and Google tag`. Each is `done`, `open` (the Owner's turn) or `n/a`, with the date.
