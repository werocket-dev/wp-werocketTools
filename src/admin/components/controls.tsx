import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Libellé de champ (13 px) avec aide optionnelle sous le contrôle. */
export function Field({ label, hint, htmlFor, children, className }: {
  label: React.ReactNode
  hint?: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">{label}</label>
      {children}
      {hint && <div className="text-xs text-subtle-foreground">{hint}</div>}
    </div>
  )
}

export interface SegmentOption<T extends string | number> {
  value: T
  label: React.ReactNode
  icon?: LucideIcon
}

/** Choix exclusif en segments (maquettes : fond grisé, segment actif blanc). */
export function SegmentedControl<T extends string | number>({ value, options, onChange, size = 'md', label, className }: {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  /** md : pleine largeur (formulaires) ; sm : compact (barre d'outils) */
  size?: 'sm' | 'md'
  /** Libellé accessible du groupe */
  label: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex gap-0.5 rounded-[8px] bg-muted p-0.5 ring-1 ring-border', size === 'md' && 'w-full', className)}
    >
      {options.map(({ value: v, label: optionLabel, icon: Icon }) => {
        const active = v === value
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[6px] transition-colors',
              size === 'md' ? 'h-[30px] flex-1 px-2 text-[12.5px]' : 'h-[26px] px-2 text-xs',
              active
                ? 'bg-card font-semibold text-foreground shadow-xs [&>svg]:text-foreground'
                : 'font-medium text-muted-foreground hover:text-foreground [&>svg]:text-subtle-foreground'
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/**
 * Couleur avec « Auto » : '' = couleur par défaut du rendu (affichée en
 * grisé avec la pastille Auto). Pastille de couleur cliquable (sélecteur
 * natif) + saisie hexadécimale.
 */
export function ColorField({ id, label, value, auto, onChange }: {
  id: string
  label: string
  value: string
  /** Couleur utilisée quand la valeur est vide */
  auto: string
  onChange: (value: string) => void
}) {
  const picker = useRef<HTMLInputElement>(null)
  const isAuto = value === ''
  const shown = isAuto ? auto : value
  // Brouillon de saisie : « #FB » n'est pas encore une couleur valide.
  const [draft, setDraft] = useState(shown.toUpperCase())
  useEffect(() => setDraft(shown.toUpperCase()), [shown])

  return (
    <Field label={label} htmlFor={id}>
      <div className="flex h-[38px] items-center gap-2 rounded-[8px] bg-card pr-2 pl-1.5 ring-1 ring-input focus-within:ring-[1.5px] focus-within:ring-primary">
        <button
          type="button"
          onClick={() => picker.current?.click()}
          aria-label={`Choisir la couleur ${label}`}
          className="size-[26px] shrink-0 rounded-[5px] ring-1 ring-foreground/10 ring-inset"
          style={{ backgroundColor: shown }}
        />
        <input
          ref={picker}
          type="color"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          value={shown.length === 4 ? `#${[...shown.slice(1)].map(c => c + c).join('')}` : shown}
          onChange={e => onChange(e.target.value.toLowerCase())}
        />
        <Input
          id={id}
          value={draft}
          spellCheck={false}
          maxLength={7}
          onChange={e => {
            const v = e.target.value.trim()
            setDraft(v.toUpperCase())
            if (HEX.test(v)) onChange(v.toLowerCase())
          }}
          onBlur={() => setDraft(shown.toUpperCase())}
          className={cn(
            'h-full flex-1 rounded-none border-0 bg-transparent px-0 font-mono text-[12.5px] focus-visible:ring-0',
            isAuto && 'text-muted-foreground'
          )}
        />
        {isAuto ? (
          <span className="flex h-5 shrink-0 items-center rounded-[5px] bg-primary-muted px-1.5 text-[11px] font-semibold text-primary-strong">
            Auto
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex h-5 shrink-0 items-center rounded-[5px] px-1.5 text-[11px] font-semibold text-subtle-foreground ring-1 ring-border hover:text-foreground"
            title="Revenir à la couleur automatique"
          >
            Auto
          </button>
        )}
      </div>
    </Field>
  )
}

/** Nombre entier avec boutons − / +. */
export function NumberStepper({ id, value, min, max, onChange }: {
  id: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  const button = 'flex h-full w-10 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40'
  return (
    <div className="inline-flex h-[38px] w-fit items-stretch overflow-hidden rounded-[8px] bg-card ring-1 ring-input">
      <button type="button" className={button} aria-label="Diminuer" disabled={value <= min} onClick={() => onChange(clamp(value - 1))}>
        <Minus className="size-3.5" />
      </button>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={e => {
          const n = parseInt(e.target.value, 10)
          if (!Number.isNaN(n)) onChange(clamp(n))
        }}
        className="h-full w-16 rounded-none border-x border-y-0 border-border bg-transparent px-0 text-center text-sm focus-visible:ring-0"
      />
      <button type="button" className={button} aria-label="Augmenter" disabled={value >= max} onClick={() => onChange(clamp(value + 1))}>
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
