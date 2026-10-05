import { Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PanelTitle } from '../SettingsSection'
import { MenuItemIcon } from './MenuItemIcon'
import { SEPARATOR_TYPES, SeparatorTypeInfo } from './MenuParts'
import { OWN_MENU_SLUG, displayName, itemKey, previewItems, type EditorItem } from './menu-model'

/** Colonne de droite : aperçu du menu tel que WordPress l'affichera. */
export function AdminMenuAside({ items }: { items: EditorItem[] }) {
  return (
    <aside className="flex shrink-0 flex-col gap-5 2xl:w-[300px]">
      <Card variant="panel">
        <div className="flex items-center gap-2 px-4 py-3.5">
          <Eye className="size-[15px] text-muted-foreground" />
          <PanelTitle>Aperçu du menu</PanelTitle>
        </div>
        <div className="flex justify-center border-t border-border bg-muted px-7 py-4">
          <div className="w-full max-w-60 rounded-[6px] bg-wp-menu py-2" aria-label="Aperçu du menu d'administration">
            {previewItems(items).map(item => {
              if (item.type === 'space') return <div key={itemKey(item)} className="h-3.5" />
              if (item.type === 'heading') {
                return (
                  <div key={itemKey(item)} className="px-2.5 pt-3 pb-1 text-[10px] font-semibold tracking-[0.06em] text-wp-menu-heading uppercase">
                    {item.label}
                  </div>
                )
              }
              const own = item.slug === OWN_MENU_SLUG
              return (
                <div
                  key={itemKey(item)}
                  className={cn('flex h-8 items-center gap-2 px-2.5 text-[12.5px]', own ? 'bg-wp-menu-active text-inverse-foreground' : 'text-wp-menu-foreground')}
                >
                  <MenuItemIcon slug={item.slug} icon={item.icon} inverse className={own ? 'text-inverse-foreground' : 'text-wp-menu-icon'} />
                  <span className="truncate">{displayName(item)}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          L'aperçu se met à jour pendant que vous réorganisez. Rien n'est appliqué avant l'enregistrement.
        </div>
      </Card>

      <Card variant="panel" className="gap-3 p-4">
        <PanelTitle>Deux types de séparateurs</PanelTitle>
        {SEPARATOR_TYPES.map(({ type, ...info }) => (
          <div key={type} className="flex items-start gap-2.5">
            <SeparatorTypeInfo {...info} />
          </div>
        ))}
      </Card>
    </aside>
  )
}
