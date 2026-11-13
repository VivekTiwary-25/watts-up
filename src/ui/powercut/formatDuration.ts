/** Hours as "1h 30m", "15m", or "5h 26m". Non-finite input is "—". */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours)) return '—'
  const totalMinutes = Math.round(Math.max(0, hours) * 60)
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (wholeHours === 0) return `${minutes}m`
  if (minutes === 0) return `${wholeHours}h`
  return `${wholeHours}h ${minutes}m`
}

/** One-line backup comparison. Equal to the nearest minute counts as the same. */
export function backupComparison(userHours: number, bestHours: number): string {
  if (!Number.isFinite(userHours) || !Number.isFinite(bestHours)) return 'Backup time unavailable'
  const diffMinutes = Math.round((userHours - bestHours) * 60)
  if (diffMinutes === 0) return 'Same backup time as the best combo'
  const span = formatDuration(Math.abs(diffMinutes) / 60)
  return diffMinutes < 0 ? `Yours lasts ${span} less` : `Yours lasts ${span} longer`
}
