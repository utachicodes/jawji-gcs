"use client"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid h-dvh place-items-center p-6 text-center">
      <div>
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 grid place-items-center">
          <span className="text-xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          {process.env.NODE_ENV === "development" ? error?.message : "An unexpected error occurred."}
        </p>
        <button onClick={reset} className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground">
          Try again
        </button>
      </div>
    </div>
  )
}
