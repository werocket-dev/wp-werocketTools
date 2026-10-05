import type { MenuSnapshotItem } from './types'

/** Attributs data-* de #werocket-admin-root (templates/admin/main.php). */
export interface AdminBootstrap {
  restUrl: string
  nonce: string
  pluginUrl: string
  version: string
  homeUrl: string
  pluginFolder: string
}

/** Données des modules, ajoutées côté PHP via le filtre werocket_tools_admin_data. */
export interface AdminData {
  general?: { menuSnapshot: MenuSnapshotItem[]; loginPrefix: string }
}

let bootstrap: AdminBootstrap | null = null
let adminData: AdminData | null = null

export function getBootstrap(): AdminBootstrap {
  if (bootstrap) return bootstrap
  const el = document.getElementById('werocket-admin-root')
  if (!el) throw new Error('werocket-admin-root not found')
  return (bootstrap = el.dataset as unknown as AdminBootstrap)
}

export function getAdminData(): AdminData {
  if (adminData) return adminData
  try {
    const parsed: unknown = JSON.parse(document.getElementById('werocket-admin-data')?.textContent ?? '{}')
    adminData = parsed && typeof parsed === 'object' ? (parsed as AdminData) : {}
  } catch {
    adminData = {}
  }
  return adminData
}
