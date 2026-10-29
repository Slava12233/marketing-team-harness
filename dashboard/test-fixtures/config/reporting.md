<!-- Written by /setup on {{DATE}}. Edit by hand or re-run /setup. -->

# Client reporting

How the weekly client report (the `client-report` skill, `reports/YYYY-MM-DD-client-report.md` plus its rendered HTML and, on request, PDF) is written and who reads it. The harness writes and renders the report; it never sends it. The Owner reads it first, then the Operator sends it through the channel below.

**Report language:** {{REPORT_LANGUAGE}}
<!-- setup: the language the client reads the report in (e.g. English, French, Hebrew); it may differ from the chat language in config/operator.md; this is the one report file not written in English when the two differ -->

**Report direction:** {{REPORT_DIRECTION}}
<!-- setup: ltr or rtl, matching the report language (rtl for Hebrew, Arabic, Persian, Urdu); report-render.mjs reads it when --dir is not given -->

**Cadence:** {{CADENCE}}
<!-- setup: when the report is written, e.g. "weekly, Monday morning, covering the previous Monday–Sunday" (recommended: weekly, on the weekday after the review in config/goals.md), or "on demand only"; the period is always a whole number of days ending yesterday -->

**Recipient:** {{RECIPIENT_ROLE}}
<!-- setup: a role or a first name only (e.g. "the founder", "Dana, marketing manager"); never an email address or a phone number in this file -->

**Channel:** {{CHANNEL}}
<!-- setup: how the Operator delivers it: WhatsApp text (the short version), email (the PDF attached), a shared folder (the HTML or PDF), or a printed PDF; the harness never sends anything itself -->

## Sections the client wants

{{INCLUDE}}
<!-- setup: a bullet list, in order; recommended: the three-sentence answer, the results table, what we changed, what we recommend, what we need from you, the short version for WhatsApp; optional: the best ad of the week described in words, money against the caps, a one-line market note -->

## Never include

{{NEVER_INCLUDE}}
<!-- setup: a bullet list; always kept, whatever is written here: ad, ad set, campaign, account, pixel and form ids; agent, skill, tool and model names; internal notes and file paths; secrets; any lead's name, email or phone. Add the client's own exclusions (e.g. "cost per click", "the competitor scan") -->

**Compare to:** {{COMPARE_TO}}
<!-- setup: previous period (the previous period of equal length), plan targets (the target cost per result in config/goals.md), or both (recommended) -->

**Currency format:** {{CURRENCY_FORMAT}}
<!-- setup: how money is written in the report, in the account currency from config/accounts.md: symbol or code, its position, decimals, and the thousands and decimal separators, e.g. "£1,234.50", "1 234,50 €", "₪1,234" -->
