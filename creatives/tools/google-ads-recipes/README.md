# Google Ads recipes

Ready-made specs for `creatives/tools/google-ads.mjs recipe run <name>`. Each file is plain JSON, with no code:

| Field | What it holds |
|---|---|
| `kind` | `"mutate"` (googleAds:mutate operations) or `"service"` (any other API method) |
| `description` | One line for `recipe list` |
| `notes` | Optional. What to know before running it |
| `vars` | Each `${NAME}` the recipe uses, with a word on what it is |
| `defaults` | Optional. Values used when `--set` does not give one |
| `operations` | For `mutate`: the googleAds:mutate operations |
| `path`, `method`, `body` | For `service`: the API call |

Every recipe runs through the same guards as `mutate` and `service`:
- the .env account only;
- campaigns are created PAUSED;
- Google's `validateOnly` runs first;
- the go rule for anything that turns something on, removes something, raises a budget or writes through a service.

**To add a function, copy the closest recipe and change its operations.** The field names are the camelCase JSON of Google's API reference (developers.google.com/google-ads/api/reference/rpc, the resource's page). Temporary resource names take negative ids (`customers/${CUSTOMER}/assets/-1`) to link the operations of one batch.

Run `recipe show <name>`, then `recipe run <name> --set NAME=value … --validate`, then the same without `--validate`. `--set NAME=@path` reads a file as base64, for images.

Recipes taken from the API reference are marked in their notes until they have run on a live account.
