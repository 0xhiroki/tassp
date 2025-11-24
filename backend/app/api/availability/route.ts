import { DEMO_USER_ID } from '@/lib/constants'
import { badRequest, ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { assertNumber } from '@/lib/validation'
import { ensureDemoUser } from '@/lib/demo-user'

type AvailabilityPayload = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export async function GET() {
  try {
    await ensureDemoUser()
    const windows = await prisma.availabilityWindow.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    })

    return ok(windows)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export async function PUT(request: Request) {
  try {
    await ensureDemoUser()
    const existingWindows = await prisma.availabilityWindow.findMany({
      where: { userId: DEMO_USER_ID },
      select: { dayOfWeek: true, startTime: true, endTime: true }
    })
    const body = await request.json()
    const windows: AvailabilityPayload[] = body.windows

    if (!Array.isArray(windows)) {
      return badRequest('windows must be an array')
    }

    const normalized = windows.map((window, index) => {
      const dayOfWeek = assertNumber(window.dayOfWeek, `windows[${index}].dayOfWeek`)
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        throw new Error('dayOfWeek must be between 0 and 6')
      }

      if (typeof window.startTime !== 'string' || typeof window.endTime !== 'string') {
        throw new Error('startTime and endTime must be strings in HH:MM format')
      }

      return {
        dayOfWeek,
        startTime: window.startTime,
        endTime: window.endTime
      }
    })

    const seen = new Set<string>()
    normalized.forEach((window) => {
      const key = `${window.dayOfWeek}-${window.startTime}-${window.endTime}`
      if (seen.has(key)) {
        throw new Error('Duplicate availability windows are not allowed')
      }
      seen.add(key)
    })

    await prisma.$transaction([
      prisma.availabilityWindow.deleteMany({ where: { userId: DEMO_USER_ID } }),
      prisma.availabilityWindow.createMany({
        data: normalized.map((window) => ({ ...window, userId: DEMO_USER_ID }))
      })
    ])

    const removedWindows = findRemovedWindows(existingWindows, normalized)
    let removedSessionCount = 0
    if (removedWindows.length > 0) {
      const sessions = await prisma.session.findMany({
        where: { userId: DEMO_USER_ID },
        select: { id: true, startTime: true }
      })
      const removable = sessions.filter((session) => conflictsWithRemovedWindow(session.startTime, removedWindows)).map((session) => session.id)
      if (removable.length > 0) {
        const result = await prisma.session.deleteMany({ where: { id: { in: removable } } })
        removedSessionCount = result.count
      }
    }

    return ok({ success: true, removedSessionCount })
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message)
    }
    return serverError()
  }
}

function findRemovedWindows(
  previous: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  next: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
) {
  const nextKeys = new Set(next.map((window) => buildKey(window)))
  return previous.filter((window) => !nextKeys.has(buildKey(window)))
}

function buildKey(window: { dayOfWeek: number; startTime: string; endTime: string }) {
  return `${window.dayOfWeek}-${window.startTime}-${window.endTime}`
}

function conflictsWithRemovedWindow(date: Date, windows: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) {
  const sessionDate = new Date(date)
  const sessionDay = sessionDate.getDay()
  const sessionMinutes = sessionDate.getHours() * 60 + sessionDate.getMinutes()
  return windows.some((window) => {
    if (window.dayOfWeek !== sessionDay) return false
    const start = timeToMinutes(window.startTime)
    const end = timeToMinutes(window.endTime)
    return sessionMinutes >= start && sessionMinutes < end
  })
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}
