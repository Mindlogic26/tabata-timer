import type { Workout } from './types.ts'
import { createDraft, createId, templateSummary } from './workout.ts'

interface TemplateSpec {
  id: string
  name: string
  summary: string
  create: () => Workout
}

function timed(name: string, fields: Omit<Workout, 'id' | 'name'>): Omit<TemplateSpec, 'id'> {
  const workout: Workout = { id: 'template', name, ...fields }
  return {
    name,
    summary: templateSummary(workout),
    create: () => ({
      ...workout,
      id: createId(),
      exercises: [...workout.exercises],
    }),
  }
}

const PUSHUPS_WALL_SIT = timed('Push-ups + Wall sit', {
  prepareSeconds: 10,
  workSeconds: 30,
  restSeconds: 30,
  rounds: 8,
  cycles: 1,
  restBetweenCyclesSeconds: 0,
  cooldownSeconds: 0,
  exercises: ['Push-ups', 'Wall sit'],
})

const PUSHUP_BUILDER = timed('Push-up builder', {
  prepareSeconds: 10,
  workSeconds: 20,
  restSeconds: 40,
  rounds: 6,
  cycles: 1,
  restBetweenCyclesSeconds: 0,
  cooldownSeconds: 0,
  exercises: ['Push-ups'],
})

const WALL_SIT = timed('Wall sit hold', {
  prepareSeconds: 10,
  workSeconds: 45,
  restSeconds: 45,
  rounds: 4,
  cycles: 1,
  restBetweenCyclesSeconds: 0,
  cooldownSeconds: 0,
  exercises: ['Wall sit'],
})

const HOME_CIRCUIT = timed('Home circuit', {
  prepareSeconds: 10,
  workSeconds: 30,
  restSeconds: 15,
  rounds: 4,
  cycles: 3,
  restBetweenCyclesSeconds: 60,
  cooldownSeconds: 0,
  exercises: ['Push-ups', 'Wall sit', 'Plank', 'Glute bridge'],
})

const CLASSIC = timed('Classic Tabata', {
  prepareSeconds: 10,
  workSeconds: 20,
  restSeconds: 10,
  rounds: 8,
  cycles: 1,
  restBetweenCyclesSeconds: 0,
  cooldownSeconds: 0,
  exercises: [],
})

export const WORKOUT_TEMPLATES: TemplateSpec[] = [
  { id: 'pushups-wall-sit', ...PUSHUPS_WALL_SIT },
  { id: 'pushup-builder', ...PUSHUP_BUILDER },
  { id: 'wall-sit-hold', ...WALL_SIT },
  { id: 'home-circuit', ...HOME_CIRCUIT },
  { id: 'classic-tabata', ...CLASSIC },
  {
    id: 'blank',
    name: 'Blank',
    summary: 'Start from scratch',
    create: () => createDraft(),
  },
]
