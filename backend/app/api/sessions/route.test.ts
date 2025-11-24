import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { DEMO_USER_ID } from '@/lib/constants'

vi.mock('@/lib/demo-user', () => ({ ensureDemoUser: vi.fn() }))

const mocks = vi.hoisted(() => ({
  sessionTypeFindFirst: vi.fn(),
  availabilityFindMany: vi.fn(),
  sessionFindMany: vi.fn(),
  sessionCreate: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sessionType: { findFirst: mocks.sessionTypeFindFirst },
    availabilityWindow: { findMany: mocks.availabilityFindMany },
    session: { findMany: mocks.sessionFindMany, create: mocks.sessionCreate }
  }
}))
vi.mock('@/lib/analytics', () => ({ trackSessionCreated: vi.fn() }))

describe('POST /api/sessions', () => {
  const START_TIME = '2025-01-06T09:00:00'
  const START_DATE = new Date(START_TIME)
  const dayOfWeek = START_DATE.getDay()

  beforeEach(() => {
    vi.resetAllMocks()
    mocks.sessionTypeFindFirst.mockReset()
    mocks.availabilityFindMany.mockReset()
    mocks.sessionFindMany.mockReset()
    mocks.sessionCreate.mockReset()
  })

  it('creates a session when payload is valid', async () => {
    mocks.sessionTypeFindFirst.mockResolvedValue({ id: 'st1', userId: DEMO_USER_ID })
    mocks.availabilityFindMany.mockResolvedValue([{ dayOfWeek, startTime: '08:00', endTime: '12:00' }])
    mocks.sessionFindMany.mockResolvedValue([])
    const created = {
      id: 'sess1',
      userId: DEMO_USER_ID,
      sessionTypeId: 'st1',
      description: '',
      startTime: START_DATE,
      durationMinutes: 60,
      sessionType: { id: 'st1', name: 'Focus' }
    }
    mocks.sessionCreate.mockResolvedValue(created)

    const response = await POST(
      new Request('http://localhost/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          sessionTypeId: 'st1',
          startTime: START_TIME,
          durationMinutes: 60,
          description: 'Manual'
        })
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.id).toBe('sess1')
    expect(mocks.sessionCreate).toHaveBeenCalled()
  })

  it('returns conflicts when overlaps exist and override not allowed', async () => {
    mocks.sessionTypeFindFirst.mockResolvedValue({ id: 'st1', userId: DEMO_USER_ID })
    mocks.availabilityFindMany.mockResolvedValue([{ dayOfWeek, startTime: '08:00', endTime: '12:00' }])
    mocks.sessionFindMany.mockResolvedValue([
      {
        id: 'existing',
        startTime: START_DATE,
        durationMinutes: 60,
        sessionType: { id: 'st1', name: 'Focus' }
      }
    ])

    const response = await POST(
      new Request('http://localhost/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ sessionTypeId: 'st1', startTime: START_TIME, durationMinutes: 60 })
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(409)
    expect(payload.error).toMatch(/overlaps/i)
    expect(Array.isArray(payload.conflicts)).toBe(true)
    expect(payload.conflicts).toHaveLength(1)
    expect(mocks.sessionCreate).not.toHaveBeenCalled()
  })
})
