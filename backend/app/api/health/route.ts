import { ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { ensureDemoUser } from '@/lib/demo-user'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    await ensureDemoUser()
    return ok({ status: 'ok', timestamp: new Date().toISOString(), database: 'reachable' })
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Database unreachable')
  }
}
