# Meta setup guide: the Owner's steps

This is the text half of the setup guide. Screenshots from the explainer video will be added under each step, where the `[screenshot: step N]` lines are. The `/setup` wizard prints the same steps as short click lists while it interviews you, and checks each outcome live; this page is the longer version, with the reasons and the pitfalls.

## What Meta needs from you, and why

Before the harness can read your Meta account and build campaigns, Meta needs a few things that only the Owner can set up. A **Business portfolio** is the company's home in Meta: it owns the ad account and the Page, and it is where people, apps and tokens are managed. A **Facebook Page** is the name every ad runs under. An **ad account** under the portfolio, with a payment method and a verified phone number, is where campaigns live and where spend is billed. **Roles** let other people work in the account without sharing a password. The **Claude Code login** lets the harness read the account and build paused campaigns. A **pixel** (Meta now calls it a dataset) lets Meta count what visitors do on your website; it is only needed when ads send people to a website. A **developer app with a System User token** lets the harness upload image and video files from this computer straight into the ad account. **WhatsApp, lead forms, domain verification and Instagram** are needed only for the funnels that use them.

**Meta renames buttons and moves menus often; the outcomes stay the same.** Each step below names the outcome you are after (what must be true when you are done) as well as today's labels. If a label on your screen is different, look for the outcome. Wherever Meta offers a read, the harness checks the outcome itself.

The harness clicks in Meta's consoles only in the two driven modes below: the connections pass (`/connect`; `/onboard` routes to it), in your own Chrome on your own go, and the installer-led mode, on the installer's word; never past the hard-stop list. Otherwise it prepares the click list, waits for you, and checks.

## Before you start

- **Your own Facebook profile**, in your real name, with **two-factor authentication** turned on (`https://accountscenter.facebook.com/password_and_security` → Two-factor authentication). Meta asks for it on many business actions, and it protects the ad account. Never use a shared or "company" profile.
- **Admin of the company's Facebook Page** (full control). If someone else created the Page, ask them to give you full control first.
- **A payment card** (or another payment method Meta accepts in your country) for the ad account. Nothing is charged until a campaign runs, and the harness builds everything paused.
- **The contact of whoever runs the website**: an agency, a freelancer, or your own login to the website builder. You need them for the pixel (step 6) and the domain (step 10).
- **The WhatsApp Business app on the business phone**, holding the business number, if you plan click-to-WhatsApp ads (step 8).
- **A plain text editor** (Notepad on Windows, TextEdit on macOS), only as the fallback for the token in step 7 when the clipboard tool cannot be used.
- **Time.** About two hours of clicks, best spread over a few days: Meta sometimes reviews a new ad account before it lets it spend.

## Three ways to do these steps

- **Yourself, with the harness driving your Chrome: `/connect`, the connections pass.** You sit at your own computer, in the Claude desktop app's Code tab, with Google Chrome open and the Claude in Chrome extension signed in with the same Claude account. You type `/connect`; it asks your language, then what you already have in Meta, and the harness leads these steps chapter by chapter (A3 to A10 of the video): it opens the screens in your Chrome, reads them, fills names and public ids, and clicks only when you type the go in the chat; at every hard stop it stops and says "your turn": any password or code, the payment card, accepting legal terms. The token is not a hard stop any more: on your go the harness clicks Generate and Copy and a tool moves it from the clipboard into `.env` and clears the clipboard, so nobody sees or pastes it; the two public ids go the same way. It ends with the keys table (`/health --keys`) all green and the full `/health`, and it resumes at the first open chapter whenever a code or a review made it stop.
- **Yourself, with the click lists.** You (the Owner) click through the steps on this page; `/setup` prints the same steps as short click lists and checks each outcome live.
- **Installer-led, with the `setup-console` skill.** The person who installs the harness for you sits at your Meta consoles with your admin access for the setup day (`docs/client-intake.md` §1, option 0) and says "drive the consoles". The harness then drives these screens in the installer's browser: it clicks on the installer's word, one step at a time, and stops at its hard-stop list, where a person always does the step: any password or code, identity documents, the payment card, accepting legal terms (the Lead Ads terms, the developer terms), copying the token into `.env`, and Discard drafts or deletes. Afterwards you remove or downgrade the installer's access.

The steps, their outcomes and their pitfalls are the same either way.

## Words used on this page

| Word | What it means |
|---|---|
| Business portfolio | The company's account in Meta's business tools (it used to be called Business Manager). It owns the ad account, the Page, the pixel and the apps |
| Business Settings | The settings screens of the portfolio: people, accounts, apps, system users, domains (`https://business.facebook.com/settings`) |
| Meta Business Suite | Meta's business website (`https://business.facebook.com`), with the Page inbox, Leads Center, Instant forms and the other tools |
| Ads Manager | Where campaigns, ad sets and ads are listed and edited (`https://adsmanager.facebook.com`) |
| Events Manager | Where the pixel (dataset) is created and tested |
| Pixel, dataset | A small piece of code on your website that tells Meta what visitors do there (a visit, a sign-up). Meta now calls its container a dataset; on this page the two words mean the same thing |
| System User | A user that is not a person and belongs to the portfolio. The harness's upload tool works as this user, so nobody's personal login is shared |
| Token | A long secret string that lets a program act as the System User. Treat it like a password: it goes only into `.env` |
| `.env` | A small text file in the harness folder, on this computer only, that holds the token. It is never uploaded or shared |
| MCP | The connection Claude Code uses to talk to Meta (`meta-ads`) and to fal (`fal`) |
| DNS | The address book of the internet, managed wherever the company's domain name was bought or is hosted (step 10) |
| Leads Center | The page in Meta Business Suite where instant-form leads arrive: the default lead delivery (step 9) |

## Where every secret lives (the credential map)

Most of the harness's connections are not keys in a file: they log in once, and the login is stored on this computer by Claude Code or by the tool itself. Nothing is copied from one company's computer to another's; a new company logs in with its own accounts. Only the two Graph tools read a key, and that key lives in `.env`. The same map, with the optional lines, is at the top of `.env.example`.

| Connection | Kind | Where the secret lives | How it is provided | Checked by |
|---|---|---|---|---|
| Meta Ads MCP (`meta-ads`) | OAuth, the Owner's Facebook login | Claude Code's credential store | `/mcp` → `meta-ads` → log in, in the browser where the Owner is signed in (step 5) | `/health` 1 and 2 |
| fal MCP (`fal`, optional: generated pictures) | OAuth, a fal login | Claude Code's credential store | `/mcp` → `fal` → log in | `/health` 8 |
| The Graph tools (`meta-upload.mjs`, `meta-graph.mjs`) | a System User token | `META_MARKETING_TOKEN` in `.env` (plus the two public ids `META_AD_ACCOUNT_ID`, `META_PAGE_ID`) | generated in Business Settings → System users (in `/connect` the harness clicks it on the Owner's go) and moved from the clipboard into `.env` by `creatives/tools/env-set.mjs --from-clipboard`, unseen (step 7); never into the chat; the text-editor paste is the fallback | `/health` 13 and 20 |
| Vercel CLI (optional: the preview site and landing pages) | a CLI login | the Vercel CLI's own store in the user folder | `npx vercel@latest login` once | `/health` 7 |
| HyperFrames (optional: videos), Obsidian (optional: the vault) | none | | | `/health` 14 and 19 |
| The Claude desktop app (the Code tab: where the harness runs, with its own copy of Claude Code; the memory routines, Remote Control and the extension's pairing) | the Claude account | the app's own sign-in | sign in in the app, click the Code tab, open this folder | `/health` 26 |
| Claude in Chrome (the extension in your own Chrome: the keys pass, later Ads Manager reads) | the extension's Claude sign-in and your browser's Facebook session | the extension and the browser | the Chrome Web Store → Add to Chrome → sign in with the same Claude account as the app; in the app: your initials → Settings → Customize → Connectors → Claude in Chrome → Configure; facebook.com signed in as your personal profile | `/health` 27 |
| Claude Code in a terminal (optional) | the Claude account | Claude Code's own login | `claude login` | |

Two optional lines sit commented in `.env.example` for things the harness does not do by default: `FAL_KEY` (a script of your own calling fal directly instead of through the MCP) and `VERCEL_TOKEN` (a scheduled deploy without an interactive login). Nothing shipped reads them; leave them commented unless a tool of your own needs them, and keep the rule: names in chat, values only in `.env`.

## Which steps you need

| Step | What | Needed when | Video chapter | Roughly |
|---|---|---|---|---|
| 1 | Business portfolio | always | A4 Meta business basics | 10 min |
| 2 | Facebook Page | always | A4 Meta business basics | 5 min |
| 3 | Ad account, payment method, phone | always | A4 Meta business basics | 15 min, then Meta's checks (minutes to days) |
| 4 | People and roles | when the Operator is not the Owner | A4 Meta business basics | 5 min per person |
| 5 | The Claude Code login to Meta | always | A5 The Meta login | 5 min |
| 6 | Pixel (dataset) | when an ad sends people to a website | A6 The pixel | 15 min, plus the website person's time |
| 7 | Developer app and upload token | recommended (direct upload of your own image and video files; without it the harness uploads through a public URL) | A7 The developer app, the System User, the token | 20 min |
| 8 | WhatsApp number | for click-to-WhatsApp ads | A8 WhatsApp, lead forms, domain | 10 min |
| 9 | Lead forms | for instant-form ads | A8 WhatsApp, lead forms, domain | 20 min per form |
| 10 | Domain verification | recommended for ads that link to your website | A8 WhatsApp, lead forms, domain | 10 min, plus up to 72 hours for DNS |
| 11 | Instagram | optional, to run Instagram placements under your own Instagram name | A4 Meta business basics | 10 min |

Do the steps in this order. The harness checks steps 1 to 4 after step 5, once it can read the account.

## Step 1. The Business portfolio

**Where:** `https://business.facebook.com` (Meta Business Suite); its settings at `https://business.facebook.com/settings`.

**Clicks:**
1. Open Meta Business Suite, signed in with your own Facebook profile.
2. Look at the business name at the top left (the portfolio switcher). If the company's portfolio is listed, select it and go to 4.
3. If there is none, create a business portfolio: the business name as customers know it (it is shown to people), your name, and a business email address. Confirm the email Meta sends you.
4. Business Settings → Users → People: make sure your own name is listed with full control (Meta's admin access).
5. Business Settings → Business info: note the business portfolio ID, a long number. It is not a secret; the harness may ask for it.
6. Recommended: Business Settings → Security Center → require two-factor authentication for everyone, or at least for admins.

**What you should see:** the company's portfolio selected at the top, your name under People with full control, and the portfolio ID under Business info.

**What the harness checks:** after step 5, `ads_get_ad_accounts` shows the business that owns the ad account. If the read does not include it, `/setup` asks you for the portfolio ID and writes it into `config/accounts.md` as `business_portfolio_id`.

**Pitfalls:**
- An agency or a former employee may already have created a portfolio for the company. Find it before you create a new one: two portfolios for one company split the Page, the ad account and the pixel between them.
- If an agency's portfolio owns your Page or ad account, ask the agency to move ownership to your portfolio, or at least to give your portfolio access. The harness works best when your own portfolio owns everything.
- Add a second person with full control as a backup (Meta recommends two admins), so the company is not locked out if one profile is lost.

**Screenshots:** [screenshot: step 1]

## Step 2. The Facebook Page

**Where:** `https://www.facebook.com/pages/?category=your_pages` (the Pages you manage) and Business Settings → Accounts → Pages (`https://business.facebook.com/settings/pages`).

**Clicks:**
1. Open the list of Pages you manage and find the company's Page.
2. Switch into the Page, open its settings and then its Page access: make sure you are listed with full control.
3. Business Settings → Accounts → Pages: check that the Page is listed. If it is not: Add → add a Page you own (it moves under your portfolio), or request access if another business owns it.
4. Optional: link an Instagram account (step 11).

**What you should see:** the Page under Business Settings → Accounts → Pages, owned by your portfolio, and you listed with full control on it.

**What the harness checks:** after step 5, `ads_get_user_pages` (and `ads_get_ad_account_pages` for the ad account) lists the Page; `/setup` writes its id into `config/accounts.md` as `page_id`.

**Pitfalls:**
- Two Pages with the company's name (an old one, or a duplicate made by mistake): pick the one customers know and tell `/setup` about the other. It goes into `config/accounts.md` as a duplicate to avoid, so no ad ever runs from it.
- The Page's name and picture are shown on every ad. Fix them before the first ad, not after.
- A Page that Meta has restricted cannot advertise. Account Quality (`https://www.facebook.com/accountquality`) shows any restriction.

**Screenshots:** [screenshot: step 2]

## Step 3. The ad account

**Where:** Business Settings → Accounts → Ad accounts (`https://business.facebook.com/settings/ad-accounts`); Billing and payments (`https://business.facebook.com/billing_hub/payment_settings`); Ads Manager (`https://adsmanager.facebook.com`).

**If the company already has an ad account:** check that Business Settings → Accounts → Ad accounts lists it as owned by your portfolio, that you have full control on it, and that it is active. Then go to click 6. An account with some history is usually trusted more by Meta than a brand-new one.

**Clicks (a new account):**
1. Business Settings → Accounts → Ad accounts → Add → Create a new ad account.
2. Name it, for example the company name followed by "Ads".
3. **The time zone and the currency cannot be changed later.** Choose the time zone of the market you advertise in (reports and schedules follow it) and the currency you want to be billed in and to report in (usually that of your card and your market). If you are not sure, stop and ask before you go on.
4. When Meta asks who the account is for, choose your own business.
5. Give yourself full control of the ad account (and the Operator too, step 4, if you already know who it is).
6. Add a payment method: Billing and payments → the ad account → Add payment method → your card. Nothing is charged while every campaign is paused.
7. Verify a phone number on the ad account. Meta asks for it in the ad account's settings in Ads Manager, in a banner at the top of Ads Manager, or when something is first published. Enter the number, type the code Meta sends, and confirm.

**What you should see:** the account under Business Settings → Accounts → Ad accounts, owned by your portfolio, with the time zone and currency you chose; a payment method on it; the phone number shown as verified.

**What the harness checks:** after step 5, `ads_get_ad_accounts` shows the account's name, id, currency and status and, where the read gives them, the payment method and the minimum daily budget. `/setup` writes them into `config/accounts.md`; you type the same id into `.env` in step 7. There is no read for the phone number, so its checklist row stays open until you confirm it: without it, Meta refuses the first activation (Ads Manager error #3858013).

**Pitfalls:**
- **Once more: the currency and the time zone are permanent.** A wrong choice means a new ad account, without the old one's history.
- New ad accounts are sometimes restricted, or given a low spending limit, for a few days while Meta reviews them. Start this step early. Do not create several accounts to get around it: that looks like abuse to Meta's systems and can get all of them restricted. A new portfolio is often allowed only one ad account at first.
- A restricted account shows the reason and a review option in Account Quality (`https://www.facebook.com/accountquality`). Requesting the review is the Owner's; the harness does not appeal.
- A card that fails, or a card Meta does not accept for that currency, holds the account. Billing and payments shows the problem.

**Screenshots:** [screenshot: step 3]

## Step 4. People and roles

**Where:** Business Settings → Users → People (`https://business.facebook.com/settings/people`).

**Clicks:**
1. Business Settings → Users → People → invite (add) people.
2. Type the Operator's work email. Give them partial access (Meta's employee access), not full control.
3. Assign assets: Ad accounts → the company's ad account → **Manage campaigns**. Add the Page too, with the tasks they need (for example ads, messages and insights).
4. Send the invite. The Operator accepts it from the email and signs in with their **own** Facebook profile.
5. When someone leaves the company, remove them here the same day.

**What you should see:** the Operator under People, with the ad account (Manage campaigns) and the Page.

**What the harness checks:** nothing in Meta: Meta's server has no read of people and roles. `/setup` records who holds which login in `config/accounts.md` and `config/operator.md`, names only.

**Pitfalls:**
- **Never share a password or a Facebook profile.** Each person signs in as themselves; access is given by role and can be taken back without anyone changing a password.
- The Operator's role lets them look in Ads Manager at what the harness built. The harness's own Meta login (step 5) stays the Owner's, unless the Owner decides otherwise and records it in `config/accounts.md`.
- An agency gets partner access to the portfolio (Business Settings → Users → Partners), not personal invites for its staff.

**Screenshots:** [screenshot: step 4]

## Step 5. The Claude Code login to Meta

**Where:** Claude Code, opened in the harness folder; the browser opens Facebook's login for business.

**Clicks:**
1. Open the harness folder in Claude Code (the desktop app's Code tab, or type `claude` in a terminal in that folder). When Claude Code asks whether to use the two MCP servers the folder brings in `.mcp.json`, `meta-ads` and `fal`, approve them; if the Code tab does not ask, `/mcp` lists them.
2. Type `/mcp`, choose `meta-ads`, and choose to log in. When the Code tab offers no login there, run `claude mcp login meta-ads` in a terminal in the folder (and `claude mcp login fal` for fal).
3. A browser tab opens on Facebook. Check that the profile shown is **yours, the Owner's**. If it is someone else's, log out in that browser first, or copy the link into the browser where you are signed in.
4. Read the consent screen (Facebook Login for Business). It names the app that is asking, lists what it may do (for example create, manage and read ads, and read your Pages and business assets), and asks which businesses, ad accounts and Pages it may use.
5. Choose **this company's** business portfolio, ad account and Page. If the screen offers "all current and future" businesses or accounts, choose the specific ones instead.
6. Confirm. The browser tells you to go back to Claude Code, and `/mcp` shows `meta-ads` as connected.
7. Start a new session in the same folder (in the app: a new session on the folder; in a terminal: `/exit`, then `claude`). **In this harness's experience Meta's tools load only into a session started after the login**; the documentation does not require the step, so keep it and lose nothing.

**What you should see:** in the new session, ask "which ad accounts can you see?". The harness lists the company's ad account with its name, id, currency and status, and nothing from other businesses.

**What the harness checks:** `ads_get_ad_accounts` (the account from step 3 is visible, active and in the currency you chose) and `ads_get_user_pages` (the Page from step 2). `/setup` writes the ids into `config/accounts.md`, and `/health` checks the login and the account every time it runs.

**Pitfalls:**
- The wrong Facebook profile in the browser is the most common mistake: the harness then sees the wrong accounts, or none.
- If your profile manages other businesses, leave them out of the grant. The harness only ever touches the account in `config/accounts.md`, but a narrow grant is safer.
- The Meta tools are missing: start a new session. If `/mcp` does not list `meta-ads` at all, the folder's servers were not approved: run `claude mcp reset-project-choices` in a terminal and open the folder again, or add the server by hand with `claude mcp add --transport http --scope user meta-ads https://mcp.facebook.com/ads`. Then `/mcp` → `meta-ads` → log in, and a new session.
- The login can expire, or stop when you change your Facebook password: `/mcp` → `meta-ads` → log in again, then a new session.
- You can see or remove the connection later in your Facebook settings, under Business integrations.
- fal logs in the same way (`/mcp` → `fal`) with the company's fal account. It is optional; `ONBOARDING.md` covers it.

**Screenshots:** [screenshot: step 5]

## Step 6. The pixel (dataset)

Skip this step if no ad will send people to a website; see "No website yet" under the pitfalls.

**Where:** Events Manager, `https://business.facebook.com/events_manager2`.

**Clicks:**
1. Open Events Manager with the company's portfolio selected at the top.
2. Connect data sources → Web → Connect.
3. Name the dataset (for example the website's name) → Create.
4. Type the website's address when Meta asks; it checks whether your website platform has a ready-made integration.
5. Choose how to install it:
   - **A partner integration**, if the website runs on Wix, WordPress, Shopify, Webflow, Squarespace or another platform Meta lists. Follow Meta's steps (it may ask you to log in to the website builder), or send them to whoever runs the website.
   - **The code by hand**, otherwise. Meta shows the pixel's base code. Send it to whoever runs the website with one sentence: "Please install this on every page, inside the head, and load it only after the visitor accepts cookies where the law requires it." The pixel code is not a secret.
6. Skip the Conversions API for now. It needs a developer, and the harness does not need it to start.
7. Make sure the ad account can use the dataset: Business Settings → Data sources → Datasets → the dataset → connected assets → the ad account. It is often connected already.
8. Test it: Events Manager → the dataset → Test events → type the website's address → open the site → a **PageView** appears within a minute or two.

**What you should see:** the dataset in Events Manager with its id (a long number), a PageView under Test events, and an active status after a day of visits.

**What the harness checks:** `ads_get_datasets` lists the dataset, and `/setup` writes its id into `config/accounts.md` as `pixel_id`. `/setup` also opens every destination page and notes whether the pixel code shows; `not seen (may load after consent)` is normal on a site with a cookie banner. Once ads run, `/health` reads the dataset's events, and the `signals-audit` skill checks events, consent and attribution.

**Pitfalls:**
- **Consent.** In many markets (for example in the European Union and the United Kingdom) the pixel may load only after the visitor agrees in a cookie banner. The website owner and the company's lawyer decide the banner and its wording; the harness never writes consent wording. A pixel that waits for consent shows fewer events: that is expected, not broken.
- Two pixels on one website, or one pixel installed twice, count everything double. Ask the website person to check before installing.
- A pixel created by an agency in its own portfolio: ask the agency to share it with your portfolio, or create your own.
- Your own ad blocker or privacy extension can hide your test visit. Test in a private window or another browser.
- **No website yet:** that is fine. Click-to-WhatsApp and instant-form ads need no pixel. The checklist row says n/a; come back to this step when a site exists.

**Screenshots:** [screenshot: step 6]

## Step 7. The developer app and the upload token

The harness uploads image and video files from this computer into the ad account with a small tool, `creatives/tools/meta-upload.mjs`. The tool needs a token: a password for a System User of your portfolio. This step creates the app, the System User and the token. It looks technical, but it is only clicks: in `/connect` the harness clicks them in your Chrome on your go, and a small tool (`creatives/tools/env-set.mjs`) moves the token from the clipboard into `.env` and clears the clipboard, so neither you nor the harness ever sees or pastes the value. The clicks below are the same steps for the case without the extension.

**Where:** `https://developers.facebook.com/apps` (the app); Business Settings → Accounts → Apps (`https://business.facebook.com/settings/apps`); Business Settings → Users → System users (`https://business.facebook.com/settings/system-users`).

**Clicks: the app**

1. Open `https://developers.facebook.com/apps` with your own Facebook profile. The first time, Meta asks you to register as a developer (accept its platform terms, confirm a phone number or an email).
2. Create app. Give it a name (for example your company's name followed by "uploads") and a contact email.
3. When Meta asks what the app is for, choose the **Business** app type or, if Meta asks for a use case instead, the one about creating and managing ads with the Marketing API. When asked, connect the app to the company's business portfolio.
4. In the app's dashboard, make sure the **Marketing API** product is added (Add product → Marketing API → Set up). If the use case added it already, there is nothing to do.
5. Note the App ID shown on the dashboard; it is not a secret. Leave the App Secret alone: the harness never needs it, and it must never be copied anywhere.

**Clicks: the app in your portfolio**

6. Business Settings → Accounts → Apps: the app should be listed. If it is not: Add → connect an app ID → type the App ID.

**Clicks: the System User**

7. Business Settings → Users → System users → Add. Name it (for example `marketing-uploads`), choose the role **Employee** (not Admin) → Create.
8. Select it → assign assets (Add assets). It needs **three** assets; assign all three now:
   - Ad accounts → the company's ad account → **Manage campaigns** (in the new screens: Full control) → Save.
   - Apps → the app from click 2 → **Develop app** → Save.
   - Facebook Pages → the company's Page → **Full access ("Everything")** → Save. Without the Page, every Page call (lead forms, leads) is refused with code 10, even when the token holds the Page permissions.

   In the new Business Settings screens the path is: System users → the user → "…" → **Assign assets** → Facebook Pages → tick the Page → Full access "Everything" → Assign assets → "Assets assigned" (the ad account and the app the same way). The Page's own screen under Accounts → Pages has "Assign people" as a second way to the same outcome.

**Clicks: the token**

9. Still on the System User: Generate new token → choose the app → token expiration **Never**, if Meta offers the choice → tick **`ads_management`** and **`ads_read`**, and for lead forms and leads (the Graph tool, `docs/meta-graph.md`) **`leads_retrieval`**, **`pages_manage_ads`**, **`pages_read_engagement`** and **`pages_show_list`**; nothing else → Generate.
10. Meta shows the token **once**, with a Copy button. Click **Copy** (in `/connect` the harness clicks it for you, reading nothing on that screen).
11. In a terminal in the harness folder, run the line below (in `/connect` the harness runs it). It takes the token from the clipboard, writes it after `META_MARKETING_TOKEN=` in `.env`, restricts the file to your user, clears the clipboard, and prints only the name and the number of characters:
    ```
    node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN
    ```
    The two public ids go in the same way, `META_AD_ACCOUNT_ID` (the ad account id from step 3, digits only) and `META_PAGE_ID` (the Page id from step 2); in `/connect` the harness does both. **Fallback without a clipboard tool:** open `.env` with Notepad (Windows) or TextEdit (macOS), paste the token right after `META_MARKETING_TOKEN=`, no space, no quotes, fill the two id lines, save, close.
12. Close the token dialog in Meta. Back in Claude Code, ask "check the upload token". The harness runs `node creatives/tools/meta-upload.mjs --check`; you can also run it yourself in a terminal in the folder.

**Never paste the token into the chat, an email, a message, a document or a screenshot.** It goes only into `.env`, which stays on this computer and is never uploaded. A token that reaches the chat, or anywhere else, is treated as leaked: revoke it, blank the old line (`node creatives/tools/env-set.mjs --unset META_MARKETING_TOKEN`) and generate a new one (rotation, below). The harness will ask you to, and it never asks you for the value.

**What you should see:** the check prints four lines plus a write-access note: where it found the token (`.env`), the token holder (the System User's name), the ad account (its name, status and currency; status `1` means active), and `adimages ok, advideos ok`. It never prints the token.

**What the harness checks:** `node creatives/tools/meta-upload.mjs --check`, during `/setup` and at every `/health`; names only.

**Pitfalls:**
- `.env` starts with a dot, so it may be hidden. Windows: in File Explorer, View → Show → Hidden items. macOS: in Finder, press Command + Shift + . (full stop).
- Notepad may save the file as `.env.txt`. In Save as, choose "All files" and keep the name `.env`. In TextEdit, choose Format → Make Plain Text before you save.
- "Generate new token" is greyed out, or the app is missing from its list: the app is not in Business Settings → Accounts → Apps (click 6), or the System User does not have the app (click 8).
- `ads_management` is not in the list of permissions: the Marketing API product is missing from the app (click 4).
- The check reports code 190: the token is wrong, expired or revoked; rotate it (revoke first, then generate; see Rotation below). Code 200: the System User is missing the ad account or a permission; fix click 8, then revoke and generate again (but code 200 with "API access blocked", even on the most basic call, is a blocked developer account: see "If you get stuck"). Code 10 on the lead-form or lead commands: the Page is not among the System User's assets (click 8). The harness reports these codes and never retries blindly.
- The check says `META_AD_ACCOUNT_ID` is not set: fill in that line (click 11).
- If Meta insists on a business verification or an app review before it lets you generate the token, write down its exact message and tell the Operator. Meanwhile the harness can still read and build; only the direct uploads wait.
- **Rotation** (every few months, when someone with access leaves, and at once after any leak): on the System User, Revoke tokens (choose the app) → Generate new token with the same choices → Copy → `node creatives/tools/env-set.mjs --from-clipboard META_MARKETING_TOKEN` (it replaces the old line) → run the check. Revoke first, then generate: Meta's revoke can stop every token the System User holds for that app, including one generated a minute earlier.

**Screenshots:** [screenshot: step 7]

## Step 8. The WhatsApp number (click-to-WhatsApp ads only)

**Where:** the Page's settings on Facebook → Linked accounts → WhatsApp (or Meta Business Suite → Settings → WhatsApp accounts).

**Clicks:**
1. On the business phone, make sure the number runs the **WhatsApp Business** app, not the ordinary WhatsApp app.
2. On Facebook, switch into the Page, open its settings → Linked accounts → WhatsApp → Connect.
3. Type the business number with its country code. Meta sends a code to that WhatsApp; type it and confirm.
4. A second number, for a second funnel: connect another number, and do **not** make it the Page's primary number.
5. Give `/setup` a short label for each number (for example "sales line"). The label goes into `config/accounts.md`; the number itself does not.

**What you should see:** WhatsApp shown as connected in the Page's linked accounts, with the number; in the WhatsApp Business app, the Facebook Page shown as linked.

**What the harness checks:** Meta's server has no read of a Page's WhatsApp numbers and cannot choose an ad set's number. The harness builds click-to-WhatsApp ads PAUSED, sends you Meta's preview images (with the WhatsApp button), and asks you to confirm the number in the ad set in Ads Manager (the conversion location, WhatsApp) before your go.

**Pitfalls:**
- Meta stops with a message like "install WhatsApp Business for this number" when the number runs the ordinary WhatsApp app.
- A second number must not become the Page's primary: ad sets without an explicit choice use the primary number.
- Each ad set picks its number in Ads Manager's editor; the harness cannot set it.
- Someone must answer the chats, and quickly (who answers and how fast is written in `config/operator.md`). The names and phone numbers of the people who write never go into the harness folder.
- A number on the WhatsApp Business Platform (the API, through a provider) connects differently: ask the provider.

**Screenshots:** [screenshot: step 8]

## Step 9. Lead forms (instant-form ads only)

An instant form opens inside Facebook or Instagram when someone taps the ad, with their details filled in from their profile. It needs no website and no pixel.

**Where:** the Lead Ads terms at `https://www.facebook.com/ads/leadgen/tos`; Meta Business Suite (`https://business.facebook.com`) → All tools → Instant forms; and Meta Business Suite → All tools → Leads Center.

**Clicks: the terms (once per Page)**

1. Open the Lead Ads terms page, choose the company's Page, read the terms and accept them. A Page admin must do this.

**Clicks: a form**

2. Meta Business Suite → All tools → Instant forms → Create form.
3. Form type: more volume (quick to send) or higher intent (adds a review step). The first flight plan recommends one per funnel.
4. Questions: only what you will use. Name, email and phone are filled in from the profile; add at most one or two of your own.
5. Privacy policy: the link to the company's own privacy policy page. It is required, and the harness does not write it.
6. Completion screen: what happens next, and a button (to the website, or to call).
7. Any consent checkbox or disclaimer on the form is written by the company or its lawyer, never by the harness.
8. Publish. Copy the form's id from the forms library and give it to the Operator; `/setup` writes it into `config/accounts.md` as `lead_form_ids`. A form id is not a secret.

**Clicks: lead delivery (how leads reach whoever answers them; choose at least one)**

9. **Leads Center** (Meta Business Suite → All tools → Leads Center): every lead, with a status and notes. This is the default.
10. **Email notifications:** in Meta Business Suite's notification settings, turn on new-lead emails for the person who answers leads.
11. **CSV download:** from the forms library or Leads Center, regularly. Meta keeps leads available for download only for a limited time (90 days when this guide was written).
12. **A CRM** (the software where the company keeps its customer contacts): Leads Center lists the CRMs Meta connects to directly; others connect through an integration service.
13. **Leads Center access for whoever answers leads.** If that person is not an admin of the Page, give them access to its leads (today: Business Settings → Integrations → Leads access → the Page → assign the person, and the CRM if you use one). The outcome: they open Leads Center and see this Page's leads. Their name goes under replies in `config/operator.md`, and `/setup` writes the delivery you chose into `config/accounts.md` as `lead_delivery`.
14. **Lead webhook (advanced, optional; only with a product team).** It sends each lead to the company's own system the moment it arrives, and it needs a developer: a developer app with the Webhooks product, a `leadgen` subscription to the company's address, a Page token, and every running form registered. `config/product-team.md` says whether the company has a product team; `config/accounts.md` records the address as `lead_webhook_url`, which otherwise reads "none: leads are read in Leads Center".

**What you should see:** the form in the forms library, active, and its preview opening; the person who answers leads able to open Leads Center; after the first real lead, the lead there (and the email, if you turned it on).

**What the harness checks:** the Page read (`ads_get_ad_account_pages`) shows whether the Lead Ads terms are accepted. Meta's server has no lead-form tool, so the harness works with the form ids and the lead delivery you give it, builds instant-form ads PAUSED, and reports lead counts from the account's results. It never reads or stores the leads themselves: no names, emails or phone numbers ever go into the harness folder.

**Pitfalls:**
- A published form cannot be edited. Duplicate it, change the copy, publish, and give the Operator the new id.
- Meta refuses a "Contact us" button on instant-form ads; the harness uses one Meta accepts (for example Learn more, Sign up, Get quote, Apply now, Subscribe or Download).
- Leads that nobody opens go cold within hours. Turn on the email notifications, or check Leads Center every working day.
- Marketing emails, text messages or WhatsApp messages to leads may need their prior consent where the law requires it. That is a question for the company's lawyer, not for the harness.

**Screenshots:** [screenshot: step 9]

## Step 10. Domain verification (recommended for ads that link to your website)

**Where:** Business Settings → Brand safety (on some screens "Brand safety and suitability") → Domains (`https://business.facebook.com/settings/owned-domains`).

**Clicks:**
1. Domains → Add → type the domain (for example `example.com`, without `https://` and without `www`).
2. Choose one way to prove that the domain is yours:
   - **DNS TXT record:** a line of text Meta gives you, added where the domain's DNS is managed (the registrar or the hosting company). The most reliable way.
   - **Meta-tag:** a line added to the head of the homepage, by whoever runs the website.
   - **HTML file:** a small file Meta gives you, uploaded to the website's top folder.
3. When the change is made: Verify.

**What you should see:** the domain listed, with the status verified.

**What the harness checks:** nothing in Meta: there is no read for it. When it shows verified, mark the checklist row done (or tell the Operator, who updates `checklist.md` for you; the harness only adds a dated note). The `signals-audit` skill asks about it before the first ad that links to the website.

**Pitfalls:**
- A DNS change can take from a few minutes to 72 hours to be seen. Press Verify again later; do not add a second record.
- Verify the main domain (`example.com`), not a subdomain such as `www`.
- Why it matters: it proves that the website is the company's, lets the company control how its links look in ads, and some settings for website events need it.

**Screenshots:** [screenshot: step 10]

## Step 11. Instagram (optional)

**Where:** the Page's settings on Facebook → Linked accounts → Instagram; Business Settings → Accounts → Instagram accounts.

**Clicks:**
1. In the Instagram app, make the account a professional account (business or creator) if it is not one already.
2. On Facebook, switch into the Page → its settings → Linked accounts → Instagram → Connect → log in to Instagram → allow.
3. Business Settings → Accounts → Instagram accounts: the account is listed. Connect the ad account to it, so ads can run under the Instagram name.

**What you should see:** Instagram listed in the Page's linked accounts and in Business Settings, with the ad account connected.

**What the harness checks:** `ads_get_ig_accounts` lists the account; `/setup` writes its id into `config/accounts.md` as `instagram_account_id`. "Not linked for ads" is a valid answer.

**Pitfalls:**
- Without a linked account, ads can still appear on Instagram, shown with the Page's name and picture.
- A personal Instagram account must be switched to a professional account first.

**Screenshots:** [screenshot: step 11]

## If you get stuck

- Write down the step number, what you clicked and Meta's exact message. Copy the text, or take a screenshot that shows **no token, no password and no customer data**. Give it to the Operator, or type it into the Claude Code chat: the harness can read Meta's own help articles and adjust the click list.
- If a label in this guide is not on your screen, look for the outcome the step names; Meta moves things.
- **"API access blocked" on every call.** The upload or Graph check fails with HTTP 400, code 200 and "API access blocked", even on the most basic call (who am I). This is not a missing permission: Meta has blocked the developer account of the app's admin, and `https://developers.facebook.com` shows "Account confirmation needed". Clear that account confirmation (next entry); do not generate a new token. Once it clears, the existing token works again within minutes: run the check once more.
- **Confirm Account shows "Sorry, something went wrong".** Meta's checkpoint ("Confirm your identity", with a code sent to the admin's email) opens only while facebook.com is signed in as the admin's **personal profile**; while the browser is "switched into" the Page, it fails with that message. Switch back to your own profile (profile menu → your name), open the checkpoint again and type the code. A developer app marked "Unpublished" (Development mode) is normal and not the cause: System User tokens work in Development mode.
- If Meta has disabled or restricted something, Account Quality (`https://www.facebook.com/accountquality`) shows the reason and the review option. Requesting a review is the Owner's.
- Never share a password, and never paste a token into the chat.

## Checklist rows the wizard writes

`/setup` records the status of every step in the Console steps table of `config/accounts.md` (done, open, n/a or unknown) and writes one row per step into `checklist.md` (status open, done or n/a) (columns id, item, owner, status, note, updated) with the Owner as their owner, under the same names. From then on the status of those rows is the Owner's to change; the harness adds notes, for example when a live read shows the outcome.

| Step | Console step (the row name in `config/accounts.md` and `checklist.md`) | Owner | Done when | n/a when |
|---|---|---|---|---|
| 1 | Business portfolio | Owner | the account read shows the portfolio that owns the ad account | |
| 2 | Page | Owner | the Page read lists the Page in `config/accounts.md` | |
| 3 | Ad account owned by the portfolio | Owner | the account read shows it active, in the currency you chose | |
| 3 | Payment method on the ad account | Owner | the account read shows one, or you confirm it | |
| 3 | Phone number verified on the ad account | Owner | you confirm it (there is no live read) | |
| 4 | People and roles (a `checklist.md` row only; who holds which login goes into `config/accounts.md` and `config/operator.md`) | Owner | the invitation of the Operator is accepted and the ad account assigned with Manage campaigns | the Owner operates alone |
| 5 | MCP login (`meta-ads`) | Owner | the Meta tools load and the account is visible | |
| 6 | Pixel / dataset created and installed (or "no website") | Owner | the dataset read lists it and a test event arrived | no ad sends people to a website ("no website") |
| 7 | Developer app (Business type) + System User token in `.env` | Owner | `meta-upload.mjs --check` passes | |
| 8 | WhatsApp Business number linked to the Page | Owner | you confirm it; the first click-to-WhatsApp ad set shows it | no click-to-WhatsApp ads |
| 9 | Lead Ads terms accepted on the Page | Owner | the Page read shows them accepted | no instant-form ads |
| 9 | Leads Center access for whoever answers leads | Owner | that person opens Leads Center, and the notifications are confirmed before the first lead ad runs | no instant-form ads |
| 9 | Lead webhook subscription (advanced, only with a product team) | Product team | the product team confirms that every running form reaches its endpoint | `lead_webhook_url` is none (the default) |
| 10 | Domain verified | Owner | you confirm it (there is no live read) | no website |
| 11 | Instagram linked for ads (optional) | Owner | the Instagram read lists it | you skip it |
