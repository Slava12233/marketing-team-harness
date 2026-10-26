# Example configuration: Acme Fitness

**Everything in this folder is fictional.** Acme Fitness Ltd, its three Manchester gyms, its app, its website `acmefitness.example`, Jordan Lee and Sam Park do not exist. **Every id is fake** (`100000000000001`, `200000000000001`, `300000000000001`, `400000000000001`, `500000000000001`, `600000000000001`, `600000000000002`, `G-EXAMPLE001`) and will not resolve in Meta or Google. The legal notes are illustrative, not advice.

It shows what a harness looks like after `/setup` (2026-10-26, nothing built), one build session (2026-10-27) and the next morning (2026-10-28):

| Path | What it shows |
|---|---|
| `config/company.md`, `product.md`, `audiences.md`, `brand.md`, `claims.md`, `accounts.md`, `operator.md`, `product-team.md` | Every `config/` template filled: same bold field labels, headings, table headers and order as `config/*.md`, hints removed |
| `memory.md` | The memory after the build session, in the template's fixed sections: two paused campaigns, one learning, the decision rules, two session-log entries (`/setup`, then the build), "Next session should" |
- `checklist.md`: the go checklist with the fictional console steps by owner and two sync-log lines.
| `plans/2026-10-26-first-flight-plan.md` | The first flight plan the `/setup` wizard drafts, updated with the ids after the build, budgets left as "Needs the Owner's go" |
| `reports/2026-10-28-morning.md` | A `/morning` report the day after the build, in the fixed shape of the `morning` skill: both campaigns paused, no spend, no data, open gates by owner |

## Loading it for a dry run

1. Make a **scratch copy** of the whole repository (a separate folder or a throwaway branch). Never do this in the copy that holds a real company's config.
2. In the scratch copy, copy `examples/acme-fitness/config/*` into `config/` and `examples/acme-fitness/memory.md` over `memory.md`.
3. Open Claude Code in the scratch copy and try `/health`, `/morning` or "show me the first flight plan". Account reads will fail or return nothing, because the ids are fake; that is expected.
4. Delete the scratch copy when you are done.

**Never copy any of these files over a real config, and the Acme name must never appear in a real company's files.** If it does, remove it before the next session.
