import { useState } from 'react'
import { formatDuration } from '../format.ts'
import { playStartCue } from '../audio.ts'
import type { Workout } from '../types.ts'
import { totalSeconds, workoutSummary } from '../workout.ts'

interface WorkoutListProps {
  workouts: Workout[]
  onStart: (workout: Workout) => void
  onEdit: (workout: Workout) => void
  onCreate: () => void
  onDelete: (workout: Workout) => void
}

export function WorkoutList({ workouts, onStart, onEdit, onCreate, onDelete }: WorkoutListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-zinc-950 text-white">
      <header className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-5xl font-black tracking-tight">Tabata</h1>
        <p className="mt-1 text-lg font-bold text-zinc-400">Saved on this phone</p>
      </header>

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {workouts.length === 0 && (
          <p className="rounded-3xl bg-zinc-900 px-5 py-8 text-center text-2xl font-bold text-zinc-300">
            No workouts yet. Create one to get started.
          </p>
        )}

        {workouts.map((workout) => {
          const confirming = pendingDeleteId === workout.id
          return (
            <article key={workout.id} className="rounded-3xl bg-zinc-900 p-4">
              <h2 className="text-3xl font-black leading-tight">{workout.name}</h2>
              <p className="mt-2 text-lg font-semibold leading-snug text-zinc-300">
                {workoutSummary(workout)}
              </p>
              <p className="mt-2 text-xl font-black">Total {formatDuration(totalSeconds(workout))}</p>

              {confirming ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xl font-black">Delete this workout?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="h-14 rounded-2xl bg-zinc-800 text-xl font-black"
                      onClick={() => setPendingDeleteId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="h-14 rounded-2xl bg-red-600 text-xl font-black"
                      onClick={() => {
                        setPendingDeleteId(null)
                        onDelete(workout)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    className="h-16 w-full rounded-2xl text-2xl font-black text-black active:scale-[0.98]"
                    style={{ backgroundColor: '#FF6B00' }}
                    onClick={() => {
                      playStartCue()
                      onStart(workout)
                    }}
                  >
                    Start
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="h-14 rounded-2xl bg-zinc-800 text-xl font-black"
                      onClick={() => onEdit(workout)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="h-14 rounded-2xl bg-zinc-800 text-xl font-black"
                      onClick={() => setPendingDeleteId(workout.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="border-t border-white/10 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="h-16 w-full rounded-2xl bg-white text-2xl font-black text-black active:scale-[0.98]"
          onClick={onCreate}
        >
          New workout
        </button>
      </div>
    </div>
  )
}
