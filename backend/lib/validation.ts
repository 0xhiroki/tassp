// Request bodies arrive as untyped JSON; accept `unknown` inputs and return narrowed values.
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

export function assertHexColor(value: unknown): string {
  if (typeof value !== 'string' || !COLOR_REGEX.test(value)) {
    throw new Error('Invalid color: expected hex string like #3B82F6')
  }
  return value
}

export function assertPriority(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 1 || value > 5) {
    throw new Error('Invalid priority: expected number 1-5')
  }
  return value
}

export function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${field}: expected non-empty string`)
  }
  return value
}

export function assertDate(value: unknown, field: string): Date {
  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field}: expected ISO date string`)
  }
  return date
}

export function assertNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid ${field}: expected number`)
  }
  return value
}
