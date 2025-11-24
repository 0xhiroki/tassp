import { describe, expect, it } from 'vitest'

import { formatShortAvailability } from '../time'

describe('formatShortAvailability', () => {
  it('merges identical meridiems into a single suffix', () => {
    const label = formatShortAvailability(1, '08:00', '09:30')
    expect(label).toBe('Mon 08:00-09:30AM')
  })

  it('keeps distinct meridiems when the range spans AM and PM', () => {
    const label = formatShortAvailability(1, '11:00', '13:30')
    expect(label).toBe('Mon 11:00AM-01:30PM')
  })
})
