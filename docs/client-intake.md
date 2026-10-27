# Client intake pack

**Who this is for:** a company that is about to have its Meta ads (Facebook, Instagram, WhatsApp, Messenger) run with this harness. Send it before the first setup session. Fill in what you know, leave the rest blank: the setup session asks about every blank, so nothing here is a test.

**How to fill it:** write under each question, or in the table cells. Plain words are fine. Copy the file back as `config/intake.md` in the harness folder (or send it to the person who runs the harness, who puts it there). The setup wizard (`/setup`) reads it first and only asks what it leaves open.

**Never write in this form:** a password, a token or API key, a card or bank number, a phone number, or the name, email or phone of any customer or lead. Ids of Meta assets (an ad account number, a Page id) are fine: they are not secrets.

**Who is who in the harness:**
- **the Owner** is the one person who gives the go on money. Nothing is turned on, and no budget goes up, without the Owner's go, in writing, with the daily amount and the cap stated first.
- **the Operator** is the person who runs the harness day to day (it may be someone outside your company).

---

## 1. Access: how you give us access (and keep ownership)

You keep ownership of everything: your Business portfolio, your Page, your ad account, your pixel and your WhatsApp number stay yours, billed to your payment method. You lend access to named assets and can take it back at any time from the same screens.

**0. Installer-led setup** (when someone installs the harness for you and sets up your Meta consoles with you): add the installer's Facebook profile as Admin of your Business portfolio for the setup day (Users → People → Add → Admin access); remove or downgrade it afterwards. *You keep:* the portfolio and every asset, the payment method, every password and code (the installer's harness never types one), and the System User, its token and the developer app, which belong to your portfolio and keep working after the installer's access is gone.

**Partner access, in one line:** your Business portfolio shares chosen assets with the Operator's Business portfolio, with the permissions you pick; nobody gets your login, and you can remove the partner at any time.

**The click list** (Meta renames buttons now and then; the outcome is what matters):

1. Open `https://business.facebook.com/settings` and pick your company's Business portfolio. *You should see* your company's name at the top left. No portfolio yet? Create one there (company name, your name, a work email); it is free.
2. **Users → Partners → Add → "Give a partner access to your assets"**, then type the Operator's Business portfolio id: `<filled in by the Operator before sending>`.
3. Pick the assets and the permissions below. Give only what is listed; more is never needed.

| Asset | Permission to give (Meta's words may differ slightly) | Why | You keep |
|---|---|---|---|
| Ad account | **Manage campaigns** (create and edit ads) and **View performance**; not full control | To build ads PAUSED and read results | Billing, the payment method, the ad account's time zone and currency, the right to remove us |
| Facebook Page | **Partial access**: create ads, view insights (not content posting, not messages) | Ads run in the Page's name | Everything posted on the Page, the inbox |
| Instagram account (if ads should run there too) | Partial access: ads | Ads run in its name | The account |
| Pixel / dataset (if your website has one) | **Use** (to optimise ads and read events); "manage" only if we are asked to set events up | To count what visitors do after the click | The pixel and its data |
| WhatsApp number (for click-to-WhatsApp ads) | **No partner access needed.** You link the number to your Page yourself: Page settings → Linked accounts → WhatsApp (your phone receives a code) | Ads open a chat with your number | The number, every chat, every customer |
| Lead forms and leads (instant forms) | **None for us.** Leads stay in your Leads Center; give access only to the person who answers leads (section 8) | The harness never reads a lead | All lead data |

4. Also yours, not ours: the **payment method** on the ad account, the **phone verification** of the ad account (Meta sends you a code), accepting the **Lead Ads terms** on your Page if forms are used, and **domain verification** of your website.
5. No partner portfolio? The other way: Users → People → invite the Operator's work email as an employee and assign the ad account with **Manage campaigns** and the Page with partial access.

| Question | Answer |
|---|---|
| Your Business portfolio name (and id, if you have it) | |
| Your ad account name and id (digits only) | |
| Your Page name (and any duplicate Page with your name that must never be used) | |
| Instagram account for ads (name, or "none") | |
| Pixel / dataset name, or "no pixel" or "no website" | |
| WhatsApp number for ads: a name for it only (e.g. "sales line"), never the number | |
| Installer-led setup day: installer added as Admin? (yes, on date / not yet / not used) | |
| Partner access given? (yes, on date / not yet) | |
| Who in your company can click in these Meta screens (a role or first name) | |

## 2. Brand kit

| Item | Where it is / your answer |
|---|---|
| Logo files (vector or large PNG; light and dark versions) | |
| Brand colours (hex codes, and which is the main one) | |
| Fonts (names; where the files are, if they are licensed to you) | |
| Tone of voice in three words (and how you address customers: formal or informal) | |
| Languages you advertise in, and whether any is right-to-left | |
| Past ads that worked, and ones that did not (links or files) | |
| Photos and videos your company **owns and may use in ads** (real people only with their signed permission) | |
| Images or styles you never want to see | |
| May we use AI-generated images? (yes, with a visible label / only for backgrounds / no) | |

## 3. Claims sheet

What an ad may say, and what it must never say. Every number in an ad needs a source and a date.

**Things we may say, each with its proof** (a page on your site, a document, a dated figure):

| Claim, in your words | Proof (link, document, date) |
|---|---|
| | |
| | |
| | |

**Things we must never say** (words, promises, comparisons, prices, guarantees):

-
-

**Regulated topics in your market** (for example health or medical results, financial returns, credit, housing, employment, licensed professions, alcohol, children). Name them, and say whether a licence or a lawyer's approval exists:

-

**Lines that need a lawyer or your approval before any ad uses them:**

-

**Special ad categories:** does any ad offer housing, credit, employment, or touch on politics or social issues? (yes: which / no / not sure)

## 4. Audiences

| Question | Answer |
|---|---|
| Who buys from you (describe them: age range, place, language, what they want) | |
| Where (countries, regions or cities) | |
| What problem do they come to you with (in their words, if you have them) | |
| Who must never be targeted or excluded from your ads | |
| How customers must never be addressed (never by religion, origin, ethnicity, health, family status, sexual orientation, money troubles or any similar personal attribute; add anything specific to you) | |
| Any second audience (e.g. businesses rather than people) | |

## 5. Competitors

Five names, and where you see them advertise (Facebook, Instagram, Google, TV, outdoor, marketplaces).

| Competitor | Website | Where they advertise | What they do well (one line) |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

## 6. Consent and notices

The harness **never writes consent or privacy wording**: it only points to yours. Tell us what exists.

| Notice | Where it is (page or form) | Its id or name, or its first few words | Who wrote or approved it (role) | Date |
|---|---|---|---|---|
| Privacy policy | | | | |
| Cookie banner (does it ask before tracking?) | | | | |
| Sign-up or contact form notice | | | | |
| Marketing email / SMS consent (if any) | | | | |
| Instant-form privacy link (if lead forms are used) | | | | |

Do your customers agree, somewhere, to be contacted for marketing? (yes: where / no / not sure). May any customer or sign-up list be uploaded to Meta to find similar people? (This is a legal question for you, not for us: "not decided" is a fine answer.)

## 7. The money

| Question | Answer |
|---|---|
| Monthly ad budget band (from–to, in your currency) | |
| What a good result costs at most (per sign-up, lead, booked call or sale) and how you know | |
| Hard caps nobody may cross: per day, per week, per month, per campaign | |
| Who gives the go (one person: this is the Owner) | |
| How a go must be worded (suggested: "turn on <campaign>, <amount>/day, cap <amount>") | |
| Through which channel a go reaches the Operator (the harness chat, WhatsApp, email) and whether a go passed on by someone else counts | |
| Who may ask for a pause (pausing never costs money) | |

## 8. The lead path

What happens after someone clicks: the part that decides whether ads pay.

| Question | Answer |
|---|---|
| Where leads arrive: WhatsApp chats, Messenger, instant forms (Leads Center), your website form, a CRM (its name) | |
| Who answers them (a role or first name; never a phone number) | |
| Working hours and days for answers | |
| The promise: first reply within how many hours | |
| What an off-hours message should say (or "none yet") | |
| What makes a lead **qualified** for you (budget, place, timing, need, size) | |
| What counts as **booked** (a call, a visit, a trial) and as **closed** (a sale, a signed contract) | |
| Who can send a weekly count of leads, qualified, booked and closed per campaign (counts only, never names) | |
| Questions or requests that must go straight to a manager (complaints, legal or medical questions, data deletion) | |

## 9. Reporting

| Question | Answer |
|---|---|
| Language of the report | |
| How often (weekly recommended) and which day | |
| Who reads it (a role or first name) | |
| Channel (WhatsApp text, email with a PDF, a shared folder) | |
| Anything you never want in a report | |

---

**What happens next:** the Operator runs `/setup` with this file in `config/intake.md`. The wizard confirms each answer with you, asks what is blank, reads your Meta account and pages, and writes the harness's files. Nothing is built, turned on or paid for during setup.
