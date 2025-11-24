import { assertHexColor } from '@/lib/validation'

export const SESSION_ICON_CHOICES = ['bullseye', 'handshake', 'book', 'lightbulb', 'bolt', 'briefcase'] as const
export const SESSION_COLOR_CHOICES = ['#D8F0FF', '#FEE4E2', '#FFF3C4', '#E3F2FD', '#F5E8FF', '#E0FFE7'] as const

export type SessionIcon = (typeof SESSION_ICON_CHOICES)[number]

export const DEFAULT_SESSION_ICON: SessionIcon = SESSION_ICON_CHOICES[0]

export type SessionColor = (typeof SESSION_COLOR_CHOICES)[number]

export function assertSessionIcon(value: unknown): SessionIcon {
  if (typeof value !== 'string') {
    throw new Error('Icon must be a string')
  }
  if (!SESSION_ICON_CHOICES.includes(value as SessionIcon)) {
    throw new Error('Icon must be one of the supported icons')
  }
  return value as SessionIcon
}

export function assertSessionColor(value: unknown): SessionColor {
  if (typeof value !== 'string') {
    throw new Error('Color must be a string')
  }
  const color = assertHexColor(value).toUpperCase()
  if (!SESSION_COLOR_CHOICES.includes(color as SessionColor)) {
    throw new Error('Color must be one of the supported palette values')
  }
  return color as SessionColor
}
