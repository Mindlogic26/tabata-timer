import type { Workout } from './types.ts'
import { CLASSIC_TABATA, normalizeWorkout } from './workout.ts'

// Saved in the browser on this phone. There is no server.
// Clearing the browser's site data deletes the workouts.
const STORAGE_KEY = 'tabata-timer-workouts'

function parseWorkout(value: unknown): Workout | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.name !== 'string') return null

  return normalizeWorkout({
    id: record.id,
    name: record.name,
    prepareSeconds: record.prepareSeconds as number,
    workSeconds: record.workSeconds as number,
    restSeconds: record.restSeconds as number,
    rounds: record.rounds as number,
    cycles: record.cycles as number,
    restBetweenCyclesSeconds: record.restBetweenCyclesSeconds as number,
    cooldownSeconds: record.cooldownSeconds as number,
    exercises: Array.isArray(record.exercises) ? record.exercises.filter((item) => typeof item === 'string') : [],
  })
}

function seed(): Workout[] {
  const initial = [CLASSIC_TABATA]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  } catch {
    // Storage can be blocked. The preset still shows for this visit.
  }
  return initial
}

export function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return seed()

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seed()

    const workouts = parsed.flatMap((item) => {
      const workout = parseWorkout(item)
      return workout ? [workout] : []
    })
    if (workouts.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
    }
    return workouts
  } catch {
    return seed()
  }
}

export function saveWorkouts(workouts: Workout[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  } catch {
    // Ignore quota and privacy-mode errors. The list still updates on screen.
  }
}
