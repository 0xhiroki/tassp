import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH } from './route'
import { DEMO_USER_ID } from '@/lib/constants'

vi.mock('@/lib/demo-user', () => ({ ensureDemoUser: vi.fn() }))

const mocks = vi.hoisted(() => ({
  sessionUpdate: vi.fn(),
  sessionFindUnique: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      update: mocks.sessionUpdate,
      findUnique: mocks.sessionFindUnique,
      deleteMany: vi.fn()
    }
  }
}))

describe('PATCH /api/sessions/[id]', () => {
  const context = { params: Promise.resolve({ id: 'sess1' }) }

  beforeEach(() => {
    vi.resetAllMocks()
    mocks.sessionUpdate.mockReset()
    mocks.sessionFindUnique.mockReset()
  })

  it('updates a session description when fields are provided', async () => {
    const updatedSession = { id: 'sess1', description: 'Updated', sessionType: { id: 'type1', name: 'Deep Work' } }
    mocks.sessionFindUnique.mockResolvedValueOnce({ id: 'sess1', userId: DEMO_USER_ID, completedAt: null })
    mocks.sessionUpdate.mockResolvedValue(updatedSession)

    const request = new Request('http://localhost/api/sessions/sess1', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Updated' })
    })

    const response = await PATCH(request, context)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual(updatedSession)
    expect(mocks.sessionUpdate).toHaveBeenCalledWith({
      where: { id: 'sess1' },
      data: { description: 'Updated' },
      include: { sessionType: true }
    })
  })

  it('returns 404 when no session matches the id', async () => {
    mocks.sessionFindUnique.mockResolvedValue(null)

    const request = new Request('http://localhost/api/sessions/sess1', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Missing' })
    })

    const response = await PATCH(request, context)
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toMatch(/not found/i)
    expect(mocks.sessionUpdate).not.toHaveBeenCalled()
  })

  it('rejects edits to completed sessions', async () => {
    mocks.sessionFindUnique.mockResolvedValue({ id: 'sess1', userId: DEMO_USER_ID, completedAt: new Date().toISOString() })

    const request = new Request('http://localhost/api/sessions/sess1', {
      method: 'PATCH',
      body: JSON.stringify({ description: 'Updated' })
    })

    const response = await PATCH(request, context)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/cannot be edited/i)
    expect(mocks.sessionUpdate).not.toHaveBeenCalled()
  })
})
