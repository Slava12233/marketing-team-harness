# Preview template: the Facebook-frame preview site

A static site (no build step, no dependencies) that shows a flight's planned ads the way a person sees them in the Facebook mobile feed: the Page name, "Sponsored", the primary text (cut with "See more" as Facebook does), the image or video (videos play muted when they scroll into view), the link card with headline, description and button, and the like / comment / share row. A second view shows the 9:16 files as Stories. Light and dark follow the device, with a toggle. It works on a phone and on a desktop.

It is a mock-up for the team and the Owner. Meta's own rendering (`ads_get_ad_preview` → `creatives/tools/ad-shots.sh`) is the final word once an ad exists in the account.

## Files

| File | What it is |
|---|---|
| `index.html` | The feed (and Stories) preview. Reads `ads.js`. Chips filter by ad set; `#<set id>` in the address opens a set directly. |
| `plan.html` | The team presentation of the flight's plan: objective and key facts, the path from the feed to the result, the ad sets with their launch thumbnails, the audience, the ads gallery by role, the timeline, a forecast calculator (the visitor's own assumptions, defaults only from the plan), the rules and who does what. Reads the same `ads.js`, so a copy change shows on both pages. Sections with no data are hidden. |
| `ads.js` | The only data file. Its header documents the schema: `ADS_META` (Page name, avatar, `dir`, language, default button, link caption, chrome labels), `SETS`, `ROLES`, `ADS` (number, id, name, ad set, role, status, ad id, note, primary text, headline, description, CTA, media) and `PLAN`. Ships empty. |
| `vercel.json` | Clean URLs (`/plan`) and an `X-Robots-Tag: noindex, nofollow` header on every file. |
| `.vercelignore` | Keeps `.env*` files and this README out of the upload. Never remove the `.env*` line. |
| `.gitignore` | Keeps `.vercel/` and `.env*` out of the repository. |
| `media/` | Compressed copies of the creatives for the web. Empty in the template. |

The page name and the language direction come from `ads.js` (`ADS_META.pageName`, `ADS_META.dir`), never from the HTML. The chrome labels default to English; set `ADS_META.labels` to show them in the ads' language.

## Make a flight's preview

1. Copy this folder into the flight: `cp -r creatives/preview-template creatives/<flight>/preview` (include the dotfiles).
2. Put **compressed copies** of the creatives in `preview/media/`: JPEG (quality about 80) from the PNG stills, H.264 MP4 without audio (CRF about 27) from the video masters, plus a poster JPEG per video. These are previews; the files that go to Meta stay in `creatives/<flight>/stills/` and `video/` and are never uploaded from here. Keep the folder small (tens of MB at most). Run conversions with a time bound, one at a time.
3. Fill `ads.js` from the flight's plan file: one entry per creative with its fixed number (`n`), the copy exactly as in the plan's copy table, the media paths, the status and, once built, the Meta ad id. Set `ADS_META.pageName` to the Facebook Page name from `config/accounts.md` and `ADS_META.dir` to `rtl` when the ads' language is right-to-left (`config/brand.md`).
4. Open `index.html` and `plan.html` locally (double-click works) and check every card.
5. **Keep `ads.js` in step with the plan's copy table.** The plan is the source of truth: change the plan first, then `ads.js`, then redeploy. A creative that changes keeps its number.

## Deploy (optional, on the company's own Vercel login)

The site can be shared as a link through Vercel. The deploy runs on the company's own Vercel account (the Owner's login on the machine's Vercel CLI), and only when the Owner asks for it.

```bash
cd creatives/<flight>/preview
rm -f .env.local                      # `vercel link` writes a token file here; it must never be uploaded
timeout 540 npx vercel@latest deploy --prod --yes
```

- The first run asks to link a project; accept or name one (for example `<company>-ads-preview-<flight>`). `vercel link` writes `.vercel/project.json` (kept out of git) and may write `.env.local`: **delete `.env.local` before every deploy**, and keep the `.env*` line in `.vercelignore`.
- After the deploy, check that `<url>/.env.local` answers 404 and that `<url>/plan` loads.
- Write the URL into the flight's plan file (and `config/` or `memory.md` if the team uses it daily). The `health` skill reads the preview URL from the plan.
- The URL is public to anyone who has it. The pages carry `noindex` and the header above; password protection is a Vercel project setting and the Owner's click.
- To refresh after a change: re-convert the changed media, edit `ads.js`, deploy again.

Nothing on these pages is live. Every object in the ad account stays PAUSED until the Owner's go.
