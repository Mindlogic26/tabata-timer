import { formatDuration } from './format.ts'
import { buildPhaseSequence } from './sequence.ts'
import type { Workout } from './types.ts'

export const LIMITS = {
  name: { min: 1, max: 40 },
  prepareSeconds: { min: 0, max: 60 * 60 },
  workSeconds: { min: 1, max: 60 * 60 },
  restSeconds: { min: 0, max: 60 * 60 },
  rounds: { min: 1, max: 99 },
  cycles: { min: 1, max: 50 },
  restBetweenCyclesSeconds: { min: 0, max: 60 * 60 },
  cooldownSeconds: { min: 0, max: 60 * 60 },
} as const

export type CountField = keyof Omit<typeof LIMITS, 'name'>

const COUNT_FIELDS: CountField[] = [
  'prepareSeconds',
  'workSeconds',
  'restSeconds',
  'rounds',
  'cycles',
  'restBetweenCyclesSeconds',
  'cooldownSeconds',
]

export const CLASSIC_TABATA: Workout = {
  id: 'classic-tabata',
  name: 'Classic Tabata',
  prepareSeconds: 10,
  workSeconds: 20,
  restSeconds: 10,
  rounds: 8,
  cycles: 1,
  restBetweenCyclesSeconds: 0,
  cooldownSeconds: 0,
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Starting point for the New workout screen. */
export function createDraft(): Workout {
  return {
    id: createId(),
    name: '',
    prepareSeconds: 10,
    workSeconds: 20,
    restSeconds: 10,
    rounds: 8,
    cycles: 1,
    restBetweenCyclesSeconds: 60,
    cooldownSeconds: 0,
  }
}

export function normalizeWorkout(workout: Workout): Workout | null {
  const name = workout.name.trim()
  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) return null
  if (workout.id.trim().length === 0 || workout.id.length > 80) return null

  const next: Workout = { ...workout, id: workout.id.trim(), name }
  for (const field of COUNT_FIELDS) {
    const value = next[field]
    const limits = LIMITS[field]
    if (!Number.isInteger(value) || value < limits.min || value > limits.max) return null
  }
  return next
}

export function totalSeconds(workout: Workout): number {
  return buildPhaseSequence(workout).reduce((total, phase) => total + phase.durationMs, 0) / 1000
}

export function workoutSummary(workout: Workout): string {
  const parts: string[] = []
  if (workout.prepareSeconds > 0) parts.push(`${formatDuration(workout.prepareSeconds)} prepare`)
  parts.push(`${formatDuration(workout.workSeconds)} work`)
  if (workout.restSeconds > 0) parts.push(`${formatDuration(workout.restSeconds)} rest`)
  parts.push(`${workout.rounds} ${workout.rounds === 1 ? 'round' : 'rounds'}`)
  parts.push(`${workout.cycles} ${workout.cycles === 1 ? 'cycle' : 'cycles'}`)
  if (workout.cycles > 1 && workout.restBetweenCyclesSeconds > 0) {
    parts.push(`${formatDuration(workout.restBetweenCyclesSeconds)} between cycles`)
  }
  if (workout.cooldownSeconds > 0) parts.push(`${formatDuration(workout.cooldownSeconds)} cooldown`)
  return parts.join(' · ')
}
