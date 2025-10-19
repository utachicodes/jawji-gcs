export default function Loading() {
  return (
    <div className="grid h-dvh place-items-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        <span>Loading…</span>
      </div>
    </div>
  )
}
