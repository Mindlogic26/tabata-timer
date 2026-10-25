import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { setWorkoutInProgress } from '../sw-updates.ts'
import { formatCountdown, formatDuration, formatTimeLeft } from '../format.ts'
import { PHASE_META } from '../phases.ts'
import { buildPhaseSequence, getPhasePosition, workoutElapsedRatio, workoutRemainingMs } from '../sequence.ts'
import type { Phase, Workout } from '../types.ts'
import { useTimer } from '../useTimer.ts'
import { exerciseNameForRound, totalSeconds } from '../workout.ts'

function phaseLabel(workout: Workout, phase: Phase): string {
  if (phase.kind === 'work') {
    return exerciseNameForRound(workout.exercises, phase.round ?? 1) ?? PHASE_META.work.label
  }
  return PHASE_META[phase.kind].label
}

function phaseTitleSize(label: string): string {
  if (label.length > 18) return 'clamp(1.35rem, 6vw, 2rem)'
  if (label.length > 10) return 'clamp(1.75rem, 8vw, 2.75rem)'
  return 'clamp(2rem, 9vw, 3.25rem)'
}

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
  const label = !done && phase ? phaseLabel(workout, phase) : null
  const background = meta?.color ?? '#0A0A0A'
  const ink = meta?.ink ?? '#ffffff'
  const next = phase ? phases[timer.phaseIndex + 1] : undefined
  const position = phase && !done ? getPhasePosition(phase, workout) : null
  const countdown = formatCountdown(timer.remainingMs)
  const countdownSize =
    countdown.length <= 2 ? 'min(74vw, 46vh)' : countdown.length <= 4 ? 'min(32vw, 28vh)' : 'min(22vw, 20vh)'
  const timeLeft = formatTimeLeft(workoutRemainingMs(phases, timer.phaseIndex, timer.remainingMs))
  const elapsed = workoutElapsedRatio(phases, timer.phaseIndex, timer.remainingMs)
  const elapsedPercent = Math.round(elapsed * 100)

  useLayoutEffect(() => {
    // Hold a new version until this workout finishes or the screen closes.
    // Pause still counts: the countdown is only stored on this page.
    setWorkoutInProgress(!done)
    return () => setWorkoutInProgress(false)
  }, [done])

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
    document.title = done || !label ? 'Done · Tabata Timer' : `${label} ${countdown} · Tabata Timer`
  }, [background, done, label, countdown])

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
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: background, color: ink }}
    >
      <div className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div
          className="h-1.5 w-full bg-black/25"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={elapsedPercent}
          aria-label="Workout progress"
        >
          <div className="h-full" style={{ width: `${elapsedPercent}%`, backgroundColor: ink }} />
        </div>
      </div>

      <div className="safe-x flex min-h-0 flex-1 flex-col items-center justify-center">
        <h1
          className="max-w-full text-center font-black uppercase leading-tight tracking-tight"
          style={{ fontSize: phaseTitleSize(label ?? '') }}
          aria-live="polite"
        >
          {label}
        </h1>
        {timer.status === 'paused' && (
          <p className="mt-2 text-center text-3xl font-black tracking-wide">Paused</p>
        )}
        <p
          className="mt-1 text-center font-black tabular-nums leading-[0.85] tracking-tight"
          style={{ fontSize: countdownSize }}
        >
          {countdown}
        </p>
        {position && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xl font-black tracking-wide">
            <p>
              ROUND {position.round} / {workout.rounds}
            </p>
            {workout.cycles > 1 && (
              <p>
                CYCLE {position.cycle} / {workout.cycles}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="safe-x bg-black/80 py-3 text-white">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-black tracking-widest uppercase text-white/70">Up next</p>
          <p className="text-xl font-black tabular-nums">{timeLeft} left</p>
        </div>
        <p className="mt-1 truncate text-2xl font-black leading-none">
          {next ? `${phaseLabel(workout, next)} · ${formatDuration(next.durationMs / 1000)}` : 'Done'}
        </p>
      </div>

      <div className="safe-x flex items-center gap-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          aria-label="Skip"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-black"
          onClick={skip}
        >
          <SkipIcon />
        </button>
        {timer.status === 'paused' ? (
          <button
            type="button"
            className="h-16 min-w-0 flex-1 rounded-2xl bg-white text-2xl font-black text-black"
            onClick={resume}
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            className="h-16 min-w-0 flex-1 rounded-2xl bg-white text-2xl font-black text-black"
            onClick={pause}
          >
            Pause
          </button>
        )}
        <button
          type="button"
          aria-label="Exit"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-black"
          onClick={askToExit}
        >
          <ExitIcon />
        </button>
      </div>

      {confirmingExit && (
        <div
          className="safe-x-lg absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="end-workout-title"
        >
          <p id="end-workout-title" className="text-center text-4xl font-black">
            End this workout?
          </p>
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

function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M4 5.5v13l10-6.5L4 5.5z" />
      <path d="M16 5.5h3.5v13H16z" />
    </svg>
  )
}

function ExitIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
    </svg>
  )
}
