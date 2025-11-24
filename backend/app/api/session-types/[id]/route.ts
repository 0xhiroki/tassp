import { DEMO_USER_ID } from '@/lib/constants'
import { badRequest, notFound, ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { assertPriority, assertString } from '@/lib/validation'
import { ensureDemoUser } from '@/lib/demo-user'
import { assertSessionColor, assertSessionIcon } from '@/lib/session-icons'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params
    await ensureDemoUser()
    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = assertString(body.name, 'name')
    if (body.color !== undefined) data.color = assertSessionColor(body.color)
    if (body.priority !== undefined) data.priority = assertPriority(body.priority)
    if (body.icon !== undefined) data.icon = assertSessionIcon(body.icon)
    if (body.category !== undefined) {
      data.category = assertString(body.category, 'category')
    }

    if (Object.keys(data).length === 0) {
      return badRequest('No fields to update')
    }

    const updated = await prisma.sessionType.updateMany({
      where: { id, userId: DEMO_USER_ID },
      data
    })

    if (updated.count === 0) {
      return notFound('Session type not found')
    }

    const sessionType = await prisma.sessionType.findUnique({ where: { id } })
    return ok(sessionType)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return notFound('Session type not found')
    }
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
    const deleted = await prisma.sessionType.deleteMany({
      where: { id, userId: DEMO_USER_ID }
    })

    if (deleted.count === 0) {
      return notFound('Session type not found')
    }

    return ok({ success: true })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}
