import { expect, test } from 'claude-code/testing'

// A fictional board, as /morning or /sync would write it (dashboard/state.json).
const BOARD = {
  company: 'Example Co',
  generatedAt: '2026-03-04T08:30:00Z',
  launch: '2026-03-08T00:00:00Z',
  routines: {
    timezone: 'UTC',
    items: [
      { id: 'morning', label: 'Morning routine', command: 'morning', time: '08:30', days: [0, 1, 2, 3, 4] },
      { id: 'evening', label: 'Evening sync', command: 'sync', time: '19:00', days: [0, 1, 2, 3, 4] },
      { id: 'weekly', label: 'Weekly round', command: 'next-round', time: '10:00', days: [0] },
    ],
  },
  working: [],
  tasks: [
    { title: 'Choose the launch budget', owner: 'Owner' },
    { title: 'Connect the lead webhook', owner: 'Product team' },
  ],
  money: { currency: 'EUR', dailySpend: null, caps: [], liveToday: 'nothing live', nextGo: 'Flight 1 at 50/day' },
  campaigns: [{ id: '1', name: 'FLIGHT-1', label: 'Flight 1', status: 'PAUSED', spent: '0', result: 'no data' }],
  team: {},
  skillsUsed: [],
}

const AGENT = `---\nname: copywriter\ndescription: "Writes copy."\nmodel: opus\ntools: Read, Write\n---\nbody`

const PANE = {
  plugin: 'marketing-team',
  component: 'Pane',
  requestId: 'marketing-team',
  props: {
    title: 'Control room · Example Co',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

// Wednesday 2026-03-04 17:00 UTC: the evening sync is 2 h away, the launch 4 days.
const NOW = Date.parse('2026-03-04T17:00:00Z')

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the control room shows the next task, the next routine and a working agent (${surface})`, async ($, on) => {
    on('command.register', () => ({ value: { command: 'team' } }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    on('session.root', () => ({ value: '/project' }))
    on('fs.list', () => ({ value: [{ name: 'copywriter.md', kind: 'file', size: 1, mtimeMs: 1, isLink: false }] }))
    on('fs.stat', () => ({ value: { kind: 'file', size: 1, mtimeMs: 42, isLink: false } }))
    on('fs.read', (_, e) => ({ value: String(JSON.stringify(e)).includes('state.json') ? JSON.stringify(BOARD) : AGENT }))
    on('clock.now', () => ({ value: NOW }))
    on('agent.list', () => ({ value: [{ id: 'a1', description: 'writes variations', type: 'copywriter', status: 'running' }] }))

    await $.session.start({ cwd: '/project', surface, isInteractive: true })

    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /Choose the launch budget/ }))?.text).toBe('Choose the launch budget')
    expect((await ui.find({ type: 'Text', text: /^Evening sync$/ }))?.text).toBe('Evening sync')
    expect((await ui.find({ type: 'Text', text: /in 2 h 0 min/ }))?.text).toBe('in 2 h 0 min')
    await ui.unmount()

    const band = await $.ui.mount({ plugin: 'marketing-team', component: 'AbovePrompt', props: { hasSurvey: false }, surface } as never)
    expect((await band.find({ type: 'Text', text: /launch in 4 days/ }))?.text).toContain('1 working: copywriter')
    await band.unmount()
  })
}

test('the hint names the next routine and the spinner names the working agents', async ($, on) => {
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: '/project' }))
  on('fs.list', () => ({ value: [] }))
  on('fs.stat', () => ({ value: { kind: 'file', size: 1, mtimeMs: 42, isLink: false } }))
  on('fs.read', () => ({ value: JSON.stringify(BOARD) }))
  on('clock.now', () => ({ value: NOW }))
  on('agent.list', () => ({
    value: [
      { id: 'a1', description: 'x', type: 'copywriter', status: 'running' },
      { id: 'a2', description: 'y', type: 'media-buyer', status: 'running' },
    ],
  }))
  // Stands for the engine: draws whatever props the mod passed down.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    const props = e.props as { hint?: string; message?: string | null }

    return <Text>{props.hint ?? props.message ?? ''}</Text>
  })

  await $.session.start({ cwd: '/project', surface: 'desktop', isInteractive: true })

  const hint = await $.ui.mount({
    plugin: 'marketing-team',
    component: 'PromptHint',
    props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
    surface: 'desktop',
  } as never)
  expect((await hint.find({ type: 'Text', text: /Evening sync/ }))?.text).toBe(
    'Evening sync at 19:00 (in 2 h 0 min) · type /sync · /team for the control room',
  )
  await hint.unmount()

  const spinner = await $.ui.mount({
    plugin: 'marketing-team',
    component: 'Spinner',
    props: { word: 'Baking', message: null, suffix: '…', mode: 'thinking' },
    surface: 'desktop',
  } as never)
  expect((await spinner.find({ type: 'Text', text: /working/ }))?.text).toBe('copywriter and media-buyer working')
  await spinner.unmount()
})

test('outside a harness project the mod stays silent', async ($, on) => {
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: '/elsewhere' }))
  on('fs.stat', () => {
    throw new Error('ENOENT')
  })
  on('clock.now', () => ({ value: NOW }))
  on('agent.list', () => ({ value: [] }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    const props = e.props as { hint?: string }

    return <Text>{props.hint ?? ''}</Text>
  })

  await $.session.start({ cwd: '/elsewhere', surface: 'desktop', isInteractive: true })

  const hint = await $.ui.mount({
    plugin: 'marketing-team',
    component: 'PromptHint',
    props: { isDraft: false, isWorking: false, hint: '? for shortcuts' },
    surface: 'desktop',
  } as never)
  expect((await hint.find({ type: 'Text', text: /shortcuts/ }))?.text).toBe('? for shortcuts')
  await hint.unmount()
})
