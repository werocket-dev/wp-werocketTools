import type { MenuSnapshotItem, SavedMenuItem } from '@/lib/types'

/** Élément affiché dans l'éditeur : données enregistrées + infos d'origine du menu. */
export type EditorItem =
  | { type: 'menu'; slug: string; label: string; hidden: boolean; title: string; icon: string; submenus: number }
  | { type: 'space'; id: string }
  | { type: 'heading'; id: string; label: string }

/** Le menu du plugin reste toujours visible : sinon plus d'accès à ces réglages. */
export const OWN_MENU_SLUG = 'werocket-tools'

export function readSnapshot(): MenuSnapshotItem[] {
  try {
    const raw = document.getElementById('werocket-menu-snapshot')?.textContent ?? '[]'
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? (data as MenuSnapshotItem[]) : []
  } catch {
    return []
  }
}

/** Équivalent de sanitize_key() côté PHP, pour les identifiants de séparateurs. */
function sanitizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
}

export function newId(prefix: string): string {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`
}

function fromSnapshot(item: Extract<MenuSnapshotItem, { type: 'menu' }>): Extract<EditorItem, { type: 'menu' }> {
  return { type: 'menu', slug: item.slug, title: item.title, icon: item.icon, submenus: item.submenus, label: '', hidden: false }
}

/**
 * Ordre WordPress d'origine si rien n'est enregistré ; sinon la configuration
 * enregistrée, suivie des menus apparus depuis (autres extensions), comme
 * côté serveur.
 */
export function buildEditorItems(snapshot: MenuSnapshotItem[], saved: SavedMenuItem[]): EditorItem[] {
  if (saved.length === 0) {
    // Mêmes règles que WordPress : pas d'espaces collés ni en fin de liste.
    return collapseSpaces(snapshot.map(item => item.type === 'separator'
      ? { type: 'space', id: sanitizeKey(item.slug) }
      : fromSnapshot(item)))
  }

  const menus = new Map(snapshot.flatMap(item => item.type === 'menu' ? [[item.slug, item] as const] : []))
  const used = new Set<string>()
  const items: EditorItem[] = []

  for (const item of saved) {
    if (item.type !== 'menu') {
      items.push(item)
      continue
    }
    const origin = menus.get(item.slug)
    if (!origin) continue // Menu disparu (extension désactivée).
    used.add(item.slug)
    items.push({ ...fromSnapshot(origin), label: item.label, hidden: item.hidden })
  }
  for (const origin of menus.values()) {
    if (!used.has(origin.slug)) items.push(fromSnapshot(origin))
  }
  return items
}

export function serializeEditorItems(items: EditorItem[]): SavedMenuItem[] {
  return items.map(item => {
    if (item.type === 'menu') return { type: 'menu', slug: item.slug, label: item.label, hidden: item.hidden }
    if (item.type === 'heading') return { type: 'heading', id: item.id, label: item.label }
    return { type: 'space', id: item.id }
  })
}

export function displayName(item: Extract<EditorItem, { type: 'menu' }>): string {
  return item.label || item.title
}

/** Sans espaces collés ni en début/fin de liste (wp-admin/includes/menu.php les supprime aussi). */
function collapseSpaces(items: EditorItem[]): EditorItem[] {
  const out: EditorItem[] = []
  for (const item of items) {
    if (item.type === 'space' && (out.length === 0 || out[out.length - 1].type === 'space')) continue
    out.push(item)
  }
  while (out.length && out[out.length - 1].type === 'space') out.pop()
  return out
}

/** Liste rendue par WordPress : menus masqués exclus, espaces normalisés. */
export function previewItems(items: EditorItem[]): EditorItem[] {
  return collapseSpaces(items.filter(item => !(item.type === 'menu' && item.hidden)))
}
