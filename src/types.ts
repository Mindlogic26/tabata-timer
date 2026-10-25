export type PhaseKind = 'prepare' | 'work' | 'rest' | 'cycleRest' | 'cooldown'

export interface Workout {
  id: string
  name: string
  /** Seconds. 0 skips this phase. */
  prepareSeconds: number
  workSeconds: number
  /** Seconds of rest after every work period. 0 skips it. */
  restSeconds: number
  rounds: number
  cycles: number
  /** Seconds. Only played between cycles, never after the last one. 0 skips it. */
  restBetweenCyclesSeconds: number
  /** Seconds. 0 skips this phase. */
  cooldownSeconds: number
  /**
   * Optional names for the work periods.
   * Round 1 uses the first name, then the next, then it starts again.
   * An empty list keeps the plain "Work" label.
   */
  exercises: string[]
}

/** One slice of a workout, already expanded into the order it will be played. */
export interface Phase {
  kind: PhaseKind
  durationMs: number
  /** 1-based round, or null when this phase is not inside a round. */
  round: number | null
  /** 1-based cycle, or null for prepare and cooldown. */
  cycle: number | null
}
