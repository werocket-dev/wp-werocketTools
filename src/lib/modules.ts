export type ModuleCategory = 'wordpress' | 'woocommerce'

export const MODULE_CATEGORIES: Record<string, ModuleCategory> = {
  cookies: 'wordpress',
  google_reviews: 'wordpress',
  company_info: 'wordpress',
  retractation: 'woocommerce',
  click_collect: 'woocommerce',
}

export function getModuleCategory(id: string): ModuleCategory {
  return MODULE_CATEGORIES[id] ?? 'wordpress'
}

/**
 * Palette WooCommerce — override des variables shadcn sur un wrapper
 * (#F2EDFF fond de card · #873EFF boutons/switch/accents).
 */
export const WOO_THEME_VARS = {
  '--card': '#F2EDFF',
  '--primary': '#873EFF',
  '--primary-foreground': '#ffffff',
  '--ring': '#873EFF',
} as React.CSSProperties

export interface ModuleGroup {
  id: ModuleCategory
  label: string
  description: string
  /** Variables de thème appliquées au wrapper de la section (undefined = thème par défaut). */
  themeVars?: React.CSSProperties
}

/** Ordre d'affichage des sections du tableau de bord. */
export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'wordpress',
    label: 'WordPress',
    description: 'Conformité, réputation et identité du site.',
  },
  {
    id: 'woocommerce',
    label: 'WooCommerce',
    description: 'Outils dédiés à la boutique : retrait en magasin et rétractation.',
    themeVars: WOO_THEME_VARS,
  },
]
