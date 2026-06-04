/**
 * Cookie scanner runner.
 *
 * Visits a list of same-origin URLs in hidden iframes, gives JS time to run,
 * then captures cookies / localStorage / sessionStorage / third-party resource
 * domains by reading the iframe's DOM directly (same-origin only) and POSTs
 * findings back to /cookies/scan/report.
 *
 * To make trackers actually fire during the scan, we pre-grant consent by
 * writing the Klaro storage cookie with every known service set to true.
 * The original consent is captured before and restored after the scan.
 */

import { api } from '@/lib/api'
import type { CookieService, ScanProgressItem } from '@/lib/types'

export interface RunScanOptions {
  scanId: string
  token: string
  urls: string[]
  cookieName: string                  // settings.cookie_name (Klaro storage cookie)
  services: CookieService[]           // used to build "accept all" payload
  storageMethod: 'cookie' | 'localStorage'
  waitMsPerUrl?: number               // dwell time after iframe load (default 5000)
  loadTimeoutMs?: number              // hard timeout per URL (default 30000)
  onProgress?: (items: ScanProgressItem[]) => void
}

const IFRAME_BOX_STYLE =
  'position:fixed;left:-9999px;top:-9999px;width:1280px;height:800px;visibility:hidden;pointer-events:none;'

const IFRAME_STYLE = 'width:1280px;height:800px;border:0;'

const PRE_CONSENT_MAX_AGE = 900 // 15 minutes

export async function runScan(opts: RunScanOptions): Promise<void> {
  const {
    scanId,
    token,
    urls,
    cookieName,
    services,
    storageMethod,
    waitMsPerUrl = 5000,
    loadTimeoutMs = 30000,
    onProgress,
  } = opts

  const progress: ScanProgressItem[] = urls.map(url => ({ url, status: 'pending' }))
  const emit = () => onProgress?.(progress.map(p => ({ ...p })))
  emit()

  const restore = preGrantConsent(cookieName, services, storageMethod)
  const container = mountContainer()

  try {
    for (let i = 0; i < urls.length; i++) {
      progress[i].status = 'visiting'
      emit()

      const url = urls[i]
      try {
        const findings = await scanUrl(url, scanId, container, waitMsPerUrl, loadTimeoutMs)
        await api.post('/cookies/scan/report', {
          scan_id: scanId,
          token,
          url,
          ...findings,
        })
        progress[i].status = 'done'
        progress[i].cookies_found = findings.cookies.length
      } catch (e) {
        progress[i].status = 'error'
        progress[i].error = e instanceof Error ? e.message : String(e)
      }
      emit()
    }
  } finally {
    container.remove()
    restore()
  }
}

// ──────────────────────────────────────────────────────────
// Internals
// ──────────────────────────────────────────────────────────

interface UrlFindings {
  cookies: Array<{ name: string; value: string; domain: string }>
  localStorage: Array<{ key: string; value: string }>
  sessionStorage: Array<{ key: string; value: string }>
  resources: Array<{ domain: string; type: string }>
}

async function scanUrl(
  url: string,
  scanId: string,
  container: HTMLDivElement,
  waitMs: number,
  loadTimeoutMs: number
): Promise<UrlFindings> {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = IFRAME_STYLE
  iframe.setAttribute('referrerpolicy', 'same-origin')
  // Hint to the frontend (future): tells the cookies frontend it's running in
  // scan context so it can disable the banner if it ever wants to.
  iframe.src = appendQueryParam(url, 'werocket_scan', scanId)
  container.appendChild(iframe)

  try {
    await waitForLoad(iframe, loadTimeoutMs)
    await sleep(waitMs)
    return collectFindings(iframe)
  } finally {
    iframe.remove()
  }
}

function waitForLoad(iframe: HTMLIFrameElement, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false
    const cleanup = () => {
      iframe.onload = null
      iframe.onerror = null
      window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => {
      if (done) return
      done = true
      cleanup()
      reject(new Error('Timeout chargement iframe'))
    }, timeoutMs)
    iframe.onload = () => {
      if (done) return
      done = true
      cleanup()
      resolve()
    }
    iframe.onerror = () => {
      if (done) return
      done = true
      cleanup()
      reject(new Error('Erreur de chargement iframe'))
    }
  })
}

function collectFindings(iframe: HTMLIFrameElement): UrlFindings {
  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    throw new Error('Accès iframe refusé (cross-origin ?)')
  }

  const findings: UrlFindings = {
    cookies: parseCookieString(doc.cookie),
    localStorage: readStorage(safe(() => win.localStorage)),
    sessionStorage: readStorage(safe(() => win.sessionStorage)),
    resources: readResources(win),
  }
  return findings
}

function parseCookieString(raw: string): UrlFindings['cookies'] {
  if (!raw) return []
  return raw
    .split(';')
    .map(piece => {
      const idx = piece.indexOf('=')
      if (idx < 0) return null
      const name = piece.slice(0, idx).trim()
      const value = piece.slice(idx + 1)
      if (!name) return null
      // document.cookie doesn't expose domain — leave blank, the backend
      // will fall back to the home host when displaying.
      return { name, value, domain: '' }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
}

function readStorage(storage: Storage | null): Array<{ key: string; value: string }> {
  if (!storage) return []
  const items: Array<{ key: string; value: string }> = []
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (!key) continue
      items.push({ key, value: storage.getItem(key) ?? '' })
    }
  } catch {
    // SecurityError if storage is blocked — ignore.
  }
  return items
}

function readResources(win: Window): UrlFindings['resources'] {
  const out: UrlFindings['resources'] = []
  try {
    const entries = win.performance?.getEntriesByType('resource') ?? []
    const seen = new Set<string>()
    for (const e of entries as PerformanceResourceTiming[]) {
      let host = ''
      try {
        host = new URL(e.name).hostname
      } catch {
        continue
      }
      if (!host || seen.has(host)) continue
      seen.add(host)
      out.push({ domain: host, type: e.initiatorType || '' })
    }
  } catch {
    // performance API blocked — ignore.
  }
  return out
}

function mountContainer(): HTMLDivElement {
  const div = document.createElement('div')
  div.setAttribute('data-werocket-scan-container', '')
  div.setAttribute('aria-hidden', 'true')
  div.style.cssText = IFRAME_BOX_STYLE
  document.body.appendChild(div)
  return div
}

/**
 * Write a Klaro-compatible "accept all" payload so the cookie banner is
 * dormant during the scan and trackers fire normally. Returns a function
 * that restores the original value.
 */
function preGrantConsent(
  cookieName: string,
  services: CookieService[],
  storageMethod: 'cookie' | 'localStorage'
): () => void {
  const payload: Record<string, boolean> = {}
  for (const svc of services) {
    if (!svc.name) continue
    payload[svc.name] = true
  }
  const serialized = JSON.stringify(payload)

  if (storageMethod === 'localStorage') {
    const previous = safe(() => window.localStorage.getItem(cookieName))
    safe(() => window.localStorage.setItem(cookieName, serialized))
    return () => {
      safe(() => {
        if (previous === null) window.localStorage.removeItem(cookieName)
        else window.localStorage.setItem(cookieName, previous)
      })
    }
  }

  const previous = readCookie(cookieName)
  writeCookie(cookieName, serialized, PRE_CONSENT_MAX_AGE)
  return () => {
    if (previous === null) {
      deleteCookie(cookieName)
    } else {
      writeCookie(cookieName, previous, PRE_CONSENT_MAX_AGE)
    }
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escapeRegex(name) + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie =
    `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function appendQueryParam(url: string, key: string, value: string): string {
  try {
    const u = new URL(url, window.location.origin)
    u.searchParams.set(key, value)
    return u.toString()
  } catch {
    return url
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}
