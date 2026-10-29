<!-- Written by /setup on {{DATE}}. Edit by hand or re-run /setup. -->

# Operator and Owner

**Owner:** {{OWNER_NAME}}
<!-- setup: the one person who gives the go on money, holds the Meta logins and clicks in the Meta consoles -->

**Operators:** {{OPERATOR_NAMES}}
<!-- setup: who runs sessions day to day (may be the Owner); say if an Operator is non-technical, so every console step is a click list and every engineer step a copy-paste block -->

**Chat language:** {{CHAT_LANGUAGE}}
<!-- setup: the language every chat answer, widget and summary is written in (and whether it is RTL); files stay English; questions through the question tool are asked in English -->

**Timezone:** {{TIMEZONE}}
<!-- setup: an IANA name, e.g. Europe/Paris; all routine times and schedules use it -->

**Working days:** {{WORKING_DAYS}}
<!-- setup: e.g. Mon–Fri; ad schedules and reply times follow it -->

## Routine times

| Routine | Command | Time |
|---|---|---|
| Morning | `/morning` | {{MORNING_TIME}} |
| Session close | `/sync` | {{SYNC_TIME}} |
| Weekly round | `/next-round` | {{NEXT_ROUND_DAY_TIME}} |
<!-- setup: local times in the timezone above; the control room shows a toast when one is due -->

## Memory routines

| Routine | Task id | Schedule | Prompt |
|---|---|---|---|
| Nightly memory check | {{NIGHTLY_TASK_ID}} | {{NIGHTLY_SCHEDULE}} | `.claude/routines/nightly-memory-check.md` |
| Weekly consolidation review | {{WEEKLY_TASK_ID}} | {{WEEKLY_SCHEDULE}} | `.claude/routines/weekly-consolidate-review.md` |
<!-- setup: step 5.6 registers both as scheduled tasks in the Claude desktop app (recommended: nightly 23:00 on working days; weekly 21:00 the evening before the first working day), read-only, alerting the Owner's phone through Remote Control; "not registered: <reason>" when the Operator declined or the app is not used -->

## The phrasing of a go

{{GO_PHRASING}}
<!-- setup: the exact form a go must take, in the same message as the spend statement, e.g. "turn on <campaign>, <amount>/day, cap <amount>"; anything less is not a go -->

## Who clicks what

| Action | Who |
|---|---|
| Activate, raise a budget, extend a schedule, create an experiment | {{OWNER_NAME}} (go in the same message) |
| Pause | {{PAUSE_WHO}} |
| Discard drafts, delete live objects | {{OWNER_NAME}} |
| Meta console steps (Page, portfolio, Lead Ads terms, app, tokens, domain, phone) | {{OWNER_NAME}} |
| Replies to WhatsApp / Messenger conversations and leads | {{REPLY_WHO}} |
<!-- setup: pause = "the Owner, on a click list" or "the harness, when the Owner asks in chat"; replies = who answers incoming conversations and within how long -->
