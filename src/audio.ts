// Beeps are generated with the Web Audio API, so there are no sound files.
// iPhone will not play audio until the user taps something. Start must call
// playStartCue() directly from the button press, before any waiting.

let audioContext: AudioContext | null = null

function audioConstructor(): typeof AudioContext | null {
  if (typeof window.AudioContext === 'function') return window.AudioContext
  const legacy = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return typeof legacy === 'function' ? legacy : null
}

function getOrCreateContext(): AudioContext | null {
  if (audioContext) return audioContext
  const Context = audioConstructor()
  if (!Context) return null
  audioContext = new Context()
  return audioContext
}

/** Call this from a tap so later beeps are allowed to play. */
export function unlockAudio(): void {
  const context = getOrCreateContext()
  if (!context) return
  if (context.state !== 'running') void context.resume()

  const buffer = context.createBuffer(1, 1, context.sampleRate)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(0)
}

export function resumeAudio(): void {
  if (audioContext && audioContext.state === 'suspended') void audioContext.resume()
}

function playTone(
  frequency: number,
  durationSeconds: number,
  gainValue: number,
): void {
  const context = getOrCreateContext()
  if (!context) return

  const startTone = () => {
    const startAt = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startAt)
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + durationSeconds + 0.02)
  }

  if (context.state === 'running') startTone()
  else void context.resume().then(startTone).catch(() => {})
}

/** Last 3 seconds of a phase. */
export function playShortBeep(): void {
  playTone(988, 0.1, 0.45)
}

/** Phase change, skip, or the end of the workout. */
export function playLongBeep(): void {
  playTone(523.25, 0.48, 0.4)
  playTone(659.25, 0.48, 0.28)
}

/** Unlock iPhone audio and play the opening beep. Must run inside the Start tap. */
export function playStartCue(): void {
  unlockAudio()
  playLongBeep()
}
