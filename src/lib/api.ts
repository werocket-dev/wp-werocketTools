import { toast } from 'sonner'

function getBootstrap() {
  const el = document.getElementById('werocket-admin-root')
  if (!el) throw new Error('werocket-admin-root not found')
  return el.dataset as { restUrl: string; nonce: string; pluginUrl: string; version: string }
}

// Évite les reloads en boucle si plusieurs requêtes échouent en parallèle.
let reloadingForStaleNonce = false

function handleStaleNonce(): never {
  if (!reloadingForStaleNonce) {
    reloadingForStaleNonce = true
    toast.error('Session expirée, rechargement…')
    setTimeout(() => window.location.reload(), 800)
  }
  throw new Error('Session expirée')
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { restUrl, nonce } = getBootstrap()
  const res = await fetch(`${restUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': nonce,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // Nonce périmé (session morte côté serveur) : on recharge pour
    // récupérer un data-nonce frais plutôt que de laisser l'UI échouer
    // silencieusement avec un toast d'erreur générique.
    if (res.status === 403 && err?.code === 'rest_cookie_invalid_nonce') {
      handleStaleNonce()
    }
    throw new Error(err?.message ?? `HTTP ${res.status}`)
  }
  // Une notice PHP affichée (WP_DEBUG_DISPLAY) ou un plugin qui écrit dans la
  // sortie corrompt le JSON : on remonte une erreur lisible plutôt que le
  // « Unexpected token < » opaque de res.json().
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      `Réponse invalide du serveur sur ${path} (HTTP ${res.status}) : sortie PHP parasite (notice/warning) ou plugin tiers qui altère l'API REST.`
    )
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
}
