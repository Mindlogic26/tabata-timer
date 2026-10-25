import type { Phase } from './types.ts'

// The countdown uses timestamps, not a count of timer ticks.
// Each phase remembers the clock time when it should end.
// To draw the screen we subtract that time from Date.now().
// If the phone hiccups, the next check still lands on the right second,
// because we never trust "one tick equals one second".

export interface TimerState {
  status: 'running' | 'paused' | 'done'
  phaseIndex: number
  /** Wall-clock time (Date.now) when the current phase ends. Null when paused or done. */
  phaseEndsAt: number | null
  remainingMs: number
}

export type BeepCue = 'long' | 'short'

function finished(phases: Phase[]): TimerState {
  return {
    status: 'done',
    phaseIndex: Math.max(0, phases.length - 1),
    phaseEndsAt: null,
    remainingMs: 0,
  }
}

export function createTimerState(phases: Phase[], now: number): TimerState {
  const first = phases[0]
  if (!first) return finished(phases)
  return {
    status: 'running',
    phaseIndex: 0,
    phaseEndsAt: now + first.durationMs,
    remainingMs: first.durationMs,
  }
}

export function tickTimer(state: TimerState, phases: Phase[], now: number): TimerState {
  if (state.status !== 'running' || state.phaseEndsAt === null) return state
  if (phases.length === 0) return finished(phases)

  let phaseIndex = state.phaseIndex
  let phaseEndsAt = state.phaseEndsAt
  let steps = 0

  // Catch up if more than one phase ended while the screen was busy or hidden.
  while (now >= phaseEndsAt && steps < phases.length) {
    phaseIndex += 1
    steps += 1
    if (phaseIndex >= phases.length) return finished(phases)
    phaseEndsAt += phases[phaseIndex].durationMs
  }

  if (now >= phaseEndsAt) return finished(phases)

  return {
    status: 'running',
    phaseIndex,
    phaseEndsAt,
    remainingMs: phaseEndsAt - now,
  }
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.phaseEndsAt === null) return state
  return {
    status: 'paused',
    phaseIndex: state.phaseIndex,
    phaseEndsAt: null,
    remainingMs: Math.max(0, state.phaseEndsAt - now),
  }
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status !== 'paused') return state
  return {
    status: 'running',
    phaseIndex: state.phaseIndex,
    phaseEndsAt: now + state.remainingMs,
    remainingMs: state.remainingMs,
  }
}

export function skipPhase(state: TimerState, phases: Phase[], now: number): TimerState {
  if (state.status === 'done') return state
  const nextIndex = state.phaseIndex + 1
  if (nextIndex >= phases.length) return finished(phases)

  const durationMs = phases[nextIndex].durationMs
  if (state.status === 'paused') {
    return {
      status: 'paused',
      phaseIndex: nextIndex,
      phaseEndsAt: null,
      remainingMs: durationMs,
    }
  }
  return {
    status: 'running',
    phaseIndex: nextIndex,
    phaseEndsAt: now + durationMs,
    remainingMs: durationMs,
  }
}

export function needsRender(prev: TimerState, next: TimerState): boolean {
  if (prev.status !== next.status) return true
  if (prev.phaseIndex !== next.phaseIndex) return true
  return Math.ceil(prev.remainingMs / 1000) !== Math.ceil(next.remainingMs / 1000)
}

/** Which beep to play for a state change. Null means stay quiet. */
export function cueForTransition(prev: TimerState, next: TimerState): BeepCue | null {
  if (prev === next || prev.status === 'done') return null
  if (next.status === 'done') return 'long'
  if (next.phaseIndex !== prev.phaseIndex) return 'long'
  if (prev.status !== 'running' || next.status !== 'running') return null

  const prevSecond = Math.ceil(prev.remainingMs / 1000)
  const nextSecond = Math.ceil(next.remainingMs / 1000)
  const steppedByOne = prevSecond - nextSecond === 1
  if (steppedByOne && (nextSecond === 1 || nextSecond === 2 || nextSecond === 3)) {
    return 'short'
  }
  return null
}
