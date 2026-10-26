---
type: contract
created: 2026-10-26
updated: 2026-10-26
status: active
maintained_by: harness
categories: [bases]
summary: The seven .base dashboards embedded in HOME; their column and view labels are Hebrew and how to change them.
---

# bases/

The seven `.base` files (`campaigns`, `experiments`, `open-items`, `learnings`, `reports`, `decisions`, `sessions`) are the live tables that HOME embeds with `![[name.base]]`; each filters the notes by `type` and skips `memory/templates/`. Their labels (`displayName` and view `name`) ship in Hebrew; for another chat language, `/setup` (or anyone, in a text editor or in Obsidian's base view → Properties) rewrites only those label strings, e.g. `displayName: "סטטוס"` → `displayName: "Status"`, and leaves the filters, properties and order as they are.
