// Thin fetch wrapper used by client components.

export async function api<T = any>(
  url: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: opts.method || "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "same-origin",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}
