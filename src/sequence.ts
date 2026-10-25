import type { Phase, PhaseKind, Workout } from './types.ts'

// Builds the ordered list of phases for a workout.
// A phase set to 0 seconds is left out.
//
// Order:
//   1. Prepare, once at the start
//   2. For every cycle: each round is work, then rest
//   3. After every cycle except the last: rest between cycles
//   4. Cooldown, once at the end

export interface PhasePosition {
  round: number
  cycle: number
}

function pushPhase(
  phases: Phase[],
  kind: PhaseKind,
  seconds: number,
  round: number | null,
  cycle: number | null,
): void {
  if (seconds <= 0) return
  phases.push({
    kind,
    durationMs: seconds * 1000,
    round,
    cycle,
  })
}

export function buildPhaseSequence(workout: Workout): Phase[] {
  const phases: Phase[] = []

  pushPhase(phases, 'prepare', workout.prepareSeconds, null, null)

  for (let cycle = 1; cycle <= workout.cycles; cycle += 1) {
    for (let round = 1; round <= workout.rounds; round += 1) {
      pushPhase(phases, 'work', workout.workSeconds, round, cycle)
      pushPhase(phases, 'rest', workout.restSeconds, round, cycle)
    }
    if (cycle < workout.cycles) {
      pushPhase(phases, 'cycleRest', workout.restBetweenCyclesSeconds, null, cycle)
    }
  }

  pushPhase(phases, 'cooldown', workout.cooldownSeconds, null, null)
  return phases
}

/** Where this phase sits in the workout, as "round 3 of 8". */
export function getPhasePosition(phase: Phase, workout: Workout): PhasePosition {
  if (phase.kind === 'work' || phase.kind === 'rest') {
    return { round: phase.round ?? 1, cycle: phase.cycle ?? 1 }
  }
  if (phase.kind === 'cycleRest') {
    return { round: workout.rounds, cycle: phase.cycle ?? 1 }
  }
  if (phase.kind === 'cooldown') {
    return { round: workout.rounds, cycle: workout.cycles }
  }
  return { round: 1, cycle: 1 }
}

export function workoutDurationMs(phases: Phase[]): number {
  return phases.reduce((total, phase) => total + phase.durationMs, 0)
}

/** Time still to go, including the rest of the current phase. */
export function workoutRemainingMs(
  phases: Phase[],
  phaseIndex: number,
  phaseRemainingMs: number,
): number {
  let remaining = Math.max(0, phaseRemainingMs)
  for (let index = phaseIndex + 1; index < phases.length; index += 1) {
    remaining += phases[index].durationMs
  }
  return remaining
}

/** 0 at the start of the workout, 1 when it is finished. */
export function workoutElapsedRatio(
  phases: Phase[],
  phaseIndex: number,
  phaseRemainingMs: number,
): number {
  const total = workoutDurationMs(phases)
  if (total <= 0) return 1
  const left = workoutRemainingMs(phases, phaseIndex, phaseRemainingMs)
  return Math.min(1, Math.max(0, (total - left) / total))
}
