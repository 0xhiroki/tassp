import { prisma } from '@/lib/prisma'
import { ensureDemoUser } from '@/lib/demo-user'
import { DEMO_USER_ID } from '@/lib/constants'
import { refreshSuggestionCache } from '@/app/api/suggestions/route'

async function main() {
  console.log('Refreshing smart suggestions…')
  await ensureDemoUser()

  const existing = await prisma.suggestion.count({ where: { userId: DEMO_USER_ID } })
  const suggestions = await refreshSuggestionCache()

  console.log(`Removed ${existing} suggestions and generated ${suggestions.length} fresh suggestions.`)
}

main()
  .then(() => {
    console.log('Suggestion refresh complete.')
  })
  .catch((error) => {
    console.error('Failed to refresh suggestions:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
