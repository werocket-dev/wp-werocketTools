export type ModuleCategory = 'wordpress' | 'woocommerce'

export const MODULE_CATEGORIES: Record<string, ModuleCategory> = {
  cookies: 'wordpress',
  google_reviews: 'wordpress',
  retractation: 'woocommerce',
}

export function getModuleCategory(id: string): ModuleCategory {
  return MODULE_CATEGORIES[id] ?? 'wordpress'
}
