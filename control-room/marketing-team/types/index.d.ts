export type Access = 'Builds paused' | 'Reads Meta' | 'No account'

export type Member = {
  name: string
  model: string
  lane: string
  access: Access
}

export type SkillUse = { name: string; count: number }

export type Routine = {
  id: string
  label: string
  command: string
  time: string
  days: number[]
}

export type Task = { title: string; owner: string }

export type Campaign = {
  id: string | null
  name: string
  label: string | null
  status: string
  spent: string | null
  result: string | null
}

/** dashboard/state.json after normalisation: every key present, nulls where the file has nothing. */
export type Board = {
  company: string | null
  generatedAt: string | null
  launch: string | null
  routines: { timezone: string | null; items: Routine[] }
  working: string[]
  tasks: Task[]
  money: {
    currency: string | null
    dailySpend: string | null
    caps: string[]
    liveToday: string | null
    nextGo: string | null
  }
  campaigns: Campaign[]
  team: Record<string, string[]>
  skillsUsed: SkillUse[]
}

declare module 'claude-code' {
  interface PluginState {
    'marketing-team': {
      root: string
      active: boolean
      roster: Member[]
      skills: SkillUse[]
      tick: number
      board: Board | null
      boardStamp: number
      lastToast: string
    }
  }
}
