import { DEMO_USER_ID } from '@/lib/constants'
import { ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { ensureDemoUser } from '@/lib/demo-user'

export async function GET() {
  try {
    await ensureDemoUser()
    const [sessions, sessionTypes] = await Promise.all([
      prisma.session.findMany({
        where: { userId: DEMO_USER_ID },
        include: { sessionType: true }
      }),
      prisma.sessionType.findMany({ where: { userId: DEMO_USER_ID } })
    ])

    const completedCount = sessions.filter((session) => session.completedAt !== null).length
    const totalSessions = sessions.length
    const scheduledCount = totalSessions - completedCount
    const completionRate = totalSessions === 0 ? 0 : completedCount / totalSessions

    const byType = sessionTypes.map((type) => {
      const typeSessions = sessions.filter((session) => session.sessionTypeId === type.id)
      return {
        sessionTypeId: type.id,
        name: type.name,
        total: typeSessions.length,
        completed: typeSessions.filter((session) => session.completedAt !== null).length
      }
    })

    return ok({
      totalSessions,
      completedCount,
      scheduledCount,
      completionRate,
      sessionTypes: byType
    })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}
