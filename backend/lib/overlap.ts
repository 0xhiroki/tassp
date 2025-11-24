import { Session } from '@prisma/client'

export function hasOverlap(
  sessions: Pick<Session, 'id' | 'startTime' | 'durationMinutes'>[],
  candidateStart: Date,
  candidateDurationMinutes: number,
  ignoreId?: string
) {
  const candidateEnd = addMinutes(candidateStart, candidateDurationMinutes)

  return sessions.some((session) => {
    if (ignoreId && session.id === ignoreId) return false
    const existingStart = new Date(session.startTime)
    const existingEnd = addMinutes(existingStart, session.durationMinutes)
    return candidateStart < existingEnd && existingStart < candidateEnd
  })
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}
