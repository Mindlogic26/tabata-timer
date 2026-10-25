import { registerSW } from 'virtual:pwa-register'

// A new version must not refresh the screen in the middle of a workout.
// The timer lives in memory, so a reload would throw away the time left.
let workoutInProgress = false
let updateWaiting = false
let reloading = false

export function setWorkoutInProgress(inProgress: boolean) {
  workoutInProgress = inProgress
  if (!inProgress) applyWaitingUpdate()
}

function applyWaitingUpdate() {
  if (!updateWaiting || workoutInProgress || reloading) return
  reloading = true
  window.location.reload()
}

function updateIsReady() {
  updateWaiting = true
  applyWaitingUpdate()
}

function checkForServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker
    .getRegistration()
    .then((registration) => registration?.update())
    .catch(() => undefined)
}

function watchForAppUpdates() {
  if (!('serviceWorker' in navigator)) return

  // Launch: look for a new version as soon as this page opens.
  checkForServiceWorkerUpdate()

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForServiceWorkerUpdate()
  })

  // Ignore the very first time a service worker takes over a page that had none.
  // That is the install, not a new version of an app the phone already has.
  const hadController = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) updateIsReady()
  })

  registerSW({
    immediate: true,
    onNeedReload: updateIsReady,
    onRegisteredSW() {
      checkForServiceWorkerUpdate()
    },
  })
}

watchForAppUpdates()
