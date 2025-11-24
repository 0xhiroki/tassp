const ROUTES = [
  '/api/session-types',
  '/api/sessions',
  '/api/availability',
  '/api/suggestions',
  '/api/health'
]

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white font-sans">
      <div className="w-full max-w-lg space-y-4 px-6 py-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Smart Session Planner API</h1>
        <p className="text-sm text-zinc-600">
          This deployment hosts REST endpoints under <code>/api</code>. Use these routes from the mobile frontend or API clients.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {ROUTES.map((route) => (
            <li key={route}>
              <code>{route}</code>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
