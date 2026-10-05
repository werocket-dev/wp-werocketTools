export type ModuleCategory = 'wordpress' | 'woocommerce'

export const MODULE_CATEGORIES: Record<string, ModuleCategory> = {
  general: 'wordpress',
  cookies: 'wordpress',
  google_reviews: 'wordpress',
  company_info: 'wordpress',
  retractation: 'woocommerce',
  click_collect: 'woocommerce',
}

export function getModuleCategory(id: string): ModuleCategory {
  return MODULE_CATEGORIES[id] ?? 'wordpress'
}

export interface ModuleGroup {
  id: ModuleCategory
  label: string
  description: string
}

/** Ordre d'affichage des sections du tableau de bord. */
export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'wordpress',
    label: 'WordPress',
    description: 'Administration, conformité, réputation et identité du site',
  },
  {
    id: 'woocommerce',
    label: 'WooCommerce',
    description: 'Outils dédiés à la boutique : retrait en magasin et rétractation',
  },
]

const REPO_URL = 'https://github.com/blablaa-lab/we-wp-werocketTools'

export const LINKS = {
  documentation: `${REPO_URL}#readme`,
  support: 'https://werocket.fr/contact',
  shopNotify: 'https://werocket.fr/contact',
  releaseNotes: (version: string) => `${REPO_URL}/releases/tag/v${version}`,
}
