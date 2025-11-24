type SessionCreatedEvent = {
  sessionId: string
  userId: string
  source: 'manual' | 'suggestion'
}

export async function trackSessionCreated(event: SessionCreatedEvent) {
  // Placeholder for future analytics wiring
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics] session_created', event)
  }
}
