# Google Ads setup guide (the Owner's console steps)

What Google needs before the harness can read and build: the company's own Google Ads account, its own Google Cloud project with the Google Ads API, a published consent screen with a Desktop client, API access at Explorer, and one login. `/connect` chapter G drives every step in the Owner's own Chrome, one go per chapter. The Owner types every password and code, accepts every terms screen, and enters the card and the identity documents. This page keeps the steps with their pitfalls for when something goes wrong, or for setting it up by hand.

Only when Google is one of the platforms in `config/operator.md`. Every row below has the same name in the console-steps table of `config/accounts.md` and a `google.*` item in the setup wizard.

## Words used

- **Google Ads account (customer):** where the campaigns live; a 10-digit id shown as 123-456-7890. The company's own, never an agency's.
- **Manager account (MCC):** an account that manages others (agencies). The harness never builds in one. When the company's account is reached through one, its id goes into `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.
- **Google Cloud project:** the container that owns the API access and the login client. The company's own, made for this harness.
- **OAuth consent screen and client:** what the Owner sees when they click Allow, and the app identity behind it. Its secret is stored in `.env`, unseen.
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

### G4. Cloud project with the Google Ads API enabled (`google.cloud`)
1. `console.cloud.google.com` → the project picker → **New project**, named after the company (for example "<company> marketing harness").
2. APIs & Services → Library → **Google Ads API** → Enable.
3. Record the project id as `google_cloud_project_id`.

**Pitfall:** never reuse a project from another business on this computer; its access level and its login belong to that business.

### G5. OAuth consent screen and Desktop client (`google.oauth`)
1. Google Auth Platform (APIs & Services → OAuth consent screen) → **Get started**: the app name (the company's), the support e-mail (typed by the Owner), **External**, the contact e-mail.
2. **Data access** → Add or remove scopes → add `https://www.googleapis.com/auth/adwords` (Google Ads API) → Save.
3. **Audience** → **Publish app** (In production). In Testing, Google expires the login after 7 days. The app does not need Google's verification for the company's own users: the Owner clicks through the "unverified app" screen once.
4. **Clients** → Create client → **Desktop app** → a name → Create.
5. Copy the **client id**, then run `node creatives/tools/env-set.mjs --from-clipboard GOOGLE_ADS_CLIENT_ID --min-length 20`.
6. Copy the **client secret**, then run `node creatives/tools/env-set.mjs --from-clipboard GOOGLE_ADS_CLIENT_SECRET`.

Each command clears the clipboard and prints only a character count. Never paste either value in chat.

**Pitfall:** a Web application client does not work for the local sign-in. The type must be Desktop app.

### G6. Google Ads API access level Explorer (`google.access`)
Cloud Console → APIs & Services → Google Ads API → **Overview**. The access level of a new project is Test. **Upgrade access level** → Explorer → Apply, and fill the form (the Owner's). The review is usually automated; Google does not promise a time.

Do this before the login, so it runs meanwhile. Record the level as `google_api_access_level`.

**Pitfalls:**
- Explorer has no Keyword Planner and no billing services: keyword research runs in the Google Ads interface.
- Basic needs brand verification first.
- Google lists a known issue where some upgrades are not honoured yet. If `check` still says Test a day after approval, re-check the Overview page.

### G7. Google login (`google.login`)
1. `node creatives/tools/google-ads.mjs login` (bounded: `timeout 330`). The default browser opens Google's sign-in; the Owner signs in as the user who can open the company's Google Ads account, passes the unverified-app screen, keeps the Google Ads permission ticked and clicks **Allow**.
2. The page says "Signed in"; the tool prints `GOOGLE_ADS_REFRESH_TOKEN saved to .env (N characters)`.
3. `node creatives/tools/google-ads.mjs accounts`: the Owner picks the company's account (not a manager, not a test account).
4. Run `printf %s <id> | node creatives/tools/env-set.mjs --from-stdin GOOGLE_ADS_CUSTOMER_ID --min-length 10`, and write `google_ads_customer_id` in `config/accounts.md`.
5. When the account is reached through a manager, do the same with `GOOGLE_ADS_LOGIN_CUSTOMER_ID` and `google_ads_manager_id`.
6. `node creatives/tools/google-ads.mjs check`: green.

**Pitfalls:**
- A browser signed in as another Google user signs the wrong user in. Use the account chooser.
- No browser opens (a remote session): the tool prints the address; open it on the same computer.

### G8. Google conversion action and Google tag (`google.conversion`)
1. `google-ads.mjs conversions list`.
2. No action for the funnel's result yet and a website exists: run `google-ads.mjs conversions create --spec <file>` on the go, then `conversions list --tags --out plans/<date>-request-google-tag.md`. The snippets go to the product team (or the Owner) as a request.
3. The harness never installs a tag or writes consent wording. Consent gating follows `config/accounts.md`, as for the Meta pixel.
4. No website: `n/a`. Search campaigns bid on clicks.

## If you get stuck

`docs/google-ads.md` "What goes wrong" maps every error the tool prints to its fix. `/health` rows 29 and 30 read the login, the account, the objects and the spend.

## Checklist rows the wizard writes

`Google Ads account`, `Billing on the Google Ads account`, `Advertiser verification on Google Ads`, `Cloud project with the Google Ads API enabled`, `OAuth consent screen and Desktop client`, `Google Ads API access level Explorer`, `Google login (refresh token in .env)`, `Google conversion action and Google tag`. Each is `done`, `open` (the Owner's turn) or `n/a`, with the date.
