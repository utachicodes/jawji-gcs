type PossibleIngestFunction = (data: unknown) => Promise<void> | void

function getStreamerIngestFunction(): PossibleIngestFunction | null {
  const modulePath = process.env.STREAMER_MODULE_PATH
  if (!modulePath) return null

  try {
    // Avoid bundler static analysis; only execute on the server at runtime.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req: NodeRequire = (0, eval)("require")
    const loaded = req(modulePath)
    const candidate =
      (typeof loaded?.ingest === "function" && loaded.ingest) ||
      (typeof loaded?.publish === "function" && loaded.publish) ||
      (typeof loaded?.send === "function" && loaded.send) ||
      (typeof loaded?.default === "function" && loaded.default)
    return typeof candidate === "function" ? candidate : null
  } catch {
    return null
  }
}

export async function ingestTelemetry(data: unknown): Promise<void> {
  const fn = getStreamerIngestFunction()
  if (!fn) return
  await Promise.resolve(fn(data))
}


