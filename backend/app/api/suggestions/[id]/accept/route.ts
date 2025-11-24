import { DEMO_USER_ID } from '@/lib/constants'
import { badRequest, conflict, notFound, ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { hasOverlap } from '@/lib/overlap'
import { ensureDemoUser } from '@/lib/demo-user'
import { TARGET_SUGGESTION_COUNT, ensureSuggestionCount } from '../../route'
import { assertString } from '@/lib/validation'
import { trackSessionCreated } from '@/lib/analytics'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: Params) {
  try {
    const { id } = await context.params
    if (!id) {
      return badRequest('Suggestion id is required')
    }
    await ensureDemoUser()
    let description = ''
    try {
      const body = await request.json()
      if (body.description !== undefined) {
        description = assertString(body.description, 'description')
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error
      }
    }
    const suggestion = await prisma.suggestion.findUnique({
      where: { id, userId: DEMO_USER_ID }
    })

    if (!suggestion) {
      return notFound('Suggestion not found')
    }

    if (!description) {
      description = suggestion.description ?? ''
    }

    const existingSessions = await prisma.session.findMany({
      where: { userId: DEMO_USER_ID },
      select: { id: true, startTime: true, durationMinutes: true }
    })

    const startTime = new Date(suggestion.startTime)
    if (hasOverlap(existingSessions, startTime, suggestion.durationMinutes)) {
      return conflict('Requested time overlaps with an existing session')
    }

    const created = await prisma.session.create({
      data: {
        userId: DEMO_USER_ID,
        sessionTypeId: suggestion.sessionTypeId,
        description,
        startTime: suggestion.startTime,
        durationMinutes: suggestion.durationMinutes
      },
      include: { sessionType: true }
    })

    await trackSessionCreated({ sessionId: created.id, userId: DEMO_USER_ID, source: 'suggestion' })

    await prisma.suggestion.delete({ where: { id: suggestion.id } })
    const remainingSuggestions = await prisma.suggestion.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { startTime: 'asc' }
    })
    const toppedUpSuggestions = await ensureSuggestionCount(remainingSuggestions)

    return ok({ session: created, suggestions: toppedUpSuggestions.slice(0, TARGET_SUGGESTION_COUNT) })
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message)
    }
    return serverError()
  }
}
