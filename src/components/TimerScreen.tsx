import { useEffect, useRef, useState } from 'react'
import { formatCountdown, formatDuration } from '../format.ts'
import { PHASE_META } from '../phases.ts'
import { buildPhaseSequence, getProgress } from '../sequence.ts'
import type { Workout } from '../types.ts'
import { useTimer } from '../useTimer.ts'
import { totalSeconds } from '../workout.ts'

interface TimerScreenProps {
  workout: Workout
  onExit: () => void
}

export function TimerScreen({ workout, onExit }: TimerScreenProps) {
  const [phases] = useState(() => buildPhaseSequence(workout))
  const { timer, pause, resume, skip } = useTimer(phases)
  const [confirmingExit, setConfirmingExit] = useState(false)
  const wasRunningRef = useRef(false)

  const phase = phases[timer.phaseIndex]
  const done = timer.status === 'done' || !phase
  const meta = !done && phase ? PHASE_META[phase.kind] : null
  const background = meta?.color ?? '#0A0A0A'
  const ink = meta?.ink ?? '#ffffff'
  const next = phase ? phases[timer.phaseIndex + 1] : undefined
  const progress = phase && !done ? getProgress(phase, workout) : { roundsLeft: 0, cyclesLeft: 0 }
  const countdown = formatCountdown(timer.remainingMs)
  const countdownSize = countdown.length <= 2 ? 'min(52vw, 34vh)' : 'min(24vw, 22vh)'

  useEffect(() => {
    const theme = document.querySelector('meta[name="theme-color"]')
    const previousBody = document.body.style.background
    const previousTheme = theme?.getAttribute('content')
    return () => {
      document.body.style.background = previousBody
      if (theme && previousTheme) theme.setAttribute('content', previousTheme)
      document.title = 'Tabata Timer'
    }
  }, [])

  useEffect(() => {
    const theme = document.querySelector('meta[name="theme-color"]')
    document.body.style.background = background
    theme?.setAttribute('content', background)
    document.title = done || !meta ? 'Done · Tabata Timer' : `${meta.label} ${countdown} · Tabata Timer`
  }, [background, done, meta, countdown])

  function askToExit() {
    wasRunningRef.current = timer.status === 'running'
    if (timer.status === 'running') pause()
    setConfirmingExit(true)
  }

  function keepGoing() {
    setConfirmingExit(false)
    if (wasRunningRef.current) resume()
  }

  if (done) {
    return (
      <div className="safe-x-lg fixed inset-0 flex flex-col items-center justify-center bg-[#0A0A0A] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
        <p className="text-center text-7xl font-black tracking-tight">Done</p>
        <p className="mt-4 text-center text-3xl font-black">{workout.name}</p>
        <p className="mt-2 text-center text-2xl font-bold text-zinc-300">
          Total {formatDuration(totalSeconds(workout))}
        </p>
        <button
          type="button"
          className="mt-12 h-16 w-full max-w-sm rounded-2xl bg-white text-2xl font-black text-black"
          onClick={onExit}
        >
          Back to workouts
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: background, color: ink }}
    >
      <div className="safe-x flex min-h-0 flex-1 flex-col items-center justify-center pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1
          className="text-center font-black uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2.75rem, 12vw, 4.75rem)' }}
          aria-live="polite"
        >
          {meta?.label}
        </h1>
        {timer.status === 'paused' && (
          <p className="mt-3 text-center text-4xl font-black tracking-wide">Paused</p>
        )}
        <p
          className="mt-2 text-center font-black tabular-nums leading-none tracking-tight"
          style={{ fontSize: countdownSize }}
        >
          {countdown}
        </p>
      </div>

      <div className="safe-x grid grid-cols-2 gap-3 pb-4 text-center">
        <div>
          <p className="text-5xl font-black tabular-nums leading-none">{progress.roundsLeft}</p>
          <p className="mt-1 text-lg font-black">
            {progress.roundsLeft === 1 ? 'round left' : 'rounds left'}
          </p>
        </div>
        <div>
          <p className="text-5xl font-black tabular-nums leading-none">{progress.cyclesLeft}</p>
          <p className="mt-1 text-lg font-black">
            {progress.cyclesLeft === 1 ? 'cycle left' : 'cycles left'}
          </p>
        </div>
      </div>

      <div className="safe-x bg-black/80 py-4 text-white">
        <p className="text-sm font-black tracking-widest uppercase text-white/70">Up next</p>
        <p className="mt-1 text-3xl font-black leading-none">
          {next ? `${PHASE_META[next.kind].label} · ${formatDuration(next.durationMs / 1000)}` : 'Done'}
        </p>
      </div>

      <div className="safe-x grid gap-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {timer.status === 'paused' ? (
          <button
            type="button"
            className="h-16 rounded-2xl bg-white text-2xl font-black text-black"
            onClick={resume}
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            className="h-16 rounded-2xl bg-white text-2xl font-black text-black"
            onClick={pause}
          >
            Pause
          </button>
        )}
        <button
          type="button"
          className="h-16 rounded-2xl bg-white text-2xl font-black text-black"
          onClick={skip}
        >
          Skip
        </button>
        <button
          type="button"
          className="h-16 rounded-2xl border-4 bg-transparent text-2xl font-black"
          style={{ borderColor: ink, color: ink }}
          onClick={askToExit}
        >
          Exit
        </button>
      </div>

      {confirmingExit && (
        <div className="safe-x-lg absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
          <p className="text-center text-4xl font-black">End this workout?</p>
          <button
            type="button"
            className="h-16 w-full max-w-sm rounded-2xl bg-white text-2xl font-black text-black"
            onClick={keepGoing}
          >
            Keep going
          </button>
          <button
            type="button"
            className="h-16 w-full max-w-sm rounded-2xl bg-red-600 text-2xl font-black"
            onClick={onExit}
          >
            End workout
          </button>
        </div>
      )}
    </div>
  )
}
