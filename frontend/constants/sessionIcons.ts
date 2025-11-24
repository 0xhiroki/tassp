export const SESSION_ICON_CHOICES = [
  { id: 'bullseye', label: 'Focus' },
  { id: 'handshake', label: 'Collab' },
  { id: 'book', label: 'Learning' },
  { id: 'lightbulb', label: 'Strategy' },
  { id: 'bolt', label: 'Rapid' },
  { id: 'briefcase', label: 'Client' }
] as const

export const SESSION_COLOR_CHOICES = ['#D8F0FF', '#FEE4E2', '#FFF3C4', '#E3F2FD', '#F5E8FF', '#E0FFE7'] as const

export type SessionColorHex = (typeof SESSION_COLOR_CHOICES)[number]

export type SessionIconId = (typeof SESSION_ICON_CHOICES)[number]['id']

export const DEFAULT_SESSION_ICON: SessionIconId = SESSION_ICON_CHOICES[0].id
