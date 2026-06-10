import { format, isValid, parseISO } from "date-fns"

/** Parse YYYY-MM-DD as a local calendar date (no timezone shift). */
export function parseMilestoneDate(value?: string): Date | undefined {
  if (!value?.trim()) return undefined

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined

    const local = new Date(year, month - 1, day)
    if (!isValid(local)) return undefined
    if (
      local.getFullYear() !== year ||
      local.getMonth() !== month - 1 ||
      local.getDate() !== day
    ) {
      return undefined
    }
    return local
  }

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

export function toMilestoneDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/** Compact label for the date picker button. */
export function formatMilestoneButtonDate(value?: string): string {
  const date = parseMilestoneDate(value)
  if (!date) return "Pick a date"
  return format(date, "MMM d, yyyy")
}

/** Longer label for summaries and task context. */
export function formatMilestoneDisplayDate(value?: string): string {
  const date = parseMilestoneDate(value)
  if (!date) return ""
  return format(date, "MMM d, yyyy")
}

export function formatMilestoneRangeLabel(startDate?: string, endDate?: string): string {
  const start = formatMilestoneDisplayDate(startDate)
  const end = formatMilestoneDisplayDate(endDate)
  if (start && end) return `${start} – ${end}`
  if (start) return `from ${start}`
  if (end) return `by ${end}`
  return ""
}

/** Keep start/end in chronological order when both are set. */
export function normalizeMilestoneDateRange(
  startDate?: string,
  endDate?: string
): { startDate: string; endDate: string } {
  const start = startDate?.trim() || ""
  const end = endDate?.trim() || ""
  if (!start || !end) return { startDate: start, endDate: end }

  const startParsed = parseMilestoneDate(start)
  const endParsed = parseMilestoneDate(end)
  if (!startParsed || !endParsed) return { startDate: start, endDate: end }
  if (startParsed <= endParsed) return { startDate: start, endDate: end }

  return { startDate: end, endDate: start }
}
