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
import { MenuItemIcon } from './MenuItemIcon'
import { IconChip, SEPARATOR_TYPES, SeparatorTypeInfo } from './MenuParts'
import { OWN_MENU_SLUG, describeItem, displayName, itemKey, newId, type EditorItem } from './menu-model'

interface Props {
  items: EditorItem[]
  onChange: (items: EditorItem[]) => void
  onReset: () => void
}

/** Élément en cours de déplacement : soulevé au-dessus de la liste. */
const DRAGGING = 'relative z-10 rounded-[8px] bg-card ring-[1.5px] ring-primary'

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
  const hiddenCount = menus.filter(m => m.hidden).length

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

  function startEdit(item: Exclude<EditorItem, { type: 'space' }>) {
    setEditing(itemKey(item))
    setDraft(item.type === 'menu' ? displayName(item) : item.label)
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
    if (item.type === 'heading') startEdit(item)
    toast.info('Séparateur ajouté en haut de la liste : glissez-le à sa place.')
  }

  /** Flèches haut/bas sur la poignée : alternative clavier au glisser-déposer. */
  function onHandleKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const up = e.key === 'ArrowUp'
    if ((up && index === 0) || (!up && index === items.length - 1)) return
    move(index, up ? index - 1 : index + 2)
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`[data-handle="${up ? index - 1 : index + 1}"]`)?.focus()
    })
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
        <Button type="button" variant="ghost" size="panel" className="gap-1.5 px-2.5 text-muted-foreground" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          Ordre par défaut
        </Button>
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="surface" size="panel">
              <SeparatorHorizontal className="size-4" />
              Ajouter un séparateur
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 gap-1 rounded-xl p-1.5">
            {SEPARATOR_TYPES.map(({ type, ...info }) => (
              <button
                key={type}
                type="button"
                onClick={() => addSeparator(type)}
                className="flex items-start gap-2.5 rounded-lg p-2 text-left hover:bg-muted"
              >
                <SeparatorTypeInfo {...info} />
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <Card variant="panel">
        <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-2">
          <span className="flex-1 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase">Élément du menu</span>
          <span className="text-[11.5px] text-subtle-foreground">
            {menus.length} menus · {separators} séparateur{separators > 1 ? 's' : ''} · {hiddenCount} masqué{hiddenCount > 1 ? 's' : ''}
          </span>
        </div>

        <div ref={listRef} role="list" onDragLeave={e => { if (e.currentTarget === e.target) setDropAt(null) }}>
          {items.map((item, index) => {
            const isEditing = editing === itemKey(item)
            return (
              <div key={itemKey(item)} role="listitem">
                {showDropAt(index) && <DropIndicator />}
                <div
                  draggable={armed === index}
                  onDragStart={e => {
                    setDragFrom(index)
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', itemKey(item))
                  }}
                  onDragOver={e => {
                    if (dragFrom === null) return
                    e.preventDefault()
                    const rect = e.currentTarget.getBoundingClientRect()
                    setDropAt(e.clientY < rect.top + rect.height / 2 ? index : index + 1)
                  }}
                  onDrop={e => {
                    e.preventDefault()
                    if (dragFrom !== null && dropAt !== null) move(dragFrom, dropAt)
                    endDrag()
                  }}
                  onDragEnd={endDrag}
                  className={cn(
                    'border-b border-border',
                    item.type === 'menu' ? isEditing && 'bg-muted' : 'bg-muted/50',
                    dragFrom === index && DRAGGING
                  )}
                >
                  <div className={cn('flex items-center gap-2.5 pr-2.5 pl-2', item.type === 'menu' ? 'h-12' : 'h-10')}>
                    <button
                      type="button"
                      data-handle={index}
                      aria-label={`Déplacer ${describeItem(item)} (flèches haut et bas)`}
                      onPointerDown={() => setArmed(index)}
                      onPointerUp={() => setArmed(null)}
                      onKeyDown={e => onHandleKey(e, index)}
                      className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded-[6px] text-subtle-foreground hover:text-foreground active:cursor-grabbing"
                    >
                      <GripVertical className="size-4" />
                    </button>

                    {item.type === 'menu' ? (
                      <div className={cn('flex min-w-0 flex-1 items-center gap-2.5', item.hidden && 'opacity-55')}>
                        <IconChip><MenuItemIcon slug={item.slug} icon={item.icon} className="size-3.5" /></IconChip>
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
                    ) : (
                      <>
                        <span className="w-7 border-t border-input" aria-hidden />
                        <span className="flex h-[22px] max-w-[60%] shrink-0 items-center gap-[5px] rounded-full bg-card px-2 text-[11.5px] font-semibold text-muted-foreground ring-1 ring-input">
                          {item.type === 'heading'
                            ? <><Heading className="size-3 shrink-0" /><span className="truncate">Titre de section : {item.label}</span></>
                            : <><SeparatorHorizontal className="size-3 shrink-0" />Espace</>}
                        </span>
                        <span className="flex-1 border-t border-input" aria-hidden />
                      </>
                    )}

                    {item.type !== 'space' && (
                      <Button
                        type="button"
                        variant="subtle"
                        size="icon-row"
                        aria-label={`Renommer ${describeItem(item)}`}
                        aria-pressed={isEditing}
                        onClick={() => (isEditing ? setEditing(null) : startEdit(item))}
                      >
                        <Pencil className="size-[15px]" />
                      </Button>
                    )}
                    {item.type === 'menu' ? (
                      <Button
                        type="button"
                        variant="subtle"
                        size="icon-row"
                        disabled={item.slug === OWN_MENU_SLUG}
                        title={item.slug === OWN_MENU_SLUG ? 'Toujours visible : il donne accès à ces réglages' : undefined}
                        aria-label={`${item.hidden ? 'Afficher' : 'Masquer'} ${displayName(item)}`}
                        onClick={() => update(index, { hidden: !item.hidden })}
                      >
                        {item.hidden ? <EyeOff className="size-[15px]" /> : <Eye className="size-[15px]" />}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="subtle"
                        size="icon-row"
                        aria-label={`Supprimer ${describeItem(item)}`}
                        onClick={() => onChange(items.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-[15px]" />
                      </Button>
                    )}
                  </div>

                  {isEditing && item.type !== 'space' && (
                    <EditPanel
                      label={item.type === 'menu' ? 'Nom affiché' : 'Titre affiché'}
                      value={draft}
                      onChange={setDraft}
                      onCommit={() => commitEdit(index)}
                      onCancel={() => setEditing(null)}
                      restore={item.type === 'menu' && item.label && item.label !== item.title
                        ? { label: `Rétablir « ${item.title} »`, onClick: () => { update(index, { label: '' }); setEditing(null) } }
                        : undefined}
                    />
                  )}
                </div>
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
          autoFocus
          value={value}
          maxLength={60}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            // Entrée ne doit pas soumettre le formulaire des réglages.
            if (e.key === 'Enter') { e.preventDefault(); onCommit() }
            if (e.key === 'Escape') { e.preventDefault(); onCancel() }
          }}
          className="h-[38px] rounded-[8px] border-input bg-card px-3 text-sm focus-visible:border-primary focus-visible:ring-0"
        />
      </label>
      {restore && (
        <Button type="button" variant="ghost" className="h-[38px] gap-[5px] px-1 text-[12.5px] text-muted-foreground" onClick={restore.onClick}>
          <Undo2 className="size-[13px]" />
          {restore.label}
        </Button>
      )}
      <Button type="button" size="panel" className="h-[38px] font-semibold" onClick={onCommit}>
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
