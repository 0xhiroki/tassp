import OpenAI from 'openai'

type DescriptionInput = {
  sessionTypeName: string
  startTime: Date
  durationMinutes: number
  reason: string
}

const SYSTEM_PROMPT = `You are the FocusFlow scheduler. Given a work session type, start time, duration, and a short rationale for why the slot works, respond with one short, energetic sentence (max 18 words) that summarizes what the user should accomplish during that block. Start with an action verb, keep it concrete, omit quotation marks, and avoid referencing the day/time explicitly.`

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function generateSuggestionDescription(input: DescriptionInput) {
  const fallback = buildFallbackDescription(input)
  if (!openai) {
    return fallback
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 60,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Session Type: ${input.sessionTypeName}
Start: ${input.startTime.toISOString()}
Duration (minutes): ${input.durationMinutes}
Reason: ${input.reason}`
        }
      ]
    })

    const text = response.choices[0]?.message?.content?.trim()
    return sanitizeDescription(text) || fallback
  } catch (error) {
    console.error('Failed to generate suggestion description:', error)
    return fallback
  }
}

function buildFallbackDescription(input: DescriptionInput) {
  const base = `${input.sessionTypeName}: ${input.reason}`
  return truncate(base, 120)
}

function sanitizeDescription(value?: string | null) {
  if (!value) return ''
  const normalized = value.replace(/\s+/g, ' ').replace(/^"|"$/g, '').trim()
  return truncate(normalized, 160)
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}
