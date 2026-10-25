import { useState } from 'react'
import { TimerScreen } from './components/TimerScreen.tsx'
import { WorkoutEditor } from './components/WorkoutEditor.tsx'
import { WorkoutList } from './components/WorkoutList.tsx'
import { loadWorkouts, saveWorkouts } from './storage.ts'
import type { Workout } from './types.ts'

type Screen =
  | { name: 'list' }
  | { name: 'edit'; workoutId: string | null }
  | { name: 'timer'; workoutId: string }

function App() {
  const [workouts, setWorkouts] = useState<Workout[]>(() => loadWorkouts())
  const [screen, setScreen] = useState<Screen>({ name: 'list' })

  function persist(next: Workout[]) {
    setWorkouts(next)
    saveWorkouts(next)
  }

  function saveWorkout(workout: Workout) {
    const exists = workouts.some((item) => item.id === workout.id)
    const next = exists
      ? workouts.map((item) => (item.id === workout.id ? workout : item))
      : [workout, ...workouts]
    persist(next)
    setScreen({ name: 'list' })
  }

  function deleteWorkout(workout: Workout) {
    persist(workouts.filter((item) => item.id !== workout.id))
  }

  if (screen.name === 'timer') {
    const workout = workouts.find((item) => item.id === screen.workoutId)
    if (!workout) {
      return (
        <WorkoutList
          workouts={workouts}
          onStart={(item) => setScreen({ name: 'timer', workoutId: item.id })}
          onEdit={(item) => setScreen({ name: 'edit', workoutId: item.id })}
          onCreate={() => setScreen({ name: 'edit', workoutId: null })}
          onDelete={deleteWorkout}
        />
      )
    }
    return <TimerScreen workout={workout} onExit={() => setScreen({ name: 'list' })} />
  }

  if (screen.name === 'edit') {
    const initial = screen.workoutId
      ? workouts.find((item) => item.id === screen.workoutId) ?? null
      : null
    if (screen.workoutId && !initial) {
      return (
        <WorkoutList
          workouts={workouts}
          onStart={(item) => setScreen({ name: 'timer', workoutId: item.id })}
          onEdit={(item) => setScreen({ name: 'edit', workoutId: item.id })}
          onCreate={() => setScreen({ name: 'edit', workoutId: null })}
          onDelete={deleteWorkout}
        />
      )
    }
    return (
      <WorkoutEditor
        initial={initial}
        onSave={saveWorkout}
        onCancel={() => setScreen({ name: 'list' })}
      />
    )
  }

  return (
    <WorkoutList
      workouts={workouts}
      onStart={(workout) => setScreen({ name: 'timer', workoutId: workout.id })}
      onEdit={(workout) => setScreen({ name: 'edit', workoutId: workout.id })}
      onCreate={() => setScreen({ name: 'edit', workoutId: null })}
      onDelete={deleteWorkout}
    />
  )
}

export default App
