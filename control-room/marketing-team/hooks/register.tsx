// marketing-team: the control room of the marketing harness.
//
// Draws a pane beside the chat, a band above the prompt, a status line, the hint under the prompt and the
// spinner's words. Everything it shows comes from two places in the project the session runs in:
//   dashboard/state.json   written by /morning, /sync and the main session after a state change (never by this mod)
//   .claude/agents/*.md    the agents' front matter (name, model, tools), for the team roster
// plus what the engine knows live: the subagents running now and the skills called this session.
// It reads only; it never writes a file, calls a tool or touches the ad account. In a project without
// dashboard/state.json and .claude/agents it stays silent.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Access, Board, Campaign, Member, Routine, SkillUse, Task } from '../types'

const PANE = 'marketing-team'
const BOARD_PATH = 'dashboard/state.json'
const AGENTS_PATH = '.claude/agents'

const root = atom({ plugin: 'marketing-team', key: 'root' } as const, '')
const active = atom({ plugin: 'marketing-team', key: 'active' } as const, false)
const roster = atom({ plugin: 'marketing-team', key: 'roster' } as const, [])
const skills = atom({ plugin: 'marketing-team', key: 'skills' } as const, [])
const tick = atom({ plugin: 'marketing-team', key: 'tick' } as const, 0)
const board = atom({ plugin: 'marketing-team', key: 'board' } as const, null)
const boardStamp = atom({ plugin: 'marketing-team', key: 'boardStamp' } as const, 0)
const lastToast = atom({ plugin: 'marketing-team', key: 'lastToast' } as const, '')

// The harness's fixed lanes (docs/TEMPLATE-SPEC.md §6). state.json `team` overrides them when it is filled.
const DEFAULT_TEAM: Record<string, string[]> = {
  Measure: ['performance-analyst', 'signals-auditor', 'cro-auditor'],
  Create: ['creative-director', 'copywriter', 'competitor-researcher'],
  Gate: ['compliance-reviewer', 'test-designer'],
  Build: ['media-buyer'],
  Close: ['harness-librarian'],
}
const OTHER = 'Other'
const ACTIVE = new Set(['pending', 'running', 'waiting'])
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const WEEK = 7 * 24 * 60

const join = (base: string, rel: string) => `${base.replace(/[\\/]+$/, '')}/${rel}`

// ---------- normalising state.json (tolerant: the file may be half filled) ----------

const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v))
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

const normalise = (raw: unknown): Board => {
  const b = obj(raw)
  const routinesRaw = Array.isArray(b.routines) ? { items: b.routines } : obj(b.routines)
  const money = obj(b.money)
  const teamRaw = obj(b.team)
  const team: Record<string, string[]> = {}
  for (const [lane, agents] of Object.entries(teamRaw)) team[lane] = arr(agents).map(String)

  return {
    company: str(b.company),
    generatedAt: str(b.generatedAt),
    launch: str(b.launch),
    routines: {
      timezone: str(routinesRaw.timezone),
      items: arr(routinesRaw.items)
        .map(obj)
        .filter(r => str(r.command) !== null && str(r.time) !== null)
        .map(
          (r): Routine => ({
            id: str(r.id) ?? String(r.command),
            label: str(r.label) ?? String(r.command),
            command: String(r.command).replace(/^\//, ''),
            time: String(r.time),
            days: arr(r.days).map(Number).filter(d => d >= 0 && d <= 6),
          }),
        ),
    },
    working: arr(b.working).map(String),
    tasks: arr(b.tasks)
      .map(obj)
      .filter(t => str(t.title) !== null)
      .map((t): Task => ({ title: String(t.title), owner: str(t.owner) ?? 'Unassigned' })),
    money: {
      currency: str(money.currency),
      dailySpend: str(money.dailySpend),
      caps: arr(money.caps).map(c => {
        const o = obj(c)
        return Object.keys(o).length > 0 ? [str(o.name), str(o.amount)].filter(Boolean).join(': ') : String(c)
      }),
      liveToday: str(money.liveToday),
      nextGo: str(money.nextGo),
    },
    campaigns: arr(b.campaigns)
      .map(obj)
      .filter(c => str(c.name) !== null || str(c.id) !== null)
      .map(
        (c): Campaign => ({
          id: str(c.id),
          name: str(c.name) ?? String(c.id),
          label: str(c.label),
          status: str(c.status) ?? 'UNKNOWN',
          spent: str(c.spent),
          result: str(c.result),
        }),
      ),
    team,
    skillsUsed: arr(b.skillsUsed).map(s => {
      const o = obj(s)
      return Object.keys(o).length > 0
        ? { name: String(o.name), count: Number(o.count) || 1 }
        : { name: String(s), count: 1 }
    }),
  }
}

const teamOf = (data: Board | null) => (data !== null && Object.keys(data.team).length > 0 ? data.team : DEFAULT_TEAM)

const laneOf = (name: string, team: Record<string, string[]>) =>
  Object.entries(team).find(([, agents]) => agents.includes(name))?.[0] ?? OTHER

// ---------- the roster from .claude/agents ----------

const field = (front: string, key: string) =>
  front
    .match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1]
    ?.trim()
    .replace(/^"|"$/g, '') ?? ''

const accessOf = (front: string): Access => {
  const denied = field(front, 'disallowedTools')

  if (denied !== '') {
    return denied.includes('ads_update_entity') ? 'Reads Meta' : 'Builds paused'
  }

  return field(front, 'tools').includes('mcp__meta-ads__') ? 'Reads Meta' : 'No account'
}

const ACCESS_COLOR: Record<Access, string> = {
  'Builds paused': 'warning',
  'Reads Meta': 'suggestion',
  'No account': 'subtle',
}

const loadRoster = async ($: EngineInterface, base: string, team: Record<string, string[]>) => {
  const dir = join(base, AGENTS_PATH)
  const members: Member[] = []

  for (const entry of await $.fs.list(dir)) {
    if (entry.kind !== 'file' || !entry.name.endsWith('.md')) continue

    const text: string = await $.fs.read(join(dir, entry.name))
    const front = text.split(/^---\s*$/m)[1] ?? ''
    const name = field(front, 'name') || entry.name.replace(/\.md$/, '')

    members.push({ name, model: field(front, 'model') || 'default', lane: laneOf(name, team), access: accessOf(front) })
  }

  const lanes = [...Object.keys(team), OTHER]

  return members.sort((a, b) => lanes.indexOf(a.lane) - lanes.indexOf(b.lane) || a.name.localeCompare(b.name))
}

// ---------- the board ----------

const exists = async ($: EngineInterface, path: string) => {
  try {
    await $.fs.stat(path)
    return true
  } catch {
    return false
  }
}

const refreshBoard = async ($: EngineInterface) => {
  const base = await read($, root)
  if (base === '') return

  const file = join(base, BOARD_PATH)
  try {
    const { mtimeMs } = await $.fs.stat(file)
    if (mtimeMs === (await read($, boardStamp))) return

    const parsed = normalise(JSON.parse(await $.fs.read(file)))
    await update($, board, () => parsed)
    await update($, boardStamp, () => mtimeMs)
  } catch {
    await update($, board, () => null)
    await update($, boardStamp, () => 0)
  }
}

// ---------- clocks and routines ----------

type Clock = { weekday: number; minutes: number; label: string }

const clockAt = (ms: number, zone: string | null): Clock => {
  let parts: Intl.DateTimeFormatPart[]
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  try {
    parts = new Intl.DateTimeFormat('en-GB', zone === null ? opts : { ...opts, timeZone: zone }).formatToParts(new Date(ms))
  } catch {
    parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(new Date(ms))
  }
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'

  return {
    weekday: WEEKDAY[get('weekday')] ?? 0,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    label: `${get('hour')}:${get('minute')}`,
  }
}

const nextRuns = (data: Board, ms: number) => {
  const now = clockAt(ms, data.routines.timezone)
  const nowOfWeek = now.weekday * 1440 + now.minutes
  const runs = data.routines.items.flatMap(routine => {
    const [hh = 0, mm = 0] = routine.time.split(':').map(Number)

    return routine.days.map(day => ({
      routine,
      day,
      inMinutes: (day * 1440 + hh * 60 + mm - nowOfWeek + WEEK) % WEEK,
    }))
  })

  return runs.sort((a, b) => a.inMinutes - b.inMinutes)
}

const inWords = (minutes: number) => {
  if (minutes === 0) return 'now'
  if (minutes < 60) return `in ${minutes} min`
  if (minutes < 24 * 60) return `in ${Math.floor(minutes / 60)} h ${minutes % 60} min`

  return `in ${Math.floor(minutes / 1440)} days`
}

const daysUntil = (iso: string | null, ms: number) => {
  if (iso === null) return null
  const at = Date.parse(iso)

  return Number.isNaN(at) ? null : Math.ceil((at - ms) / 86400000)
}

const ago = (iso: string | null, ms: number) => {
  if (iso === null) return 'never'
  const minutes = Math.max(0, Math.round((ms - Date.parse(iso)) / 60000))
  if (Number.isNaN(minutes)) return 'at an unknown time'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`

  return `${Math.round(minutes / 1440)} days ago`
}

const launchWords = (days: number | null) => (days === null ? '' : days > 0 ? `launch in ${days} days` : 'launched')

const working = async ($: EngineInterface) => (await $.agent.list()).filter(agent => ACTIVE.has(agent.status))


const titleOf = (data: Board | null) => (data?.company ? `Control room · ${data.company}` : 'Control room')

const refreshStatus = async ($: EngineInterface) => {
  if (!(await read($, active))) return

  const data = await read($, board)
  if (data === null) {
    $.ui.status('Control room: no dashboard/state.json yet (run /morning or /sync)')
    return
  }

  const ms = await $.clock.now()
  const first = nextRuns(data, ms)[0]
  $.ui.status(
    [
      launchWords(daysUntil(data.launch, ms)),
      first === undefined ? '' : `next: ${first.routine.label} at ${first.routine.time} (${inWords(first.inMinutes)})`,
      data.money.liveToday === null ? '' : `running: ${data.money.liveToday}`,
    ]
      .filter(part => part !== '')
      .join(' · ') || 'Control room',
  )
}

// ---------- hooks ----------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const base = await $.session.root()
    await update($, root, () => base)

    const isHarness = (await exists($, join(base, BOARD_PATH))) || (await exists($, join(base, AGENTS_PATH)))
    await update($, active, () => isHarness)
    if (!isHarness) return next(e)

    await $.command.register({
      name: 'team',
      description: 'Opens the control room: who is working, the next task, the routines, money and campaigns, the team',
    })
    await refreshBoard($)
    try {
      const members = await loadRoster($, base, teamOf(await read($, board)))
      await update($, roster, () => members)
    } catch {
      $.ui.toast('marketing-team: could not read .claude/agents')
    }
    await refreshStatus($)

    $.clock.every(60_000, async () => {
      await refreshBoard($)
      await refreshStatus($)
      await update($, tick, n => n + 1)

      const data = await read($, board)
      if (data === null) return

      const now = await $.clock.now()
      const due = nextRuns(data, now)[0]
      if (due === undefined || due.inMinutes !== 0) return

      const key = `${due.routine.id}-${new Date(now).toISOString().slice(0, 10)}`
      if ((await read($, lastToast)) === key) return

      await update($, lastToast, () => key)
      $.ui.toast(`${due.routine.label}: time for /${due.routine.command}`)
    })

    void $.ui.open({ id: PANE, title: titleOf(await read($, board)) })

    return next(e)
  })

  on('command.run', { command: 'team' }, async $ => {
    const base = await read($, root)
    await refreshBoard($)
    const members = await loadRoster($, base, teamOf(await read($, board))).catch(() => [] as Member[])
    await update($, roster, () => members)
    await $.ui.open({ id: PANE, title: titleOf(await read($, board)) })

    return { text: `Control room opened: ${members.length} agents.` }
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    await update($, tick, n => n + 1)

    return started
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (await read($, active)) {
      await refreshBoard($)
      await refreshStatus($)
      await update($, tick, n => n + 1)
    }

    return done
  })

  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    const name = String(e.skill)
    await update($, skills, (list: SkillUse[]) =>
      list.some(one => one.name === name)
        ? list.map(one => (one.name === name ? { ...one, count: one.count + 1 } : one))
        : [...list, { name, count: 1 }],
    )

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    await read($, tick)
    const members = await read($, roster)
    const used = await read($, skills)
    const data = await read($, board)
    const busy = await working($)
    const ms = await $.clock.now()
    const fill = (text: string) => () => $.prompt.fill({ text, mode: 'replace' })
    const title = titleOf(data)

    const label = (text: string) => (
      <Text size="footnote" dimColor>
        {text}
      </Text>
    )

    if (data === null) {
      return (
        <Box flexDirection="column" gap="sm" padding="sm">
          <Text weight="semibold">{title}</Text>
          <Text dimColor>No state file at dashboard/state.json. Run /morning or /sync to write it.</Text>
        </Box>
      )
    }

    const now = clockAt(ms, data.routines.timezone)
    const runs = nextRuns(data, ms)
    const first = runs[0]
    const toLaunch = daysUntil(data.launch, ms)
    const owners = [...new Set(data.tasks.map(task => task.owner))].map(owner => ({
      owner,
      count: data.tasks.filter(task => task.owner === owner).length,
    }))
    const seen = new Set<string>()
    const upcoming = runs.filter(run => !seen.has(run.routine.id) && seen.add(run.routine.id))
    const team = teamOf(data)
    const lanes = [...Object.keys(team), OTHER].filter(lane => members.some(m => m.lane === lane))
    const sessionSkills = used.length > 0 ? used : data.skillsUsed

    return (
      <Box flexDirection="column" alignItems="stretch" gap="md" padding="sm">
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text size="heading" weight="semibold">
            {title}
          </Text>
          <Text size="footnote" dimColor tabular>
            {DAY_NAMES[now.weekday]} · {now.label}
          </Text>
        </Box>

        <Box flexDirection="row" gap="md" borderStyle="round" borderColor="subtle" paddingX="sm" paddingY="xs">
          {toLaunch !== null && (
            <Box key="tile-launch" flexDirection="column">
              {label('Launch')}
              <Text size="title" weight="semibold" tabular>
                {toLaunch > 0 ? `${toLaunch}` : 'Live'}
              </Text>
              <Text size="caption" dimColor>
                {toLaunch > 0 ? `days to ${data.launch?.slice(0, 10)}` : 'launched'}
              </Text>
            </Box>
          )}
          <Box key="tile-campaigns" flexDirection="column">
            {label('Campaigns')}
            <Text size="title" weight="semibold" tabular>
              {data.campaigns.filter(c => c.status === 'ACTIVE').length}
            </Text>
            <Text size="caption" dimColor>
              active of {data.campaigns.length}
            </Text>
          </Box>
          <Box key="tile-working" flexDirection="column">
            {label('Working')}
            <Text size="title" weight="semibold" color={busy.length > 0 ? 'claude' : 'subtle'} tabular>
              {busy.length}
            </Text>
            <Text size="caption" dimColor>
              agents running
            </Text>
          </Box>
        </Box>

        <Box flexDirection="column" gap="xs">
          {label('Working now')}
          {busy.length === 0 && <Text dimColor>No agent is running. The main session holds the account.</Text>}
          {busy.map(agent => (
            <Box flexDirection="row" gap="sm" alignItems="center" key={`a-${agent.id}`}>
              <Text color="claude">●</Text>
              <Text weight="medium" mono>
                {agent.type}
              </Text>
              <Text size="footnote" dimColor wrap="truncate-end">
                {agent.description}
              </Text>
            </Box>
          ))}
        </Box>

        <Box flexDirection="column" gap="xs">
          {label('Next routine')}
          {first === undefined && <Text dimColor>No routines in dashboard/state.json.</Text>}
          {first !== undefined && (
            <Box key="next-routine" flexDirection="row" gap="sm" alignItems="center">
              <Text weight="semibold">{first.routine.label}</Text>
              <Text mono>/{first.routine.command}</Text>
              <Text color="suggestion">{inWords(first.inMinutes)}</Text>
              <Button key="run-next" variant="primary" onPress={fill(`/${first.routine.command}`)}>
                Prepare
              </Button>
            </Box>
          )}
          {upcoming.slice(1).map(run => (
            <Box flexDirection="row" gap="sm" alignItems="center" key={`r-${run.routine.id}`}>
              <Text size="footnote">
                {run.routine.label} · {DAY_NAMES[run.day]} {run.routine.time}
              </Text>
              <Text size="footnote" dimColor>
                {inWords(run.inMinutes)}
              </Text>
              <Button key={`run-${run.routine.id}`} plain onPress={fill(`/${run.routine.command}`)}>
                /{run.routine.command}
              </Button>
            </Box>
          ))}
        </Box>

        <Box flexDirection="column" gap="xs">
          {label('Next task')}
          {data.tasks.length === 0 && <Text dimColor>No open tasks in dashboard/state.json.</Text>}
          {data.tasks.slice(0, 1).map(task => (
            <Box key="t-first" flexDirection="column" borderStyle="round" borderColor="warning" paddingX="sm" paddingY="xs">
              <Text weight="semibold">{task.title}</Text>
              <Text size="caption" color="warning">
                Owner: {task.owner}
              </Text>
            </Box>
          ))}
          {data.tasks.slice(1, 5).map((task, i) => (
            <Box flexDirection="row" gap="sm" alignItems="center" key={`t-${i}`}>
              <Text size="footnote" dimColor>
                {i + 2}.
              </Text>
              <Text size="footnote" wrap="truncate-end">
                {task.title}
              </Text>
              <Text size="caption" dimColor>
                ({task.owner})
              </Text>
            </Box>
          ))}
          <Box key="owners" flexDirection="row" gap="sm" alignItems="center">
            {owners.map(one => (
              <Text key={`o-${one.owner}`} size="caption" dimColor>
                {one.owner}: {one.count}
              </Text>
            ))}
          </Box>
        </Box>

        <Box flexDirection="column" gap="xs">
          {label('Money and campaigns')}
          <Text size="footnote">
            Running now: {data.money.liveToday ?? 'no live read yet'}
            {data.money.dailySpend === null ? '' : ` · today ${data.money.dailySpend}${data.money.currency ? ` ${data.money.currency}` : ''}`}
          </Text>
          {data.money.caps.length > 0 && (
            <Text size="caption" dimColor>
              Caps: {data.money.caps.join(' · ')}
            </Text>
          )}
          {data.campaigns.map(campaign => (
            <Box flexDirection="row" gap="sm" alignItems="center" key={`c-${campaign.id ?? campaign.name}`}>
              <Text color={campaign.status === 'ACTIVE' ? 'success' : 'subtle'}>●</Text>
              <Text size="footnote" weight="medium">
                {campaign.label ?? campaign.name}
              </Text>
              <Text size="caption" dimColor>
                {[campaign.status, campaign.spent, campaign.result].filter(Boolean).join(' · ')}
              </Text>
            </Box>
          ))}
          {data.money.nextGo !== null && (
            <Text size="caption" color="warning">
              Next go: {data.money.nextGo}
            </Text>
          )}
        </Box>

        <Box flexDirection="column" gap="xs">
          {label('The team')}
          {members.length === 0 && <Text dimColor>No agents found in .claude/agents.</Text>}
          {lanes.map(lane => (
            <Box key={`lane-${lane}`} flexDirection="column">
              <Text size="caption" weight="semibold">
                {lane}
              </Text>
              {members
                .filter(m => m.lane === lane)
                .map(m => (
                  <Box flexDirection="row" gap="sm" alignItems="center" key={`m-${m.name}`}>
                    <Text size="footnote" mono>
                      {m.name}
                    </Text>
                    <Text size="caption" color={m.model === 'opus' ? 'merged' : 'success'}>
                      {m.model}
                    </Text>
                    <Text size="caption" color={ACCESS_COLOR[m.access]}>
                      {m.access}
                    </Text>
                    <Button key={`brief-${m.name}`} plain onPress={fill(`Run the ${m.name} agent to `)}>
                      Brief
                    </Button>
                  </Box>
                ))}
            </Box>
          ))}
        </Box>

        <Box flexDirection="column" gap="xs">
          {label(used.length > 0 ? 'Skills called this session' : 'Skills used (from the last state write)')}
          {sessionSkills.length === 0 && (
            <Text size="footnote" dimColor>
              No skill called yet.
            </Text>
          )}
          <Box flexDirection="row" flexWrap="wrap" gap="sm">
            {sessionSkills.map(skill => (
              <Text key={`s-${skill.name}`} size="footnote" mono>
                {skill.name}
                {skill.count > 1 ? ` ×${skill.count}` : ''}
              </Text>
            ))}
          </Box>
        </Box>

        <Text size="caption" dimColor>
          Data updated {ago(data.generatedAt, ms)}. Nothing is activated, budgeted or tested without the Owner's go.
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (e.props.isDraft || e.props.isWorking) return next(e)
    if (!(await read($, active))) return next(e)

    const data = await read($, board)
    if (data === null) return next(e)

    const first = nextRuns(data, await $.clock.now())[0]
    if (first === undefined) return next(e)

    return next({
      ...e,
      props: {
        ...e.props,
        hint: `${first.routine.label} at ${first.routine.time} (${inWords(first.inMinutes)}) · type /${first.routine.command} · /team for the control room`,
      },
    })
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!(await read($, active))) return next(e)

    const busy = await working($)
    const names = [...new Set(busy.map(agent => agent.type))]
    if (names.length === 0) return next(e)

    const message = `${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]} working`

    return next({ ...e, props: { ...e.props, message } })
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    if (!(await read($, active))) return next(e)

    await read($, tick)
    const data = await read($, board)
    const busy = await working($)
    const ms = await $.clock.now()
    const first = data === null ? undefined : nextRuns(data, ms)[0]
    const { Box, Text, Button } = $.ui.resolve(e)
    const parts = [
      busy.length > 0 ? `${busy.length} working: ${busy.map(agent => agent.type).join(', ')}` : 'no agent running',
      first === undefined ? '' : `next: ${first.routine.label} ${inWords(first.inMinutes)}`,
      data === null ? '' : launchWords(daysUntil(data.launch, ms)),
    ].filter(part => part !== '')

    return (
      <Box flexDirection="row" gap="sm" alignItems="center">
        <Text color={busy.length > 0 ? 'claude' : 'subtle'}>●</Text>
        <Text size="footnote" dimColor>
          {parts.join(' · ')}
        </Text>
        <Button key="open-team" plain onPress={() => $.ui.open({ id: PANE, title: titleOf(data) })}>
          Control room
        </Button>
      </Box>
    )
  })
}
