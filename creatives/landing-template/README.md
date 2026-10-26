# Landing template: a one-page site for paid traffic

A static one-page site (no build step, no framework, no dependencies) for a company that has no page able to take a Meta pixel, or no page whose call to action matches the ad. It gives the ad a destination that repeats the ad's promise, carries one call to action, passes the ad's `ref` and `utm_*` on, and fires the Meta pixel only after the visitor accepts it.

The `landing-page-build` skill drives the whole procedure (what to read, what to fill, the checks, the plan file, the Owner's go). This README is the mechanics.

## Files

| File | What it is |
|---|---|
| `index.html` | The page: header, hero (H1, sub, one CTA), three benefit cards, three steps, four FAQs, a closing CTA (or the form), the footer with the company's legal lines and the legal links, and the consent bar. Semantic, mobile-first; `lang` and `dir` come from the config, so right-to-left languages work. |
| `page.config.js` | **The only file you edit.** Every string as a double-brace placeholder with a comment saying where its value comes from; the CTA type and its link; the pixel id and the conversion event; the consent mode and the bar's wording. |
| `page.js` | Fills the page from the config (as plain text, never HTML), builds the CTA link, appends the ad's `ref` and `utm_*`, builds the form when the CTA is a form, fires the conversion event on the CTA, starts the consent bar. |
| `pixel.js` | The Meta pixel loader: nothing loads until `consent.js` says so; then `fbq('init', <pixel id>)`, `PageView`, and the configured conversion event once per page view on the CTA. |
| `consent.js` | The consent bar: Accept / Decline as two equal buttons, the choice remembered in `localStorage`, Decline loads nothing, "Cookie settings" in the footer reopens it (declining after accepting expires the pixel cookies and reloads). |
| `styles.css` | Clean, high-contrast styles; the brand colours and font arrive as CSS variables from the config. |
| `legal/privacy.html`, `legal/cookies.html` | **Templates, not legal advice.** Every block wears the banner "DRAFT: your lawyer must review and replace this text before the page goes live" and holds only bracketed instructions for the lawyer. The harness never writes their text. |
| `vercel.json` | Clean URLs (`/legal/privacy`), `Cache-Control: max-age=0, must-revalidate` (a redeploy shows at once; files under `assets/` cache for a week, so rename an asset when it changes), `noindex` (a paid-traffic page; remove that header only if the Owner wants the page in search), and a Content-Security-Policy that allows scripts from this folder and Meta's pixel host only. |
| `.vercelignore` | Keeps `.env*` files, this README and `check.mjs` out of the upload. Never remove the `.env*` line. |
| `check.mjs` | Validates the config before a deploy (below). |

## The CTA types (`cta.type`)

| Type | The link | Attribution |
|---|---|---|
| `whatsapp` | `https://wa.me/<number>?text=<prefilled message>` | WhatsApp drops URL parameters, so the ad's `ref` is appended to the message as `(ref: …)` (`refInText`) |
| `phone` | `tel:<number>` | none: a call carries no parameter; count the CTA event |
| `instant-form` | the Meta instant-form link | `ref` and `utm_*` appended to the link |
| `booking` | the company's booking page | `ref` and `utm_*` appended to the link |
| `form-post` | a form on the page that POSTs to an endpoint the company owns | `ref` and `utm_*` as hidden fields |

**A static site cannot store a form.** With `form-post`, the data goes straight to the company's own endpoint (its CRM or server), which stores it and answers with its own thank-you page. No third-party form service the company has not chosen, no field the follow-up does not need, and the notice under the form is the company's shipped notice quoted verbatim (its id in `config/claims.md`); without one, pick another CTA type.

## Make a flight's landing page

1. Copy the folder (the dotfiles come with it): `cp -r creatives/landing-template creatives/<flight>/landing`
2. Fill `creatives/<flight>/landing/page.config.js` per the `landing-page-build` skill. Optional files (a logo, images) go into `assets/` inside that folder.
3. Check it: `node creatives/<flight>/landing/check.mjs`
   - exit 2: a hard error (a placeholder left, a pixel id that is not numeric or `none`, a link that is not absolute `https://`, an unknown CTA type or consent mode, a third-party script). Fix and run again.
   - exit 0 with the yellow line **"legal drafts not yet replaced"**: the legal pages still carry the DRAFT banner. It never blocks; the Owner decides, and the page does not receive ads until the Owner has acknowledged it in writing.
4. Open `index.html` locally (double-click) and read every line; add `?ref=test&utm_source=test` to the address and hover the CTA to see the parameters on the link.

## Deploy (on the Owner's go, on the company's Vercel login)

Deploying publishes a public page, so it runs only on the Owner's explicit go. The Vercel CLI uses the company's own Vercel login on this machine.

```bash
cd creatives/<flight>/landing
rm -f .env.local                      # `vercel link` writes a token file here; it must never be uploaded
timeout 540 npx vercel@latest deploy --prod --yes
```

- The first run asks to link a project; name it (for example `<company>-landing-<flight>`). `vercel link` writes `.vercel/project.json` (kept out of git) and may write `.env.local`: **delete `.env.local` before every deploy** and keep the `.env*` line in `.vercelignore` (the same rule as the preview template).
- After the deploy: `<url>` answers 200, `<url>/legal/privacy` answers 200, `<url>/.env.local` and `<url>/check.mjs` answer 404.
- Write the URL into `site.url` in `page.config.js`, into the plan file, and redeploy once so the canonical link is right.

## A custom domain (optional, the Owner's DNS)

1. In Vercel: the project → Settings → Domains → add the domain (a subdomain such as `go.example.com` is the easy case), or `npx vercel@latest domains add go.example.com <project>` from the folder.
2. Add the DNS record Vercel shows at the company's DNS provider (for a subdomain usually a CNAME to the target Vercel names; for a bare domain an A record). Vercel issues the HTTPS certificate once the record resolves.
3. Update `site.url` and the plan file, redeploy, and use the custom domain in the ads.

## Verify the domain in Meta (the Owner's console step "Domain verified")

Meta Business Settings → Brand safety and suitability → Domains → Add → the domain the ads will use (the custom domain; a shared host such as `*.vercel.app` cannot be verified by the company). Meta offers three methods:
- **DNS TXT record** (preferred): add the TXT record Meta shows at the DNS provider, then Verify.
- **Meta tag**: uncomment the `facebook-domain-verification` line in `index.html`'s `<head>`, paste the code Meta shows, redeploy, then Verify.
- **HTML file**: put the file Meta offers in this folder, redeploy, then Verify.
Record the status in the console-steps table of `config/accounts.md` and in `checklist.md`.

## The pixel must be seen before an ad runs

Before any ad points at the page: Meta Events Manager → the pixel (dataset) from `config/accounts.md` → Test events → open the page's URL from there → click **Accept** in the consent bar → **`PageView` must appear**; then click the CTA → the conversion event must appear once. Then reload in a fresh private window, click **Decline**, and confirm that no request goes to `connect.facebook.net` (the browser's network panel). If nothing arrives after Accept, look in the browser console for a Content-Security-Policy message (Meta sometimes adds a host; add it to `vercel.json` and redeploy). The `signals-audit` skill records this as the evidence; without it the page stays off every ad.

## Rules

- Never deployed with a placeholder left or with the DRAFT legal pages unacknowledged by the Owner.
- The harness never writes consent or legal wording: the legal pages stay DRAFT until the Owner's lawyer replaces them; the bar's sentence and its two buttons are marked "lawyer to confirm" in the plan file.
- No third-party script beyond the Meta pixel (`check.mjs` refuses any other script source; the CSP blocks it in the browser).
- The page never collects data the company cannot store; forms POST only to an endpoint the company owns.
