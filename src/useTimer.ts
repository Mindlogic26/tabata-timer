import { useCallback, useEffect, useRef, useState } from 'react'
import { playLongBeep, playShortBeep, resumeAudio } from './audio.ts'
import type { Phase } from './types.ts'
import {
  createTimerState,
  cueForTransition,
  needsRender,
  pauseTimer,
  resumeTimer,
  skipPhase,
  tickTimer,
  type TimerState,
} from './timer-engine.ts'
import { releaseWakeLock, requestWakeLock } from './wake-lock.ts'

export function useTimer(phases: Phase[]) {
  const [timer, setTimer] = useState(() => createTimerState(phases, Date.now()))
  const stateRef = useRef(timer)

  const commit = useCallback((prev: TimerState, next: TimerState) => {
    const cue = cueForTransition(prev, next)
    if (cue === 'long') playLongBeep()
    else if (cue === 'short') playShortBeep()
    stateRef.current = next
    setTimer(next)
  }, [])

  useEffect(() => {
    if (timer.status !== 'running') {
      void releaseWakeLock()
      return
    }

    void requestWakeLock()

    const id = window.setInterval(() => {
      const prev = stateRef.current
      if (prev.status !== 'running') return
      const next = tickTimer(prev, phases, Date.now())
      if (needsRender(prev, next)) commit(prev, next)
    }, 100)

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      void requestWakeLock()
      resumeAudio()
      const prev = stateRef.current
      if (prev.status !== 'running') return
      const next = tickTimer(prev, phases, Date.now())
      if (needsRender(prev, next)) commit(prev, next)
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      void releaseWakeLock()
    }
  }, [timer.status, phases, commit])

  const pause = useCallback(() => {
    const prev = stateRef.current
    commit(prev, pauseTimer(prev, Date.now()))
  }, [commit])

  const resume = useCallback(() => {
    resumeAudio()
    const prev = stateRef.current
    commit(prev, resumeTimer(prev, Date.now()))
  }, [commit])

  const skip = useCallback(() => {
    resumeAudio()
    const prev = stateRef.current
    commit(prev, skipPhase(prev, phases, Date.now()))
  }, [commit, phases])

  return { timer, pause, resume, skip }
}
