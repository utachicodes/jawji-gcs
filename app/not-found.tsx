export default function NotFound() {
  return (
    <div className="grid h-dvh place-items-center p-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted grid place-items-center">
          <span className="text-xl">🛰️</span>
        </div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The requested resource is outside the current flight plan.
        </p>
        <a href="/" className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Return to base
        </a>
      </div>
    </div>
  )
}
