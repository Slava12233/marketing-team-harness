---
type: decision
created: 2026-10-29
updated: 2026-10-29
status: active
maintained_by: harness
categories: [decisions]
summary: "Ad account 1010578430110331 is shared with another team; this harness builds and touches only its own campaigns, the other team's objects are read-only."
decided_by: owner
supersedes: ""
superseded_by: ""
---

# Shared ad account: own campaigns only

**Ruling.** This harness keeps ad account `1010578430110331` (owned by portfolio `486542035414450`, shared into the company portfolio `809438743967672`). It creates, edits and pauses only the campaigns it built itself (ids recorded in its own campaign notes). Every other object in the account, including the campaigns and lead forms of the other team (for example lead form `1810959403440498` "2026-11_Developers_HE_HigherIntent_Flight1"), is read-only from here.

**Context.** /onboard 2026-10-29: the Owner chose this account over `1028189403616245` (no portfolio, no payment method). The Owner said the developers form of 2026-10-21 belongs to another harness or team running on the same account.

**What it replaces.** Nothing.

**Applies to.** Every build, pause and edit; `/morning` and `/health` read the whole account but report the other team's objects as "not ours", never as a mismatch; the caps in `config/goals.md` are judged against the whole account's spend and against this harness's own campaigns separately.
