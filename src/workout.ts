import { formatDuration, formatSpokenDuration } from './format.ts'
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
  exerciseName: { min: 1, max: 40 },
  exercises: { min: 0, max: 20 },
} as const

export type CountField = keyof Omit<typeof LIMITS, 'name' | 'exerciseName' | 'exercises'>

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
  exercises: [],
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
    exercises: [],
  }
}

/** Round 1 uses the first name. After the last name, it starts again. */
export function exerciseNameForRound(
  exercises: readonly string[] | undefined,
  round: number,
): string | null {
  if (!exercises || exercises.length === 0) return null
  const index = (Math.max(1, round) - 1) % exercises.length
  const name = exercises[index]?.trim()
  return name ? name : null
}

export function cleanExercises(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const names: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const name = item.trim().slice(0, LIMITS.exerciseName.max)
    if (name.length < LIMITS.exerciseName.min) continue
    names.push(name)
    if (names.length >= LIMITS.exercises.max) break
  }
  return names
}

export function normalizeWorkout(workout: Workout): Workout | null {
  const name = workout.name.trim()
  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) return null
  if (workout.id.trim().length === 0 || workout.id.length > 80) return null

  const next: Workout = {
    ...workout,
    id: workout.id.trim(),
    name,
    exercises: cleanExercises(workout.exercises),
  }
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

/** Short line on a template card, such as "30s / 30s · 8 rounds · 8 min 10s". */
export function templateSummary(workout: Workout): string {
  const timing = `${formatDuration(workout.workSeconds)} / ${formatDuration(workout.restSeconds)}`
  const rounds = `${workout.rounds} ${workout.rounds === 1 ? 'round' : 'rounds'}`
  const cycles = workout.cycles > 1 ? `${workout.cycles} cycles` : null
  return [timing, rounds, cycles, formatSpokenDuration(totalSeconds(workout))].filter(Boolean).join(' · ')
}
