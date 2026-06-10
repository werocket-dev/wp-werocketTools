import type { UseFormWatch, UseFormSetValue, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  IconLayoutGrid, IconLayoutList, IconCarouselHorizontal,
  IconColumns3, IconSpacingHorizontal, IconBoxPadding, IconBorderRadius, IconShadow,
  IconPlayerPlay, IconRepeat, IconArrowAutofitContent, IconCircles, IconStack2,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { ResponsiveControl } from './ResponsiveControl'
import { FigmaSlider } from './FigmaSlider'
import { PresetButtons } from './PresetButtons'
import type { ReviewsSettings, ResponsiveValue, CardShadow, ReviewTemplate } from '@/lib/types'

const LAYOUTS = [
  { value: 'grid',     label: 'Grille',    description: 'Multi-colonnes',     Icon: IconLayoutGrid },
  { value: 'list',     label: 'Liste',     description: 'Vertical compact',   Icon: IconLayoutList },
  { value: 'carousel', label: 'Carrousel', description: 'Défilement horizontal', Icon: IconCarouselHorizontal },
] as const

const SHADOW_PRESETS: { value: CardShadow; label: string }[] = [
  { value: 'none',   label: 'Aucune' },
  { value: 'subtle', label: 'Subtile' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'strong', label: 'Forte' },
]

const COLS_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
]

interface Props {
  watch: UseFormWatch<ReviewsSettings>
  setValue: UseFormSetValue<ReviewsSettings>
  register: UseFormRegister<ReviewsSettings>
}

export function LayoutBuilder({ watch, setValue, register }: Props) {
  const layout = watch('display_style') || 'grid'
  const template = (watch('template') as ReviewTemplate) || 'classic'
  const isMinimal = template === 'minimal'

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          {/* ── Layouts (colonne gauche) ── */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Disposition
            </Label>
            <div className="space-y-1.5">
              {LAYOUTS.map(({ value, label, description, Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setValue('display_style', value)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                    layout === value
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-foreground/30 bg-card'
                  )}
                >
                  <Icon
                    size={20}
                    className={layout === value ? 'text-primary shrink-0' : 'text-muted-foreground shrink-0'}
                  />
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-sm font-medium', layout === value ? 'text-primary' : 'text-foreground')}>
                      {label}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Paramètres (colonne droite) ── */}
          <div className="space-y-5 md:border-l md:border-border/60 md:pl-6">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Paramètres
            </Label>

            {/* Colonnes (grille uniquement) */}
            {layout === 'grid' && (
              <ResponsiveControl<number>
                label="Colonnes"
                icon={<IconColumns3 size={13} />}
                value={watch('grid_columns') as ResponsiveValue<number>}
                onChange={v => setValue('grid_columns', v)}
              >
                {(_bp, value, onChange) => (
                  <PresetButtons
                    value={value}
                    onChange={onChange}
                    options={COLS_OPTIONS}
                  />
                )}
              </ResponsiveControl>
            )}

            {/* Slides visibles (carrousel uniquement) */}
            {layout === 'carousel' && (
              <ResponsiveControl<number>
                label="Slides visibles"
                icon={<IconStack2 size={13} />}
                value={watch('carousel_slides') as ResponsiveValue<number>}
                onChange={v => setValue('carousel_slides', v)}
              >
                {(_bp, value, onChange) => (
                  <PresetButtons
                    value={value}
                    onChange={onChange}
                    options={COLS_OPTIONS}
                  />
                )}
              </ResponsiveControl>
            )}

            {/* Espacement (toujours) */}
            <ResponsiveControl<number>
              label="Espacement"
              icon={<IconSpacingHorizontal size={13} />}
              value={watch('grid_gap') as ResponsiveValue<number>}
              onChange={v => setValue('grid_gap', v)}
            >
              {(_bp, value, onChange) => (
                <FigmaSlider
                  value={value}
                  onChange={onChange}
                  min={0}
                  max={48}
                  presets={[0, 8, 16, 24, 32, 48]}
                />
              )}
            </ResponsiveControl>

            {/* Padding carte (sauf minimal) */}
            {!isMinimal && (
              <ResponsiveControl<number>
                label="Padding carte"
                icon={<IconBoxPadding size={13} />}
                value={watch('card_padding') as ResponsiveValue<number>}
                onChange={v => setValue('card_padding', v)}
              >
                {(_bp, value, onChange) => (
                  <FigmaSlider
                    value={value}
                    onChange={onChange}
                    min={8}
                    max={40}
                    presets={[8, 16, 20, 24, 32, 40]}
                  />
                )}
              </ResponsiveControl>
            )}

            {/* Border radius (global, sauf minimal) */}
            {!isMinimal && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconBorderRadius size={13} />
                  Coins arrondis
                </Label>
                <FigmaSlider
                  value={Number(watch('card_radius') ?? 12)}
                  onChange={v => setValue('card_radius', v)}
                  min={0}
                  max={32}
                  presets={[0, 4, 8, 12, 16, 24, 32]}
                />
              </div>
            )}

            {/* Ombre (global, sauf minimal) */}
            {!isMinimal && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconShadow size={13} />
                  Intensité d'ombre
                </Label>
                <PresetButtons<CardShadow>
                  value={(watch('card_shadow') as CardShadow) ?? 'subtle'}
                  onChange={v => setValue('card_shadow', v)}
                  options={SHADOW_PRESETS}
                />
              </div>
            )}

            {isMinimal && (
              <p className="text-[11px] text-muted-foreground italic leading-relaxed border-l-2 border-border pl-3">
                Le template Minimal n'utilise pas de carte — padding, coins et ombre n'ont pas d'effet.
              </p>
            )}

            {/* Carrousel : toggles séparés */}
            {layout === 'carousel' && (
              <div className="pt-4 border-t border-border/60 space-y-3">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Comportement carrousel
                </Label>
                <CarouselToggles watch={watch} setValue={setValue} register={register} />
              </div>
            )}
      </div>
    </div>
  )
}

function CarouselToggles({ watch, setValue, register }: Props) {
  const autoplay = !!watch('carousel_autoplay')
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
      <ToggleRow
        label="Défilement automatique"
        icon={<IconPlayerPlay size={14} />}
        checked={autoplay}
        onChange={v => setValue('carousel_autoplay', v)}
      />
      <ToggleRow
        label="Lecture en boucle"
        icon={<IconRepeat size={14} />}
        checked={watch('carousel_loop') !== false}
        onChange={v => setValue('carousel_loop', v)}
      />
      <ToggleRow
        label="Flèches de navigation"
        icon={<IconArrowAutofitContent size={14} />}
        checked={watch('carousel_show_arrows') !== false}
        onChange={v => setValue('carousel_show_arrows', v)}
      />
      <ToggleRow
        label="Points indicateurs"
        icon={<IconCircles size={14} />}
        checked={watch('carousel_show_dots') !== false}
        onChange={v => setValue('carousel_show_dots', v)}
      />
      {autoplay && (
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Vitesse (secondes)</Label>
          <Input
            {...register('carousel_autoplay_speed', { valueAsNumber: true })}
            type="number"
            min={2}
            max={30}
          />
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  label,
  icon,
  checked,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between py-2 px-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <Switch checked={!!checked} onCheckedChange={onChange} />
    </label>
  )
}
