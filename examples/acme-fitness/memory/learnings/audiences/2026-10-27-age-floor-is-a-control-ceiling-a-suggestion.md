---
type: learning
created: 2026-10-27
updated: 2026-10-27
status: confirmed
maintained_by: harness
categories: [learnings, audiences]
summary: "FICTIONAL EXAMPLE. The members ad set reads Advantage+ audience with age 25-45: the floor of 25 holds as a control, the ceiling of 45 is only a suggestion; quote sizes from the audience panel."
applies_to: [meta, targeting]
evidence: "the audience panel of ad set Members-GM-25-45 in Ads Manager, read on the build, 2026-10-27"
supersedes: ""
superseded_by: ""
---

# The age floor is a control, the ceiling only a suggestion (members ad set)

> FICTIONAL EXAMPLE.

**The fact.** On ad set Members-GM-25-45 the audience panel reads "Advantage+ audience" with age 25–45; Meta holds the minimum age as a control but may deliver above 45 ([[2026-10-25-advantage-plus-languages-are-a-control]]).

**Evidence.** The ad set's audience panel in Ads Manager, read on 2026-10-27 during the build ([[2026-10-27]]).

**How to apply.** Hold the members audience with location, minimum age and the `MemberLogin` exclusion; report deliveries above 45 as expected, not as a breakage; quote audience sizes only from the panel, with `as_of`.
