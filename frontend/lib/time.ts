const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})

type TimeParts = {
  time: string
  meridiem: string
}

function getTimeParts(date: Date): TimeParts {
  const parts = TIME_FORMATTER.formatToParts(date)
  const hourPart = parts.find((part) => part.type === 'hour')?.value ?? ''
  const minutePart = parts.find((part) => part.type === 'minute')?.value ?? '00'
  const meridiemPart = parts.find((part) => part.type === 'dayPeriod')?.value ?? ''
  const hour = hourPart.padStart(2, '0')
  const minute = minutePart.padStart(2, '0')
  return {
    time: `${hour}:${minute}`,
    meridiem: meridiemPart.toUpperCase()
  }
}

export function formatTimeRange(startIso: string, durationMinutes: number) {
  const start = new Date(startIso)
  const end = new Date(startIso)
  end.setMinutes(end.getMinutes() + durationMinutes)
  const startParts = getTimeParts(start)
  const endParts = getTimeParts(end)
  if (startParts.meridiem && startParts.meridiem === endParts.meridiem) {
    return `${startParts.time}-${endParts.time}${startParts.meridiem}`
  }
  return `${startParts.time}${startParts.meridiem}-${endParts.time}${endParts.meridiem}`
}

export function formatTime(date: Date) {
  const parts = getTimeParts(date)
  return `${parts.time}${parts.meridiem}`
}

export function formatShortAvailability(dayOfWeek: number, start: string, end: string) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const startParts = getTimePartsFromTimeString(start)
  const endParts = getTimePartsFromTimeString(end)
  const range = startParts.meridiem && startParts.meridiem === endParts.meridiem
    ? `${startParts.time}-${endParts.time}${startParts.meridiem}`
    : `${startParts.time}${startParts.meridiem}-${endParts.time}${endParts.meridiem}`
  return `${days[dayOfWeek]} ${range}`
}

function getTimePartsFromTimeString(value: string): TimeParts {
  const [hour, minute] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return getTimeParts(date)
}
