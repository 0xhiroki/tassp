import { describe, expect, it } from 'vitest'
import { buildSuggestionPlan } from './suggestion-engine'

const NOW = new Date('2025-01-06T08:00:00.000Z')

const baseAvailability = [
  { id: 'mon-am', dayOfWeek: 1, startTime: '09:00', endTime: '11:00' },
  { id: 'tue-am', dayOfWeek: 2, startTime: '09:00', endTime: '11:00' }
]

describe('buildSuggestionPlan', () => {
  it('avoids stacking more than two high-priority sessions per day', () => {
    const sessionTypes = [
      { id: 'deep', name: 'Deep Work', priority: 5 },
      { id: 'plan', name: 'Planning', priority: 2 }
    ]

    const sessions = [
      {
        id: 'hp1',
        startTime: new Date('2025-01-06T01:00:00.000Z'),
        durationMinutes: 60,
        sessionTypeId: 'deep',
        priority: 5
      },
      {
        id: 'hp2',
        startTime: new Date('2025-01-06T04:00:00.000Z'),
        durationMinutes: 60,
        sessionTypeId: 'deep',
        priority: 5
      }
    ]

    const plan = buildSuggestionPlan({
      sessionTypes,
      availability: baseAvailability,
      sessions,
      targetCount: 2,
      maxDayLookahead: 5,
      now: NOW
    })

    expect(plan).toHaveLength(2)
    const mondaySuggestion = plan.find((item) => item.startTime.getUTCDay() === 1)
    const tuesdaySuggestion = plan.find((item) => item.startTime.getUTCDay() === 2)

    expect(mondaySuggestion?.sessionTypeId).toBe('plan')
    expect(tuesdaySuggestion?.sessionTypeId).toBe('deep')
  })

  it('respects minimum spacing for the same session type', () => {
    const sessionTypes = [{ id: 'deep', name: 'Deep Work', priority: 5 }]

    const sessions = [
      {
        id: 'recent',
        startTime: new Date('2025-01-05T22:00:00.000Z'),
        durationMinutes: 90,
        sessionTypeId: 'deep',
        priority: 5
      }
    ]

    const plan = buildSuggestionPlan({
      sessionTypes,
      availability: baseAvailability,
      sessions,
      targetCount: 1,
      maxDayLookahead: 5,
      now: NOW
    })

    expect(plan).toHaveLength(1)
    expect(plan[0].startTime.getUTCDay()).toBe(2)
  })

  it('caps duration to tight availability windows', () => {
    const sessionTypes = [{ id: 'deep', name: 'Deep Work', priority: 5 }]

    const availability = [
      { id: 'short', dayOfWeek: 1, startTime: '09:00', endTime: '09:45' }
    ]

    const plan = buildSuggestionPlan({
      sessionTypes,
      availability,
      sessions: [],
      targetCount: 1,
      maxDayLookahead: 2,
      now: NOW
    })

    expect(plan).toHaveLength(1)
    expect(plan[0].durationMinutes).toBe(45)
  })
})
