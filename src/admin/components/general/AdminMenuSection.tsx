import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Check, Eye, EyeOff, GripVertical, Heading, Info, Pencil, RotateCcw, SeparatorHorizontal, Trash2, Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ICON_BUTTON, PANEL, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../styles'
import { MenuItemIcon } from './MenuItemIcon'
import { OWN_MENU_SLUG, displayName, newId, previewItems, type EditorItem } from './menu-model'

interface Props {
  items: EditorItem[]
  onChange: (items: EditorItem[]) => void
  onReset: () => void
}

const keyOf = (item: EditorItem) => (item.type === 'menu' ? `menu:${item.slug}` : `${item.type}:${item.id}`)

const INPUT = 'h-[38px] rounded-[8px] border-input bg-card px-3 text-sm focus-visible:border-primary focus-visible:ring-0'

export function AdminMenuSection({ items, onChange, onReset }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const [armed, setArmed] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const menus = items.filter(i => i.type === 'menu')
  const separators = items.length - menus.length
  const hiddenCount = menus.filter(m => m.type === 'menu' && m.hidden).length

  const update = (index: number, patch: Partial<EditorItem>) =>
    onChange(items.map((item, i) => (i === index ? ({ ...item, ...patch } as EditorItem) : item)))

  /** `to` : position d'insertion dans la liste d'origine (0 … length). */
  function move(from: number, to: number) {
    const target = to > from ? to - 1 : to
    if (target === from) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  function startEdit(item: EditorItem) {
    setEditing(keyOf(item))
    setDraft(item.type === 'menu' ? displayName(item) : item.type === 'heading' ? item.label : '')
  }

  function commitEdit(index: number) {
    const item = items[index]
    const value = draft.trim()
    if (item.type === 'menu') update(index, { label: value === item.title ? '' : value })
    if (item.type === 'heading') update(index, { label: value || 'Section' })
    setEditing(null)
  }

  function addSeparator(type: 'space' | 'heading') {
    const item: EditorItem = type === 'space'
      ? { type: 'space', id: newId('s') }
      : { type: 'heading', id: newId('h'), label: 'Nouvelle section' }
    onChange([item, ...items])
    setAddOpen(false)
    if (type === 'heading') {
      setEditing(keyOf(item))
      setDraft('Nouvelle section')
    }
    toast.info('Séparateur ajouté en haut de la liste : glissez-le à sa place.')
  }

  /** Flèches haut/bas sur la poignée : alternative clavier au glisser-déposer. */
  function onHandleKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const to = e.key === 'ArrowUp' ? index - 1 : index + 2
    if (to < 0 || to > items.length) return
    move(index, to)
    const newIndex = e.key === 'ArrowUp' ? index - 1 : index + 1
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`[data-handle="${newIndex}"]`)?.focus()
    })
  }

  function onDragOver(e: React.DragEvent, index: number) {
    if (dragFrom === null) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDropAt(e.clientY < rect.top + rect.height / 2 ? index : index + 1)
  }

  function endDrag() {
    setDragFrom(null)
    setDropAt(null)
    setArmed(null)
  }

  const showDropAt = (position: number) =>
    dragFrom !== null && dropAt === position && position !== dragFrom && position !== dragFrom + 1

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-56 flex-1">
          <div role="heading" aria-level={2} className="text-[17px] font-semibold text-foreground">Ordre du menu</div>
          <div className="mt-[3px] text-[13px] text-muted-foreground">
            Glissez les éléments pour les réorganiser. Le nouvel ordre s'applique à tous les utilisateurs.
          </div>
        </div>
        <Button type="button" variant="ghost" className="h-9 gap-1.5 rounded-[8px] px-2.5 text-[13px] text-muted-foreground" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          Ordre par défaut
        </Button>
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className={SECONDARY_BUTTON}>
              <SeparatorHorizontal className="size-4" />
              Ajouter un séparateur
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 gap-1 rounded-xl p-1.5">
            <SeparatorTypeButton
              icon={<SeparatorHorizontal className="size-3.5" />}
              title="Espace"
              description="Un vide pour aérer le menu."
              onClick={() => addSeparator('space')}
            />
            <SeparatorTypeButton
              icon={<Heading className="size-3.5" />}
              title="Titre de section"
              description="Un petit intitulé, ex. « Boutique »."
              onClick={() => addSeparator('heading')}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card className={PANEL}>
        <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-2">
          <span className="flex-1 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">Élément du menu</span>
          <span className="text-[11.5px] text-subtle-foreground">
            {menus.length} menus · {separators} séparateur{separators > 1 ? 's' : ''} · {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''}
          </span>
        </div>

        <div ref={listRef} role="list" onDragLeave={e => { if (e.currentTarget === e.target) setDropAt(null) }}>
          {items.map((item, index) => {
            const key = keyOf(item)
            const isEditing = editing === key
            const dragging = dragFrom === index
            const rowProps = {
              draggable: armed === index,
              onDragStart: (e: React.DragEvent) => {
                setDragFrom(index)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', key)
              },
              onDragOver: (e: React.DragEvent) => onDragOver(e, index),
              onDrop: (e: React.DragEvent) => {
                e.preventDefault()
                if (dragFrom !== null && dropAt !== null) move(dragFrom, dropAt)
                endDrag()
              },
              onDragEnd: endDrag,
            }
            const handle = (
              <button
                type="button"
                data-handle={index}
                aria-label={`Déplacer ${item.type === 'menu' ? displayName(item) : item.type === 'heading' ? `le titre ${item.label}` : 'l\'espace'} (flèches haut et bas)`}
                onPointerDown={() => setArmed(index)}
                onPointerUp={() => setArmed(null)}
                onKeyDown={e => onHandleKey(e, index)}
                className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-[6px] text-subtle-foreground hover:text-foreground active:cursor-grabbing"
              >
                <GripVertical className="size-4" />
              </button>
            )

            return (
              <div key={key} role="listitem">
                {showDropAt(index) && <DropIndicator />}
                {item.type === 'menu' ? (
                  <div
                    {...rowProps}
                    className={cn(
                      'border-b border-border',
                      isEditing && 'bg-muted',
                      dragging && 'relative z-10 rounded-[8px] bg-card ring-[1.5px] ring-primary'
                    )}
                  >
                    <div className="flex h-12 items-center gap-2.5 pr-2.5 pl-2">
                      {handle}
                      <div className={cn('flex min-w-0 flex-1 items-center gap-2.5', item.hidden && 'opacity-55')}>
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-muted text-muted-foreground ring-1 ring-border">
                          <MenuItemIcon slug={item.slug} icon={item.icon} className="size-3.5" />
                        </span>
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium text-foreground">{displayName(item)}</span>
                          {item.label && item.label !== item.title && (
                            <span className="truncate text-xs text-subtle-foreground max-sm:hidden">anciennement « {item.title} »</span>
                          )}
                          {item.hidden && (
                            <span className="flex h-5 shrink-0 items-center rounded-[5px] bg-muted px-[7px] text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                              Masqué
                            </span>
                          )}
                        </span>
                        {item.submenus > 0 && !item.hidden && (
                          <span className="shrink-0 text-xs text-subtle-foreground max-sm:hidden">
                            {item.submenus} sous-menu{item.submenus > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Renommer ${displayName(item)}`}
                        aria-pressed={isEditing}
                        onClick={() => (isEditing ? setEditing(null) : startEdit(item))}
                        className={cn(ICON_BUTTON, isEditing && 'bg-primary-muted text-primary hover:text-primary')}
                      >
                        <Pencil className="size-[15px]" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={item.slug === OWN_MENU_SLUG}
                        title={item.slug === OWN_MENU_SLUG ? 'Toujours visible : il donne accès à ces réglages' : undefined}
                        aria-label={item.hidden ? `Afficher ${displayName(item)}` : `Masquer ${displayName(item)}`}
                        onClick={() => update(index, { hidden: !item.hidden })}
                        className={ICON_BUTTON}
                      >
                        {item.hidden ? <EyeOff className="size-[15px]" /> : <Eye className="size-[15px]" />}
                      </Button>
                    </div>
                    {isEditing && (
                      <EditPanel
                        label="Nom affiché"
                        value={draft}
                        onChange={setDraft}
                        onCommit={() => commitEdit(index)}
                        onCancel={() => setEditing(null)}
                        restore={item.label && item.label !== item.title
                          ? { label: `Rétablir « ${item.title} »`, onClick: () => { update(index, { label: '' }); setEditing(null) } }
                          : undefined}
                      />
                    )}
                  </div>
                ) : (
                  <div
                    {...rowProps}
                    className={cn(
                      'border-b border-border bg-muted/50',
                      dragging && 'relative z-10 rounded-[8px] bg-card ring-[1.5px] ring-primary'
                    )}
                  >
                    <div className="flex h-10 items-center gap-2.5 pr-2.5 pl-2">
                      {handle}
                      <span className="w-7 border-t border-input" aria-hidden />
                      <span className="flex h-[22px] max-w-[60%] shrink-0 items-center gap-[5px] rounded-full bg-card px-2 text-[11.5px] font-semibold text-muted-foreground ring-1 ring-input">
                        {item.type === 'heading'
                          ? <><Heading className="size-3 shrink-0" /><span className="truncate">Titre de section : {item.label}</span></>
                          : <><SeparatorHorizontal className="size-3 shrink-0" />Espace</>}
                      </span>
                      <span className="flex-1 border-t border-input" aria-hidden />
                      {item.type === 'heading' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Renommer le titre ${item.label}`}
                          onClick={() => (isEditing ? setEditing(null) : startEdit(item))}
                          className={cn(ICON_BUTTON, isEditing && 'bg-primary-muted text-primary hover:text-primary')}
                        >
                          <Pencil className="size-[15px]" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Supprimer le séparateur"
                        onClick={() => onChange(items.filter((_, i) => i !== index))}
                        className={ICON_BUTTON}
                      >
                        <Trash2 className="size-[15px]" />
                      </Button>
                    </div>
                    {isEditing && item.type === 'heading' && (
                      <EditPanel
                        label="Titre affiché"
                        value={draft}
                        onChange={setDraft}
                        onCommit={() => commitEdit(index)}
                        onCancel={() => setEditing(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {showDropAt(items.length) && <DropIndicator />}
        </div>

        <div className="flex items-center gap-2 bg-muted px-4 py-3 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0 text-subtle-foreground" />
          Les menus ajoutés plus tard par d'autres extensions apparaîtront en bas de la liste.
        </div>
      </Card>
    </div>
  )
}

function SeparatorTypeButton({ icon, title, description, onClick }: {
  icon: React.ReactNode; title: string; description: string; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-muted">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-muted text-muted-foreground ring-1 ring-border">{icon}</span>
      <span>
        <span className="block text-[13px] font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

function EditPanel({ label, value, onChange, onCommit, onCancel, restore }: {
  label: string
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
  restore?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 pr-4 pb-4 pl-4 sm:pl-[72px]">
      <label className="flex min-w-48 flex-1 flex-col gap-1.5">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        <Input
          data-custom
          autoFocus
          value={value}
          maxLength={60}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            // Entrée ne doit pas soumettre le formulaire des réglages.
            if (e.key === 'Enter') { e.preventDefault(); onCommit() }
            if (e.key === 'Escape') { e.preventDefault(); onCancel() }
          }}
          className={INPUT}
        />
      </label>
      {restore && (
        <Button type="button" variant="ghost" className="h-[38px] gap-[5px] px-1 text-[12.5px] text-muted-foreground" onClick={restore.onClick}>
          <Undo2 className="size-[13px]" />
          {restore.label}
        </Button>
      )}
      <Button type="button" className={cn(PRIMARY_BUTTON, 'h-[38px]')} onClick={onCommit}>
        <Check className="size-4" />
        Valider
      </Button>
    </div>
  )
}

function DropIndicator() {
  return (
    <div className="flex h-3.5 items-center pr-4 pl-2.5" aria-hidden>
      <span className="size-2 shrink-0 rounded-full bg-card ring-2 ring-primary" />
      <span className="h-0.5 flex-1 bg-primary" />
    </div>
  )
}

/** Colonne de droite : aperçu du menu tel que WordPress l'affichera. */
export function AdminMenuAside({ items }: { items: EditorItem[] }) {
  const visible = previewItems(items)

  return (
    <aside className="flex shrink-0 flex-col gap-5 2xl:w-[300px]">
      <Card className={PANEL}>
        <div className="flex items-center gap-2 px-4 py-3.5">
          <Eye className="size-[15px] text-muted-foreground" />
          <div role="heading" aria-level={2} className="text-[13px] font-semibold text-foreground">Aperçu du menu</div>
        </div>
        <div className="flex justify-center border-t border-border bg-muted px-7 py-4">
          <div className="w-full max-w-60 rounded-[6px] bg-wp-menu py-2" aria-label="Aperçu du menu d'administration">
            {visible.map(item => {
              if (item.type === 'space') return <div key={keyOf(item)} className="h-3.5" />
              if (item.type === 'heading') {
                return (
                  <div key={keyOf(item)} className="px-2.5 pt-3 pb-1 text-[10px] font-semibold tracking-[0.06em] text-wp-menu-heading uppercase">
                    {item.label}
                  </div>
                )
              }
              const own = item.slug === OWN_MENU_SLUG
              return (
                <div
                  key={keyOf(item)}
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

      <Card className={cn(PANEL, 'gap-3 p-4')}>
        <div role="heading" aria-level={2} className="text-[13px] font-semibold text-foreground">Deux types de séparateurs</div>
        {[
          { icon: <SeparatorHorizontal className="size-3.5" />, title: 'Espace', text: 'Un vide pour aérer le menu.' },
          { icon: <Heading className="size-3.5" />, title: 'Titre de section', text: 'Un petit intitulé, ex. « Boutique ».' },
        ].map(row => (
          <div key={row.title} className="flex items-start gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-muted text-muted-foreground ring-1 ring-border">{row.icon}</span>
            <span>
              <span className="block text-[13px] font-semibold text-foreground">{row.title}</span>
              <span className="block text-xs text-muted-foreground">{row.text}</span>
            </span>
          </div>
        ))}
      </Card>
    </aside>
  )
}
