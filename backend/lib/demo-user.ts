import { DEMO_USER_ID } from '@/lib/constants'
import { prisma } from '@/lib/prisma'

export async function ensureDemoUser() {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: 'demo@example.com',
      name: 'Demo User'
    }
  })
}
