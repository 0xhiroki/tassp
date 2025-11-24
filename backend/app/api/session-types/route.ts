import { DEMO_USER_ID } from '@/lib/constants'
import { badRequest, ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { assertPriority, assertString } from '@/lib/validation'
import { ensureDemoUser } from '@/lib/demo-user'
import { assertSessionColor, assertSessionIcon, DEFAULT_SESSION_ICON } from '@/lib/session-icons'

export async function GET() {
  try {
    await ensureDemoUser()
    const types = await prisma.sessionType.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: 'desc' }
    })

    return ok(types)
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export async function POST(request: Request) {
  try {
    await ensureDemoUser()
    const body = await request.json()
    const name = assertString(body.name, 'name')
    const color = assertSessionColor(body.color)
    const priority = assertPriority(body.priority)
    const icon = body.icon ? assertSessionIcon(body.icon) : DEFAULT_SESSION_ICON
    const category = assertString(body.category, 'category')

    const sessionType = await prisma.sessionType.create({
      data: {
        userId: DEMO_USER_ID,
        name,
        category,
        color,
        priority,
        icon
      }
    })

    return ok(sessionType, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message)
    }
    return serverError()
  }
}
