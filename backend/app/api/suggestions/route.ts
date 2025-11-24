import { randomUUID } from 'crypto'
import { DEMO_USER_ID } from '@/lib/constants'
import { ok, serverError } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { ensureDemoUser } from '@/lib/demo-user'
import { generateSuggestionDescription } from '@/lib/ai'
import { buildSuggestionPlan } from '@/lib/suggestion-engine'

export const TARGET_SUGGESTION_COUNT = 3
const MAX_DAY_LOOKAHEAD = 21

export async function GET() {
  try {
    await ensureDemoUser()
    const suggestions = await ensureSuggestionCount()
    return ok(suggestions.slice(0, TARGET_SUGGESTION_COUNT))
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export async function POST() {
  try {
    await ensureDemoUser()
    return ok(await refreshSuggestionCache())
  } catch (error) {
    return serverError(error instanceof Error ? error.message : undefined)
  }
}

export async function refreshSuggestionCache() {
  const suggestions = await generateSuggestions()
  await prisma.suggestion.deleteMany({ where: { userId: DEMO_USER_ID } })
  if (suggestions.length === 0) {
    return []
  }
  await prisma.suggestion.createMany({ data: suggestions })
  return suggestions
}

type SuggestionRecord = Awaited<ReturnType<typeof prisma.suggestion.findMany>>[number]

export async function ensureSuggestionCount(existing?: SuggestionRecord[]) {
  const current =
    existing ??
    (await prisma.suggestion.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { startTime: 'asc' }
    }))

  if (current.length >= TARGET_SUGGESTION_COUNT) {
    return current.slice(0, TARGET_SUGGESTION_COUNT)
  }

  const needed = TARGET_SUGGESTION_COUNT - current.length
  const existingKeys = new Set(current.map(suggestionKey))
  const candidates = await generateSuggestions()
  const additions: SuggestionRecord[] = []

  for (const candidate of candidates) {
    const key = suggestionKey(candidate)
    if (existingKeys.has(key)) {
      continue
    }
    additions.push(candidate)
    existingKeys.add(key)
    if (additions.length === needed) {
      break
    }
  }

  if (additions.length > 0) {
    await prisma.suggestion.createMany({ data: additions })
    return [...current, ...additions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  return current
}

function suggestionKey(record: { sessionTypeId: string; startTime: Date }) {
  return `${record.sessionTypeId}-${record.startTime.toISOString()}`
}

async function generateSuggestions() {
  const [sessionTypes, availability, sessions] = await Promise.all([
    prisma.sessionType.findMany({ where: { userId: DEMO_USER_ID } }),
    prisma.availabilityWindow.findMany({ where: { userId: DEMO_USER_ID } }),
    prisma.session.findMany({
      where: { userId: DEMO_USER_ID },
      select: {
        id: true,
        startTime: true,
        durationMinutes: true,
        sessionTypeId: true,
        sessionType: { select: { priority: true } }
      }
    })
  ])

  if (sessionTypes.length === 0 || availability.length === 0) {
    return []
  }

  const plan = buildSuggestionPlan({
    sessionTypes,
    availability,
    sessions: sessions.map((session) => ({
      id: session.id,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
      sessionTypeId: session.sessionTypeId,
      priority: session.sessionType.priority
    })),
    targetCount: TARGET_SUGGESTION_COUNT,
    maxDayLookahead: MAX_DAY_LOOKAHEAD
  })

  const suggestions = await Promise.all(
    plan.map(async (entry) => {
      const description = await generateSuggestionDescription({
        sessionTypeName: entry.sessionTypeName,
        startTime: entry.startTime,
        durationMinutes: entry.durationMinutes,
        reason: entry.reason
      })

      return {
        id: randomUUID(),
        userId: DEMO_USER_ID,
        sessionTypeId: entry.sessionTypeId,
        startTime: entry.startTime,
        durationMinutes: entry.durationMinutes,
        reason: entry.reason,
        description
      }
    })
  )

  return suggestions
}
