import type { Phase, PhaseKind, Workout } from './types.ts'

// Builds the ordered list of phases for a workout.
// A phase set to 0 seconds is left out.
//
// Order:
//   1. Prepare, once at the start
//   2. For every cycle: each round is work, then rest
//   3. After every cycle except the last: rest between cycles
//   4. Cooldown, once at the end

export interface PhaseProgress {
  roundsLeft: number
  cyclesLeft: number
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

/** How many rounds and cycles are still ahead, counting the one in progress. */
export function getProgress(phase: Phase, workout: Workout): PhaseProgress {
  if (phase.kind === 'prepare') {
    return { roundsLeft: workout.rounds, cyclesLeft: workout.cycles }
  }
  if (phase.kind === 'work' || phase.kind === 'rest') {
    return {
      roundsLeft: workout.rounds - (phase.round ?? 1) + 1,
      cyclesLeft: workout.cycles - (phase.cycle ?? 1) + 1,
    }
  }
  if (phase.kind === 'cycleRest') {
    return {
      roundsLeft: workout.rounds,
      cyclesLeft: workout.cycles - (phase.cycle ?? 1),
    }
  }
  return { roundsLeft: 0, cyclesLeft: 0 }
}
