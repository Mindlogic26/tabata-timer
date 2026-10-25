// Asks the phone to keep the screen on during a workout.
// The browser drops this permission when you leave the page, so the timer
// asks again each time the page becomes visible.

let sentinel: WakeLockSentinel | null = null
let requestId = 0

export function wakeLockSupported(): boolean {
  return 'wakeLock' in navigator
}

export async function requestWakeLock(): Promise<void> {
  if (!wakeLockSupported()) return
  if (sentinel && !sentinel.released) return

  const id = ++requestId
  try {
    const next = await navigator.wakeLock.request('screen')
    if (id !== requestId) {
      await next.release()
      return
    }
    sentinel = next
    next.addEventListener('release', () => {
      if (sentinel === next) sentinel = null
    })
  } catch {
    if (id === requestId) sentinel = null
  }
}

export async function releaseWakeLock(): Promise<void> {
  requestId += 1
  if (!sentinel) return
  const current = sentinel
  sentinel = null
  try {
    await current.release()
  } catch {
    // Already released by the browser.
  }
}
