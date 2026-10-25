import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

interface StepperProps {
  label: string
  hint: string
  value: string
  swatch: string
  atMin: boolean
  atMax: boolean
  onStep: (delta: number) => void
}

export function Stepper({ label, hint, value, swatch, atMin, atMax, onStep }: StepperProps) {
  return (
    <section className="rounded-3xl bg-zinc-900 px-3 py-3">
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
        <h2 className="text-xl font-black leading-none">{label}</h2>
      </div>
      <p className="mt-1 text-sm leading-snug text-zinc-400">{hint}</p>
      <div className="mt-2 flex items-center gap-3">
        <HoldButton label={`Decrease ${label}`} sign="−" delta={-1} blocked={atMin} onStep={onStep} />
        <p className="min-w-0 flex-1 text-center text-[clamp(2rem,9vw,3rem)] font-black tabular-nums leading-none">
          {value}
        </p>
        <HoldButton label={`Increase ${label}`} sign="+" delta={1} blocked={atMax} onStep={onStep} />
      </div>
    </section>
  )
}

function HoldButton({
  label,
  sign,
  delta,
  blocked,
  onStep,
}: {
  label: string
  sign: string
  delta: number
  blocked: boolean
  onStep: (delta: number) => void
}) {
  const repeatRef = useRef<number | null>(null)
  const delayRef = useRef<number | null>(null)
  const fromPointerRef = useRef(false)

  useEffect(() => {
    return () => {
      if (delayRef.current !== null) window.clearTimeout(delayRef.current)
      if (repeatRef.current !== null) window.clearInterval(repeatRef.current)
    }
  }, [])

  function stop() {
    if (delayRef.current !== null) window.clearTimeout(delayRef.current)
    if (repeatRef.current !== null) window.clearInterval(repeatRef.current)
    delayRef.current = null
    repeatRef.current = null
  }

  function start() {
    if (blocked) return
    stop()
    onStep(delta)
    let ticks = 0
    delayRef.current = window.setTimeout(() => {
      repeatRef.current = window.setInterval(() => {
        ticks += 1
        const size = ticks > 24 ? 5 : 1
        onStep(delta > 0 ? size : -size)
      }, 60)
    }, 350)
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (blocked) return
    event.preventDefault()
    fromPointerRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    start()
  }

  function handlePointerUp() {
    stop()
    window.setTimeout(() => {
      fromPointerRef.current = false
    }, 0)
  }

  function handleClick() {
    if (fromPointerRef.current) {
      fromPointerRef.current = false
      return
    }
    if (blocked) return
    onStep(delta)
  }

  function handleContextMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={`h-16 w-16 shrink-0 touch-none rounded-2xl bg-zinc-800 text-4xl font-black leading-none active:bg-zinc-700 ${blocked ? 'opacity-30' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={stop}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {sign}
    </button>
  )
}
