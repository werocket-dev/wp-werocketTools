function getBootstrap() {
  const el = document.getElementById('werocket-admin-root')
  if (!el) throw new Error('werocket-admin-root not found')
  return el.dataset as { restUrl: string; nonce: string; pluginUrl: string; version: string }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { restUrl, nonce } = getBootstrap()
  const res = await fetch(`${restUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': nonce,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
}
