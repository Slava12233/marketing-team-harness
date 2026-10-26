<!-- Written by /setup on {{DATE}}. Edit by hand or re-run /setup. -->

# Goals and money

The money limits the harness works within. Amounts are in the account currency (`currency` in `config/accounts.md`). `/morning` and `/sync` copy the caps below into `dashboard/state.json` (`money.caps`) and flag spend above 80 % of a cap; the first flight plan proposes budgets inside the band and below the caps, each labelled "Needs the Owner's go".

**Monthly budget band:** {{MONTHLY_BUDGET_BAND}}
<!-- setup: a from–to band per calendar month in the account currency, e.g. "600–1,500 a month"; the wizard offers three bands built from Meta's minimum daily budget (300–600, 600–1,500 and 1,500–3,000 times it) and recommends the middle one -->

## Target cost per result

| Funnel | Result | Target cost | Source of the target |
|---|---|---|---|
| {{TARGET_FUNNEL}} | {{TARGET_RESULT}} | {{TARGET_COST}} | {{TARGET_SOURCE}} |
<!-- setup: one row per funnel; funnel names and results as in the funnels table of config/product.md; target cost in the account currency, or "not stated yet: set after the first week of data" (recommended until a flight has run); source = margin per customer, a past campaign or the Owner's estimate, dated -->

**First funnel to launch:** {{FIRST_FUNNEL}}
<!-- setup: the funnel name as in config/product.md, then the reason in one sentence; recommended: the funnel with the simplest conversion (a click-to-WhatsApp conversation, or a page sign-up the pixel already records) -->

## Hard caps

| Cap | Amount | Set by |
|---|---|---|
| Daily (all campaigns together) | {{DAILY_CAP}} | {{CAP_SET_BY}} |
| Weekly (all campaigns together) | {{WEEKLY_CAP}} | {{CAP_SET_BY}} |
| Monthly (all campaigns together, calendar month) | {{MONTHLY_CAP}} | {{CAP_SET_BY}} |
| Per campaign (its lifetime spending limit) | {{CAMPAIGN_CAP}} | {{CAP_SET_BY}} |
<!-- setup: amounts in the account currency; recommended monthly = the top of the band, daily = 1/25 of it, weekly = 7× daily, per campaign = the monthly cap divided by the number of funnels, rounded down; Set by = the Owner's name and the date, or "proposed by <Operator>; Owner to confirm"; Meta may spend more than a daily budget on one day while keeping the week within 7× it, so the weekly cap is the firm one -->

**Budget week:** {{BUDGET_WEEK}}
<!-- setup: optional; /setup writes "Sunday–Saturday (Meta's budget week)" without asking; the weekly cap and the /health spend check use this week -->

The harness never proposes a budget above a cap; a cap change is the Owner's, in writing.

## Success, tests and review

**Success in 30 days:** {{SUCCESS_IN_30_DAYS}}
<!-- setup: what the Owner will call a success 30 days after the first activation, as one measurable sentence, e.g. "at least 40 sign-ups on the first funnel at or under the target cost, inside the caps"; recommended when no target is set: "the first funnel runs 30 days inside the caps and we know its real cost per result" -->

**Risk appetite for tests:** {{RISK_APPETITE}}
<!-- setup: how much of the monthly band may go to experiments and new creatives, e.g. "up to 20 %" (recommended), "up to 10 %", or "none until the first flight has a week of data" -->

**Review cadence:** {{REVIEW_CADENCE}}
<!-- setup: when the Owner reviews spend against the caps and cost per result against the targets; recommended "weekly, in /next-round", at the time set in config/operator.md -->
