import { hasOverlap } from '@/lib/overlap'

type SessionTypeInfo = {
  id: string
  name: string
  priority: number
}

type AvailabilityWindowInfo = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

type ExistingSessionInfo = {
  id: string
  startTime: Date
  durationMinutes: number
  sessionTypeId: string
  priority: number
}

type Candidate = {
  id: string
  sessionType: SessionTypeInfo
  startTime: Date
  durationMinutes: number
  dayKey: string
  windowLabel: string
  spacingHours: number
  priorityLoad: number
  score: number
}

export type PlannedSuggestion = {
  sessionTypeId: string
  sessionTypeName: string
  priority: number
  startTime: Date
  durationMinutes: number
  reason: string
}

type SuggestionPlanInput = {
  sessionTypes: SessionTypeInfo[]
  availability: AvailabilityWindowInfo[]
  sessions: ExistingSessionInfo[]
  targetCount: number
  maxDayLookahead: number
  now?: Date
}

const HIGH_PRIORITY_THRESHOLD = 4
const MAX_HIGH_PRIORITY_PER_DAY = 2
const MIN_SLOT_MINUTES = 30
const SLOT_ROUNDING_MINUTES = 15
const PRIORITY_DURATION: Record<number, number> = {
  5: 90,
  4: 75,
  3: 60,
  2: 45,
  1: 30
}
const MIN_GAP_HOURS: Record<number, number> = {
  5: 30,
  4: 24,
  3: 18,
  2: 12,
  1: 8
}

export function buildSuggestionPlan(input: SuggestionPlanInput): PlannedSuggestion[] {
  const now = input.now ?? new Date()
  const sessionTypes = [...input.sessionTypes]
  if (sessionTypes.length === 0 || input.availability.length === 0) {
    return []
  }

  sessionTypes.sort((a, b) => b.priority - a.priority)
  const availabilityByDay = groupAvailabilityByDay(input.availability)
  const existingSessions = input.sessions.map((session) => ({
    id: session.id,
    startTime: session.startTime,
    durationMinutes: session.durationMinutes
  }))
  const highPriorityCountByDay = seedHighPriorityLoad(input.sessions)
  const lastSessionByType = seedLastSessionByType(input.sessions)

  const candidates: Candidate[] = []

  for (let dayOffset = 0; dayOffset < input.maxDayLookahead; dayOffset++) {
    const date = new Date(now)
    date.setDate(now.getDate() + dayOffset)
    const dayOfWeek = date.getDay()
    const windows = availabilityByDay.get(dayOfWeek)
    if (!windows) continue

    for (const window of windows) {
      const slotStart = combine(date, window.startTime)
      if (slotStart < now) continue
      const windowEnd = combine(date, window.endTime)
      const windowMinutes = minutesBetween(slotStart, windowEnd)
      if (windowMinutes < MIN_SLOT_MINUTES) continue

      const dayKey = getDayKey(slotStart)
      const priorityLoad = highPriorityCountByDay.get(dayKey) ?? 0

      for (const sessionType of sessionTypes) {
        const durationMinutes = resolveDuration(sessionType.priority, windowMinutes)
        if (!durationMinutes) continue
        if (hasOverlap(existingSessions, slotStart, durationMinutes)) continue

        const minGapHours = getMinGapHours(sessionType.priority)
        const lastSession = lastSessionByType.get(sessionType.id)
        const spacingHours = lastSession ? hoursBetween(lastSession, slotStart) : Number.POSITIVE_INFINITY
        if (spacingHours < minGapHours) continue

        const score = scoreCandidate({
          sessionType,
          priorityLoad,
          spacingHours,
          durationMinutes
        })

        candidates.push({
          id: `${sessionType.id}-${slotStart.toISOString()}`,
          sessionType,
          startTime: slotStart,
          durationMinutes,
          dayKey,
          windowLabel: `${window.startTime}-${window.endTime}`,
          spacingHours,
          priorityLoad,
          score
        })
      }
    }
  }

  if (candidates.length === 0) {
    return []
  }

  candidates.sort((a, b) => b.score - a.score)

  const selected: Candidate[] = []
  const projectedSessions = [...existingSessions]
  const projectedHighPriority = new Map(highPriorityCountByDay)
  const projectedLastSession = new Map(lastSessionByType)

  for (const candidate of candidates) {
    if (selected.length >= input.targetCount) break

    const minGapHours = getMinGapHours(candidate.sessionType.priority)
    const lastProjected = projectedLastSession.get(candidate.sessionType.id)
    if (lastProjected && hoursBetween(lastProjected, candidate.startTime) < minGapHours) {
      continue
    }

    if (candidate.sessionType.priority >= HIGH_PRIORITY_THRESHOLD) {
      const projectedCount = projectedHighPriority.get(candidate.dayKey) ?? 0
      if (projectedCount >= MAX_HIGH_PRIORITY_PER_DAY) {
        continue
      }
    }

    if (hasOverlap(projectedSessions, candidate.startTime, candidate.durationMinutes)) {
      continue
    }

    selected.push(candidate)
    projectedSessions.push({
      id: candidate.id,
      startTime: candidate.startTime,
      durationMinutes: candidate.durationMinutes
    })
    projectedLastSession.set(candidate.sessionType.id, candidate.startTime)

    if (candidate.sessionType.priority >= HIGH_PRIORITY_THRESHOLD) {
      const projectedCount = projectedHighPriority.get(candidate.dayKey) ?? 0
      projectedHighPriority.set(candidate.dayKey, projectedCount + 1)
    }
  }

  return selected.map((candidate) => ({
    sessionTypeId: candidate.sessionType.id,
    sessionTypeName: candidate.sessionType.name,
    priority: candidate.sessionType.priority,
    startTime: candidate.startTime,
    durationMinutes: candidate.durationMinutes,
    reason: buildReason(candidate)
  }))
}

function groupAvailabilityByDay(windows: AvailabilityWindowInfo[]) {
  return windows.reduce<Map<number, AvailabilityWindowInfo[]>>((map, window) => {
    const next = map.get(window.dayOfWeek) ?? []
    next.push(window)
    map.set(window.dayOfWeek, next)
    return map
  }, new Map())
}

function seedHighPriorityLoad(sessions: ExistingSessionInfo[]) {
  return sessions.reduce<Map<string, number>>((map, session) => {
    if (session.priority < HIGH_PRIORITY_THRESHOLD) {
      return map
    }
    const dayKey = getDayKey(session.startTime)
    const current = map.get(dayKey) ?? 0
    map.set(dayKey, current + 1)
    return map
  }, new Map())
}

function seedLastSessionByType(sessions: ExistingSessionInfo[]) {
  const tracker = new Map<string, Date>()
  for (const session of sessions) {
    const existing = tracker.get(session.sessionTypeId)
    if (!existing || session.startTime > existing) {
      tracker.set(session.sessionTypeId, session.startTime)
    }
  }
  return tracker
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function hoursBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60)
}

function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60)
}

function resolveDuration(priority: number, windowMinutes: number) {
  const preferred = PRIORITY_DURATION[priority] ?? 60
  const capped = Math.min(preferred, windowMinutes)
  const rounded = Math.floor(capped / SLOT_ROUNDING_MINUTES) * SLOT_ROUNDING_MINUTES
  if (rounded < MIN_SLOT_MINUTES) {
    return null
  }
  return rounded
}

function getMinGapHours(priority: number) {
  return MIN_GAP_HOURS[priority] ?? MIN_GAP_HOURS[3]
}

function scoreCandidate(args: {
  sessionType: SessionTypeInfo
  priorityLoad: number
  spacingHours: number
  durationMinutes: number
}) {
  const priorityWeight = args.sessionType.priority / 5
  const spacingBoost = Math.min(args.spacingHours / 48, 1)
  const loadPenalty = args.sessionType.priority >= HIGH_PRIORITY_THRESHOLD ? args.priorityLoad * 0.4 : 0
  const durationBonus = args.durationMinutes >= 75 ? 0.1 : 0
  return priorityWeight * 2 + spacingBoost + durationBonus - loadPenalty
}

function buildReason(candidate: Candidate) {
  const reasonParts = [`Fits ${candidate.windowLabel} availability`]

  if (candidate.sessionType.priority >= HIGH_PRIORITY_THRESHOLD) {
    if (candidate.priorityLoad === 0) {
      reasonParts.push('keeps high-priority work balanced')
    } else {
      reasonParts.push('avoids stacking too many intense blocks')
    }
  }

  if (Number.isFinite(candidate.spacingHours)) {
    const rounded = Math.max(1, Math.round(candidate.spacingHours))
    reasonParts.push(`spaced ${rounded}h from your last ${candidate.sessionType.name}`)
  }

  return reasonParts.join('; ')
}

function combine(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(date)
  next.setHours(hours, minutes, 0, 0)
  return next
}
