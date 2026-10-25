import { useEffect, useRef, useState, type FormEvent } from 'react'
import { formatDuration, formatSetting } from '../format.ts'
import { PHASE_META } from '../phases.ts'
import { Stepper } from './Stepper.tsx'
import type { Workout } from '../types.ts'
import {
  cleanExercises,
  createDraft,
  LIMITS,
  normalizeWorkout,
  totalSeconds,
  type CountField,
} from '../workout.ts'

interface WorkoutEditorProps {
  initial: Workout | null
  /** Filled in from a template. Ignored when editing a saved workout. */
  preset: Workout | null
  onSave: (workout: Workout) => void
  onCancel: () => void
}

function copyWorkout(workout: Workout): Workout {
  return { ...workout, exercises: [...(workout.exercises ?? [])] }
}

const NEUTRAL = '#A1A1AA'

export function WorkoutEditor({ initial, preset, onSave, onCancel }: WorkoutEditorProps) {
  const [draft, setDraft] = useState<Workout>(() => copyWorkout(initial ?? preset ?? createDraft()))
  const focusNewExercise = useRef(false)
  const cleaned = normalizeWorkout(draft)
  const canSave = cleaned !== null
  const exerciseCount = cleanExercises(draft.exercises).length

  useEffect(() => {
    if (!focusNewExercise.current) return
    focusNewExercise.current = false
    const inputs = document.querySelectorAll<HTMLInputElement>('[data-exercise-input]')
    inputs[inputs.length - 1]?.focus()
  }, [draft.exercises.length])

  function updateExercise(index: number, name: string) {
    setDraft((current) => {
      const exercises = current.exercises.slice()
      exercises[index] = name.slice(0, LIMITS.exerciseName.max)
      return { ...current, exercises }
    })
  }

  function moveExercise(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction
      if (target < 0 || target >= current.exercises.length) return current
      const exercises = current.exercises.slice()
      const [item] = exercises.splice(index, 1)
      exercises.splice(target, 0, item ?? '')
      return { ...current, exercises }
    })
  }

  function removeExercise(index: number) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function addExercise() {
    if (draft.exercises.length >= LIMITS.exercises.max) return
    focusNewExercise.current = true
    setDraft((current) => {
      if (current.exercises.length >= LIMITS.exercises.max) return current
      return { ...current, exercises: [...current.exercises, ''] }
    })
  }

  function bump(field: CountField, delta: number) {
    setDraft((current) => {
      const limits = LIMITS[field]
      const nextValue = Math.min(limits.max, Math.max(limits.min, current[field] + delta))
      if (nextValue === current[field]) return current
      return { ...current, [field]: nextValue }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cleaned) return
    onSave(cleaned)
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-[#0A0A0A] text-white">
      <header className="safe-x pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-4xl font-black tracking-tight">
          {initial ? 'Edit workout' : 'New workout'}
        </h1>
        <p className="mt-1 text-lg font-semibold leading-snug text-zinc-400">
          Each round is work, then rest. Rest between cycles is added only when you have more than one cycle.
        </p>
      </header>

      <form className="mt-4 flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <div className="safe-x flex-1 space-y-2 overflow-y-auto pb-4">
          <section className="rounded-3xl bg-zinc-900 p-4">
            <label htmlFor="workout-name" className="text-2xl font-black">
              Name
            </label>
            <input
              id="workout-name"
              value={draft.name}
              maxLength={LIMITS.name.max}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="done"
              placeholder="Morning Tabata"
              className="mt-3 w-full rounded-2xl bg-zinc-800 px-4 py-4 text-2xl font-bold text-white outline-none placeholder:text-zinc-500 focus:ring-4 focus:ring-white"
              onChange={(event) => {
                const name = event.target.value.slice(0, LIMITS.name.max)
                setDraft((current) => ({ ...current, name }))
              }}
            />
          </section>

          <section className="rounded-3xl bg-zinc-900 px-3 py-3">
            <h2 className="text-xl font-black">Exercises</h2>
            <p className="mt-1 text-sm leading-snug text-zinc-400">
              Optional. Round 1 uses the first name, then the next, and it starts again. Leave this
              empty to keep showing Work.
            </p>
            {draft.exercises.length > 0 && (
              <ul className="mt-3 space-y-2">
                {draft.exercises.map((exercise, index) => {
                  const label = exercise.trim() || `exercise ${index + 1}`
                  return (
                    <li key={index} className="flex items-center gap-2">
                      <input
                        data-exercise-input
                        value={exercise}
                        maxLength={LIMITS.exerciseName.max}
                        autoComplete="off"
                        autoCapitalize="words"
                        enterKeyHint="done"
                        placeholder="Push-ups"
                        aria-label={`Exercise ${index + 1}`}
                        className="min-w-0 flex-1 rounded-2xl bg-zinc-800 px-3 py-3 text-xl font-bold text-white outline-none placeholder:text-zinc-500 focus:ring-4 focus:ring-white"
                        onChange={(event) => updateExercise(index, event.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={`Move ${label} up`}
                        disabled={index === 0}
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zinc-800 text-2xl font-black disabled:opacity-30"
                        onClick={() => moveExercise(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${label} down`}
                        disabled={index === draft.exercises.length - 1}
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zinc-800 text-2xl font-black disabled:opacity-30"
                        onClick={() => moveExercise(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${label}`}
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zinc-800 text-2xl font-black"
                        onClick={() => removeExercise(index)}
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <button
              type="button"
              className="mt-3 h-14 w-full rounded-2xl bg-zinc-800 text-xl font-black disabled:opacity-30"
              disabled={draft.exercises.length >= LIMITS.exercises.max}
              onClick={addExercise}
            >
              Add exercise
            </button>
            {exerciseCount > 0 && draft.rounds > exerciseCount && (
              <p className="mt-2 text-sm leading-snug text-zinc-400">
                {exerciseCount === 1 ? 'This name repeats' : 'These names repeat'} after round {exerciseCount}.
              </p>
            )}
          </section>

          <Stepper
            label="Prepare"
            hint="Get ready before the first round. Off skips it."
            value={formatSetting(draft.prepareSeconds)}
            swatch={PHASE_META.prepare.color}
            atMin={draft.prepareSeconds <= LIMITS.prepareSeconds.min}
            atMax={draft.prepareSeconds >= LIMITS.prepareSeconds.max}
            onStep={(delta) => bump('prepareSeconds', delta)}
          />
          <Stepper
            label="Work"
            hint="How long you work in each round."
            value={formatSetting(draft.workSeconds)}
            swatch={PHASE_META.work.color}
            atMin={draft.workSeconds <= LIMITS.workSeconds.min}
            atMax={draft.workSeconds >= LIMITS.workSeconds.max}
            onStep={(delta) => bump('workSeconds', delta)}
          />
          <Stepper
            label="Rest"
            hint="Rest after each round. Off skips it."
            value={formatSetting(draft.restSeconds)}
            swatch={PHASE_META.rest.color}
            atMin={draft.restSeconds <= LIMITS.restSeconds.min}
            atMax={draft.restSeconds >= LIMITS.restSeconds.max}
            onStep={(delta) => bump('restSeconds', delta)}
          />
          <Stepper
            label="Rounds"
            hint="How many work periods are in one cycle."
            value={String(draft.rounds)}
            swatch={NEUTRAL}
            atMin={draft.rounds <= LIMITS.rounds.min}
            atMax={draft.rounds >= LIMITS.rounds.max}
            onStep={(delta) => bump('rounds', delta)}
          />
          <Stepper
            label="Cycles"
            hint="How many times to repeat all the rounds."
            value={String(draft.cycles)}
            swatch={NEUTRAL}
            atMin={draft.cycles <= LIMITS.cycles.min}
            atMax={draft.cycles >= LIMITS.cycles.max}
            onStep={(delta) => bump('cycles', delta)}
          />
          <Stepper
            label="Rest between cycles"
            hint={
              draft.cycles < 2
                ? 'Not used with 1 cycle. Add another cycle if you want this break.'
                : 'A longer break after every cycle except the last.'
            }
            value={formatSetting(draft.restBetweenCyclesSeconds)}
            swatch={PHASE_META.cycleRest.color}
            atMin={draft.restBetweenCyclesSeconds <= LIMITS.restBetweenCyclesSeconds.min}
            atMax={draft.restBetweenCyclesSeconds >= LIMITS.restBetweenCyclesSeconds.max}
            onStep={(delta) => bump('restBetweenCyclesSeconds', delta)}
          />
          <Stepper
            label="Cooldown"
            hint="Easy finish after the last round. Off skips it."
            value={formatSetting(draft.cooldownSeconds)}
            swatch={PHASE_META.cooldown.color}
            atMin={draft.cooldownSeconds <= LIMITS.cooldownSeconds.min}
            atMax={draft.cooldownSeconds >= LIMITS.cooldownSeconds.max}
            onStep={(delta) => bump('cooldownSeconds', delta)}
          />
        </div>

        <div className="safe-x border-t border-white/10 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="mb-3 text-center text-2xl font-black">
            Total {formatDuration(totalSeconds(draft))}
          </p>
          {!canSave && (
            <p className="mb-3 text-center text-lg font-bold text-zinc-400">Type a name before saving.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="h-16 rounded-2xl bg-zinc-800 text-2xl font-black"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="h-16 rounded-2xl text-2xl font-black text-black disabled:opacity-40"
              style={{ backgroundColor: '#FF6B00' }}
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
