import type { PathValue, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { Code, Copy, Eye, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RatingBadgeView } from '@/frontend/reviews/RatingBadge'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import type { ReviewsMeta, ReviewsSettings } from '@/lib/types'
import { ColorField } from '../controls'
import { PanelTitle, SettingsSection, SettingSwitchRow } from '../SettingsSection'
import { formatRating } from './sync-diagnostics'
import { DEMO_META, badgeProps } from './summary'

interface Props {
  form: UseFormReturn<ReviewsSettings>
  meta: ReviewsMeta | null
}

/** Couleurs « Auto » du badge (RatingBadge.tsx). */
const AUTO_COLORS = { rating: '#1F1F1F', star: '#FBBC04', count: '#5F6368' }

type BadgeFlag = 'badge_show_logo' | 'badge_show_rating' | 'badge_show_stars' | 'badge_show_count' | 'badge_card'

export function ReviewsBadgeSection({ form, meta }: Props) {
  const { watch, setValue } = form
  const settings = watch()
  const { rating, total } = meta ?? DEMO_META
  const flag = (key: BadgeFlag) => watch(key) !== false
  const setFlag = (key: BadgeFlag, v: boolean) => setValue(key, v as PathValue<ReviewsSettings, BadgeFlag>, { shouldDirty: true })
  const setColor = (key: 'badge_rating_color' | 'badge_star_color' | 'badge_count_color', v: string) =>
    setValue(key, v, { shouldDirty: true })

  const shortcode = [
    '[werocket_reviews_badge',
    `  logo="${flag('badge_show_logo')}" note="${flag('badge_show_rating')}"`,
    `  etoiles="${flag('badge_show_stars')}" avis="${flag('badge_show_count')}"`,
    `  carte="${flag('badge_card')}"]`,
  ].join('\n')

  async function copy() {
    if (await copyToClipboard(shortcode.replace(/\n\s*/g, ' '))) toast.success('Shortcode copié')
    else toast.error('Copie impossible')
  }

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <Card variant="panel" className="flex-row items-center gap-3 px-6 py-3.5 text-[13px] text-muted-foreground">
          <Lightbulb className="size-4 shrink-0" />
          Idéal dans un en-tête, un pied de page ou à côté d'un bouton d'appel à l'action.
        </Card>

        <SettingsSection title="Éléments affichés" description="Composez votre badge">
          <SettingSwitchRow title="Logo Google" description="Rassure sur la provenance de la note" checked={flag('badge_show_logo')} onCheckedChange={v => setFlag('badge_show_logo', v)} />
          <SettingSwitchRow title="Note moyenne" description={`${formatRating(rating)} sur 5`} checked={flag('badge_show_rating')} onCheckedChange={v => setFlag('badge_show_rating', v)} />
          <SettingSwitchRow title="Étoiles" description="Représentation visuelle de la note" checked={flag('badge_show_stars')} onCheckedChange={v => setFlag('badge_show_stars', v)} />
          <SettingSwitchRow title="Nombre d'avis" description={`« ${total} avis sur Google »`} checked={flag('badge_show_count')} onCheckedChange={v => setFlag('badge_show_count', v)} />
        </SettingsSection>

        <SettingsSection title="Style" description="Apparence du conteneur">
          <SettingSwitchRow
            title="Fond de carte"
            description="Désactivé, le badge devient transparent, sans bordure ni marge, et se fond dans votre design."
            checked={flag('badge_card')}
            onCheckedChange={v => setFlag('badge_card', v)}
          />
        </SettingsSection>

        <SettingsSection title="Couleurs" description="Laissez « Auto » pour reprendre les couleurs officielles de Google" padded>
          <div className="grid gap-3.5 sm:grid-cols-3">
            <ColorField id="wr-badge-rating" label="Note" value={watch('badge_rating_color') ?? ''} auto={AUTO_COLORS.rating} onChange={v => setColor('badge_rating_color', v)} />
            <ColorField id="wr-badge-star" label="Étoiles" value={watch('badge_star_color') ?? ''} auto={AUTO_COLORS.star} onChange={v => setColor('badge_star_color', v)} />
            <ColorField id="wr-badge-count" label="Nombre d'avis" value={watch('badge_count_color') ?? ''} auto={AUTO_COLORS.count} onChange={v => setColor('badge_count_color', v)} />
          </div>
        </SettingsSection>
      </div>

      <aside className="flex shrink-0 flex-col gap-5 2xl:w-[400px]">
        <Card variant="panel">
          <div className="flex items-center gap-2 px-4 py-3.5">
            <Eye className="size-[15px] text-muted-foreground" />
            <PanelTitle>Aperçu en direct</PanelTitle>
          </div>
          {(['light', 'dark'] as const).map(bg => (
            <div
              key={bg}
              className={cn('flex flex-col items-center gap-3 px-6 py-7', bg === 'light' ? 'border-t border-border bg-preview-light' : 'bg-preview-dark')}
            >
              <RatingBadgeView {...badgeProps(settings, meta)} />
              <span className={cn('text-xs', bg === 'light' ? 'text-subtle-foreground' : 'text-inverse-muted-foreground')}>
                {bg === 'light' ? 'Sur fond clair' : 'Sur fond sombre'}
              </span>
            </div>
          ))}
        </Card>

        <div className="overflow-hidden rounded-[12px] bg-inverse text-inverse-foreground">
          <div className="flex items-center gap-2 px-4 py-3">
            <Code className="size-[15px] text-inverse-muted-foreground" />
            <span className="flex-1 text-[13px] font-semibold">Shortcode généré</span>
            <Button
              type="button"
              variant="ghost"
              size="row"
              className="bg-inverse-foreground/10 text-inverse-foreground hover:bg-inverse-foreground/15 hover:text-inverse-foreground"
              onClick={copy}
            >
              <Copy className="size-[13px]" />
              Copier
            </Button>
          </div>
          <pre className="m-0 overflow-x-auto px-4 pb-3 font-mono text-[12.5px] leading-relaxed text-inverse-accent">{shortcode}</pre>
          <p className="m-0 px-4 pb-4 text-xs text-inverse-muted-foreground">
            Suit vos réglages en temps réel. Utilisez [werocket_reviews_badge] seul pour reprendre toujours les réglages ci-contre.
          </p>
        </div>
      </aside>
    </>
  )
}
