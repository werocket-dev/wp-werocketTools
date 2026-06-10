import type { UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  IconPalette, IconTypography, IconStar, IconUserCircle, IconBrandGoogle, IconRestore,
} from '@tabler/icons-react'
import { FigmaSlider } from '../layout-builder/FigmaSlider'
import type { ReviewsSettings } from '@/lib/types'

interface Props {
  watch: UseFormWatch<ReviewsSettings>
  setValue: UseFormSetValue<ReviewsSettings>
}

export function CustomizationPanel({ watch, setValue }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div className="space-y-5">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          Couleurs
        </Label>
        <ColorField
          label="Fond des cartes"
          icon={<IconPalette size={13} />}
          fallback="#FFFFFF"
          value={watch('card_bg_color') ?? ''}
          onChange={v => setValue('card_bg_color', v)}
        />
        <ColorField
          label="Couleur du texte"
          icon={<IconTypography size={13} />}
          fallback="#1F1F1F"
          value={watch('text_color') ?? ''}
          onChange={v => setValue('text_color', v)}
        />
        <ColorField
          label="Couleur des étoiles"
          icon={<IconStar size={13} />}
          fallback="#FBBC04"
          value={watch('star_color') ?? ''}
          onChange={v => setValue('star_color', v)}
        />
      </div>

      <div className="space-y-5 md:border-l md:border-border/60 md:pl-8">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
          Éléments
        </Label>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconUserCircle size={13} />
            Taille de l'avatar
          </Label>
          <FigmaSlider
            value={Number(watch('avatar_size') ?? 40)}
            onChange={v => setValue('avatar_size', v)}
            min={24}
            max={72}
            presets={[24, 32, 40, 48, 56, 72]}
          />
        </div>

        <label className="flex items-center justify-between py-2 px-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-foreground">
            <span className="text-muted-foreground"><IconBrandGoogle size={14} /></span>
            <span>
              Mention Google
              <span className="block text-[11px] text-muted-foreground font-normal">
                Logo, badge vérifié et « Publié sur Google »
              </span>
            </span>
          </span>
          <Switch
            checked={watch('show_google_badge') !== false}
            onCheckedChange={v => setValue('show_google_badge', v)}
          />
        </label>
      </div>
    </div>
  )
}

/**
 * Champ couleur avec mode « Auto » : valeur vide = couleur par défaut
 * du template, le bouton Restore revient à ce mode.
 */
function ColorField({
  label,
  icon,
  fallback,
  value,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  fallback: string
  value: string
  onChange: (v: string) => void
}) {
  const isAuto = value === ''
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
        {isAuto && <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded-md">Auto</span>}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValid ? value : fallback}
          onChange={e => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-input cursor-pointer p-0.5 bg-background"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={`Auto (${fallback})`}
          className="font-mono text-sm flex-1"
        />
        {!isAuto && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            title="Revenir à la couleur par défaut du template"
            className="shrink-0 px-2"
          >
            <IconRestore size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}
