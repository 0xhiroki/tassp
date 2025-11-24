import { DEMO_USER_ID } from '@/lib/constants'
import { badRequest, notFound, ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { assertDate, assertString } from '@/lib/validation'
import { ensureDemoUser } from '@/lib/demo-user'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params
    await ensureDemoUser()
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    const existing = await prisma.session.findUnique({
      where: { id },
      select: { id: true, userId: true, completedAt: true }
    })

    if (!existing || existing.userId !== DEMO_USER_ID) {
      return notFound('Session not found')
    }

    if (existing.completedAt) {
      return badRequest('Completed sessions cannot be edited')
    }

    if (body.description !== undefined) {
      updates.description = assertString(body.description, 'description')
    }

    if (body.completedAt !== undefined) {
      updates.completedAt = body.completedAt ? assertDate(body.completedAt, 'completedAt') : null
    }

    if (Object.keys(updates).length === 0) {
      return badRequest('No fields to update')
    }

    const session = await prisma.session.update({
      where: { id },
      data: updates,
      include: { sessionType: true }
    })

    return ok(session)
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message)
    }
    return serverError()
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const { id } = await context.params
    await ensureDemoUser()
    const deleted = await prisma.session.deleteMany({
      where: { id, userId: DEMO_USER_ID }
    })

    if (deleted.count === 0) {
      return notFound('Session not found')
    }

    return ok({ success: true })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}
