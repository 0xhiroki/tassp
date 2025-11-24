import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PUT } from './route'
import { DEMO_USER_ID } from '@/lib/constants'

vi.mock('@/lib/demo-user', () => ({ ensureDemoUser: vi.fn() }))

const mocks = vi.hoisted(() => ({
  availability: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn()
  },
  session: {
    findMany: vi.fn(),
    deleteMany: vi.fn()
  },
  transaction: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    availabilityWindow: {
      findMany: mocks.availability.findMany,
      deleteMany: mocks.availability.deleteMany,
      createMany: mocks.availability.createMany
    },
    session: {
      findMany: mocks.session.findMany,
      deleteMany: mocks.session.deleteMany
    },
    $transaction: mocks.transaction
  }
}))

describe('PUT /api/availability', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.availability.findMany.mockResolvedValue([])
    mocks.availability.deleteMany.mockResolvedValue({ count: 0 })
    mocks.availability.createMany.mockResolvedValue({ count: 2 })
    mocks.session.findMany.mockResolvedValue([])
    mocks.session.deleteMany.mockResolvedValue({ count: 0 })
    mocks.transaction.mockImplementation(async (operations: Array<Promise<unknown>>) => {
      await Promise.all(operations)
      return { count: operations.length }
    })
  })

  const buildRequest = (windows: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) =>
    new Request('http://localhost/api/availability', {
      method: 'PUT',
      body: JSON.stringify({ windows })
    })

  it('accepts unique availability windows', async () => {
    const response = await PUT(
      buildRequest([
        { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '11:00' }
      ])
    )

    expect(response.status).toBe(200)
    expect(mocks.transaction).toHaveBeenCalled()
    const createArgs = mocks.availability.createMany.mock.calls[0][0]
    expect(createArgs.data).toEqual([
      { dayOfWeek: 1, startTime: '08:00', endTime: '10:00', userId: DEMO_USER_ID },
      { dayOfWeek: 2, startTime: '09:00', endTime: '11:00', userId: DEMO_USER_ID }
    ])
    expect(mocks.session.deleteMany).not.toHaveBeenCalled()
  })

  it('rejects duplicate availability windows', async () => {
    const response = await PUT(
      buildRequest([
        { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' },
        { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }
      ])
    )

    const payload = await response.json()
    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/duplicate/i)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('deletes sessions that conflict with removed windows', async () => {
    mocks.availability.findMany.mockResolvedValueOnce([
      { dayOfWeek: 1, startTime: '09:00', endTime: '11:30' }
    ])
    const mondaySession = { id: 'session-1', startTime: new Date('2025-11-24T09:30:00') }
    const tuesdaySession = { id: 'session-2', startTime: new Date('2025-11-25T09:30:00') }
    mocks.session.findMany.mockResolvedValueOnce([mondaySession, tuesdaySession])
    mocks.session.deleteMany.mockResolvedValueOnce({ count: 1 })

    const response = await PUT(buildRequest([]))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.removedSessionCount).toBe(1)
    expect(mocks.session.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['session-1'] } } })
  })
})
