import { NextResponse } from 'next/server'
import { DEMO_USER_ID } from '@/lib/constants'
import { badRequest, ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { ensureDemoUser } from '@/lib/demo-user'
import { assertDate, assertNumber, assertString } from '@/lib/validation'
import { trackSessionCreated } from '@/lib/analytics'

export async function GET(request: Request) {
  try {
    await ensureDemoUser()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const sessions = await prisma.session.findMany({
      where: {
        userId: DEMO_USER_ID,
        ...(status ? { completedAt: status === 'completed' ? { not: null } : null } : {})
      },
      orderBy: { startTime: 'asc' },
      include: { sessionType: true }
    })

    return ok(sessions)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export async function POST(request: Request) {
  try {
    await ensureDemoUser()
    const body = await request.json()
    const sessionTypeId = assertString(body.sessionTypeId, 'sessionTypeId')
    const startTime = assertDate(body.startTime, 'startTime')
    const durationMinutes = assertNumber(body.durationMinutes, 'durationMinutes')
    if (durationMinutes <= 0) {
      return badRequest('Duration must be greater than zero')
    }
    const description = body.description ? assertString(body.description, 'description') : ''
    const allowConflicts = Boolean(body.allowConflicts)

    const sessionType = await prisma.sessionType.findFirst({ where: { id: sessionTypeId, userId: DEMO_USER_ID } })
    if (!sessionType) {
      return badRequest('Session type not found')
    }

    const availability = await prisma.availabilityWindow.findMany({ where: { userId: DEMO_USER_ID } })
    if (!isWithinAvailability(availability, startTime, durationMinutes)) {
      return badRequest('Selected time is outside your availability windows')
    }

    const existingSessions = await prisma.session.findMany({
      where: { userId: DEMO_USER_ID },
      include: { sessionType: true }
    })

    const conflicts = existingSessions.filter((session) => hasOverlap(session, startTime, durationMinutes))
    if (conflicts.length > 0 && !allowConflicts) {
      const conflictSummaries = conflicts
        .filter((session): session is typeof session => Boolean(session))
        .map((session) => {
          const relation = session.sessionType
          return {
            id: session.id,
            startTime: session.startTime,
            durationMinutes: session.durationMinutes,
            sessionTypeName: relation?.name ?? 'Session'
          }
        })

      return NextResponse.json(
        {
          error: 'Requested time overlaps with existing sessions',
          conflicts: conflictSummaries
        },
        { status: 409 }
      )
    }

    const created = await prisma.session.create({
      data: {
        userId: DEMO_USER_ID,
        sessionTypeId,
        description,
        startTime,
        durationMinutes
      },
      include: { sessionType: true }
    })

    await trackSessionCreated({ sessionId: created.id, userId: DEMO_USER_ID, source: 'manual' })

    return ok(created)
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message)
    }
    return serverError()
  }
}

function hasOverlap(
  session: { id: string; startTime: Date; durationMinutes: number },
  candidateStart: Date,
  candidateDurationMinutes: number
) {
  const candidateEnd = addMinutes(candidateStart, candidateDurationMinutes)
  const existingStart = new Date(session.startTime)
  const existingEnd = addMinutes(existingStart, session.durationMinutes)
  return candidateStart < existingEnd && existingStart < candidateEnd
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

function isWithinAvailability(
  windows: { dayOfWeek: number; startTime: string; endTime: string }[],
  startTime: Date,
  durationMinutes: number
) {
  const candidateDay = startTime.getDay()
  const candidateEnd = addMinutes(startTime, durationMinutes)
  return windows.some((window) => {
    if (window.dayOfWeek !== candidateDay) return false
    const windowStart = combine(startTime, window.startTime)
    const windowEnd = combine(startTime, window.endTime)
    return startTime >= windowStart && candidateEnd <= windowEnd
  })
}

function combine(reference: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const copy = new Date(reference)
  copy.setHours(hours, minutes, 0, 0)
  return copy
}
