import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { DEMO_USER_ID } from '@/lib/constants'
import { ensureDemoUser } from '@/lib/demo-user'
import { refreshSuggestionCache } from '@/app/api/suggestions/route'

const SESSION_TARGET = 10
const MAX_DAY_LOOKAHEAD = 30

const sessionTypeSeeds = [
  { name: 'Focus Block', category: 'Deep Work', priority: 3, color: '#D8F0FF', icon: 'bullseye' },
  { name: 'Team Sync', category: 'Collaboration', priority: 2, color: '#FEE4E2', icon: 'handshake' },
  { name: 'Client Prep', category: 'Client', priority: 2, color: '#FFF3C4', icon: 'briefcase' },
  { name: 'Product Research', category: 'Strategy', priority: 1, color: '#E0FFE7', icon: 'lightbulb' },
  { name: 'Learning Sprint', category: 'Growth', priority: 1, color: '#F5E8FF', icon: 'book' }
]

const availabilitySeeds = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '11:30' },
  { dayOfWeek: 1, startTime: '13:30', endTime: '16:30' },
  { dayOfWeek: 2, startTime: '10:00', endTime: '12:30' },
  { dayOfWeek: 2, startTime: '15:00', endTime: '17:30' },
  { dayOfWeek: 3, startTime: '09:30', endTime: '12:00' },
  { dayOfWeek: 3, startTime: '14:30', endTime: '17:00' },
  { dayOfWeek: 4, startTime: '09:00', endTime: '11:00' },
  { dayOfWeek: 4, startTime: '13:00', endTime: '15:30' },
  { dayOfWeek: 5, startTime: '09:00', endTime: '11:30' },
  { dayOfWeek: 5, startTime: '13:00', endTime: '15:00' }
]

const descriptionPool = [
  'Write first draft of the sprint narrative.',
  'Reconcile CRM notes before outreach.',
  'Audit product metrics for anomalies.',
  'Prep agenda and docs for the sync.',
  'Curate inspiration for upcoming launch.',
  'Tag follow-ups and queue replies.',
  'Pair review on blockers from last retro.',
  'Summarize insights to share with the team.'
]

async function main() {
  console.log('Resetting demo data…')
  await ensureDemoUser()

  await prisma.suggestion.deleteMany({ where: { userId: DEMO_USER_ID } })
  await prisma.session.deleteMany({ where: { userId: DEMO_USER_ID } })
  await prisma.sessionType.deleteMany({ where: { userId: DEMO_USER_ID } })
  await prisma.availabilityWindow.deleteMany({ where: { userId: DEMO_USER_ID } })

  const sessionTypes = await Promise.all(
    sessionTypeSeeds.map((seed) =>
      prisma.sessionType.create({ data: { ...seed, userId: DEMO_USER_ID } })
    )
  )

  await prisma.availabilityWindow.createMany({
    data: availabilitySeeds.map((window) => ({ ...window, userId: DEMO_USER_ID }))
  })

  const availability = await prisma.availabilityWindow.findMany({
    where: { userId: DEMO_USER_ID }
  })

  const sessions = buildSessions(sessionTypes, availability)
  await prisma.session.createMany({ data: sessions })

  const suggestions = await refreshSuggestionCache()

  const [sessionTypeCount, availabilityCount, sessionCount] = await Promise.all([
    prisma.sessionType.count({ where: { userId: DEMO_USER_ID } }),
    prisma.availabilityWindow.count({ where: { userId: DEMO_USER_ID } }),
    prisma.session.count({ where: { userId: DEMO_USER_ID } })
  ])

  console.log(`Seeded ${sessionTypeCount} session types, ${availabilityCount} availability windows, and ${sessionCount} sessions.`)
  console.log(`Refreshed ${suggestions.length} smart suggestions.`)
}

function buildSessions(
  sessionTypes: { id: string }[],
  windows: { dayOfWeek: number; startTime: string; endTime: string }[]
) {
  const durations = [90, 60, 45, 75, 60]
  const sessions: Prisma.SessionCreateManyInput[] = []
  const now = new Date()
  const today = startOfDay(now)

  for (let dayOffset = 0; dayOffset < MAX_DAY_LOOKAHEAD && sessions.length < SESSION_TARGET; dayOffset += 1) {
    const date = addDays(today, dayOffset)
    const dayOfWeek = date.getDay()
    const dayWindows = windows.filter((window) => window.dayOfWeek === dayOfWeek)
    if (dayWindows.length === 0) continue

    for (const window of dayWindows) {
      if (sessions.length >= SESSION_TARGET) break
      const type = sessionTypes[sessions.length % sessionTypes.length]
      const durationMinutes = durations[sessions.length % durations.length]

      const windowStart = combine(date, window.startTime)
      const windowEnd = combine(date, window.endTime)
      if (windowEnd <= now) continue

      let start = windowStart
      if (start <= now) {
        const adjusted = addMinutes(now, 30)
        if (adjusted >= windowEnd) {
          continue
        }
        start = adjusted
      }

      const end = addMinutes(start, durationMinutes)
      if (end > windowEnd) {
        const shiftedStart = addMinutes(windowEnd, -durationMinutes)
        if (shiftedStart < windowStart) {
          continue
        }
        start = shiftedStart
      }

      sessions.push({
        userId: DEMO_USER_ID,
        sessionTypeId: type.id,
        startTime: start,
        durationMinutes,
        description: descriptionPool[sessions.length % descriptionPool.length]
      })
    }
  }

  ensureTodaySessions(sessions, sessionTypes, now, windows)

  if (sessions.length < SESSION_TARGET) {
    throw new Error(`Unable to generate ${SESSION_TARGET} sessions with the current availability windows.`)
  }

  return sessions.slice(0, SESSION_TARGET)
}

function ensureTodaySessions(
  sessions: Prisma.SessionCreateManyInput[],
  sessionTypes: { id: string }[],
  now: Date,
  windows: { dayOfWeek: number; startTime: string; endTime: string }[]
) {
  const today = startOfDay(now)
  const hasToday = sessions.some((session) => isSameDay(new Date(session.startTime as Date), today))
  if (hasToday) return

  const fallbackType = sessionTypes[0]
  if (!fallbackType) return

  const todaysWindows = windows.filter((window) => window.dayOfWeek === today.getDay())
  if (todaysWindows.length === 0) return

  const maxSlots = Math.min(2, todaysWindows.length)
  for (let i = 0; i < maxSlots; i += 1) {
    const window = todaysWindows[i]
    const windowStart = combine(today, window.startTime)
    const windowEnd = combine(today, window.endTime)
    if (windowEnd <= now) continue

    let slotStart = windowStart
    if (slotStart <= now) {
      const adjusted = addMinutes(now, 30 + i * 30)
      if (adjusted >= windowEnd) continue
      slotStart = adjusted
    }

    const slotEnd = addMinutes(slotStart, 60)
    if (slotEnd > windowEnd) {
      const shiftedStart = addMinutes(windowEnd, -60)
      if (shiftedStart < windowStart) continue
      slotStart = shiftedStart
    }

    sessions.unshift({
      userId: DEMO_USER_ID,
      sessionTypeId: fallbackType.id,
      startTime: slotStart,
      durationMinutes: 60,
      description: descriptionPool[(sessions.length + i) % descriptionPool.length]
    })
  }
}

function combine(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(date)
  next.setHours(hours, minutes, 0, 0)
  return next
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

main()
  .then(() => {
    console.log('Demo data reset complete.')
  })
  .catch((error) => {
    console.error('Failed to reset demo data:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
