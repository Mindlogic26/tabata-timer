/** Menu-sized length, such as "45s" or "4:10". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes === 0) return `${rest}s`
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

/** Big countdown. Under a minute this is only the seconds, which is easier to read from across the room. */
export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return String(totalSeconds)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/** Editor value. Zero means that phase is left out. */
export function formatSetting(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Off'
  return formatDuration(totalSeconds)
}
