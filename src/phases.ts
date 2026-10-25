import type { PhaseKind } from './types.ts'

/** Screen color and text color for each phase. Text is chosen so it stays readable. */
export const PHASE_META: Record<
  PhaseKind,
  { label: string; color: string; ink: string }
> = {
  prepare: { label: 'Prepare', color: '#3B82F6', ink: '#0A0A0A' },
  work: { label: 'Work', color: '#FF6B00', ink: '#0A0A0A' },
  rest: { label: 'Rest', color: '#14B8A6', ink: '#0A0A0A' },
  cycleRest: { label: 'Cycle rest', color: '#8B5CF6', ink: '#FFFFFF' },
  cooldown: { label: 'Cooldown', color: '#64748B', ink: '#FFFFFF' },
}
