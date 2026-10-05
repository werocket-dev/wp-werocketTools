import { ArrowUpRight, BadgeCheck, ChevronRight, CloudAlert, CloudCheck, CloudCog, GalleryHorizontal, RefreshCw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, Stars } from '@/frontend/reviews/templates'
import { RatingBadgeView } from '@/frontend/reviews/RatingBadge'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ReviewsOverview, ReviewsSettings } from '@/lib/types'
import { PanelTitle, SettingsSection } from '../SettingsSection'
import { diagnose, formatDateTime, formatRating } from './sync-diagnostics'
import { badgeProps, badgeSummary, widgetSummary, type ReviewsSection } from './summary'

interface Props {
  settings: ReviewsSettings
  overview: ReviewsOverview
  syncing: boolean
  onSync: () => void
  onNavigate: (section: ReviewsSection) => void
}

const LATEST_COUNT = 5

export function ReviewsOverviewSection({ settings, overview, syncing, onSync, onNavigate }: Props) {
  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <SyncCard overview={overview} syncing={syncing} onSync={onSync} onNavigate={onNavigate} />
        <StatsCard settings={settings} overview={overview} />
        <LatestReviews overview={overview} placeId={settings.google_place_id} />
      </div>
      <aside className="flex shrink-0 flex-col gap-5 2xl:w-[360px]">
        <Card variant="panel">
          <PanelTitle className="px-4 pt-4 pb-3">Vos widgets</PanelTitle>
          {[
            { section: 'widget' as const, icon: GalleryHorizontal, title: 'Widget d\'avis', text: widgetSummary(settings) },
            { section: 'badge' as const, icon: BadgeCheck, title: 'Badge de note', text: badgeSummary(settings) },
          ].map(({ section, icon: Icon, title, text }) => (
            <button
              key={section}
              type="button"
              onClick={() => onNavigate(section)}
              className="flex items-center gap-3 border-t border-border px-4 py-3 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-primary-muted text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-foreground">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{text}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-subtle-foreground" />
            </button>
          ))}
        </Card>
        <Card variant="panel" className="gap-3 p-4">
          <PanelTitle>Aperçu du badge</PanelTitle>
          <div className="flex justify-center rounded-[8px] bg-muted px-4 py-8">
            <RatingBadgeView {...badgeProps(settings, overview.meta)} />
          </div>
        </Card>
      </aside>
    </>
  )
}

function SyncCard({ overview, syncing, onSync, onNavigate }: Omit<Props, 'settings'>) {
  const last = overview.last_sync
  const failed = last !== null && !last.success
  const diagnostic = failed ? diagnose(last) : null

  const state = !last
    ? {
        icon: CloudCog,
        iconClass: 'bg-muted text-muted-foreground',
        title: 'Connectez votre fiche Google',
        text: 'Renseignez le Place ID de votre établissement, puis lancez une première synchronisation.',
      }
    : diagnostic
      ? {
          icon: CloudAlert,
          iconClass: 'bg-destructive/10 text-destructive',
          title: diagnostic.title,
          text: `${diagnostic.explanation}${overview.reviews.length ? ' Vos avis déjà collectés restent affichés sur le site.' : ''}`,
        }
      : {
          icon: CloudCheck,
          iconClass: 'bg-primary-muted text-primary',
          title: 'Avis synchronisés',
          text: `${last.count} avis au catalogue · dernière synchronisation ${formatRelative(last.timestamp)}.`,
        }
  const Icon = state.icon
  const needsSetup = !last || failed

  return (
    <Card variant="panel" className={cn(failed && 'ring-destructive/25')}>
      <div className="flex gap-4 p-6">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', state.iconClass)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div role="heading" aria-level={2} className="text-[17px] font-semibold tracking-[-0.2px] text-foreground">{state.title}</div>
          <p className="mt-1.5 text-[13px] text-muted-foreground">{state.text}</p>
          <div className="flex flex-wrap gap-2 pt-3.5">
            {needsSetup && (
              <Button type="button" size="panel" className="font-semibold" onClick={() => onNavigate('connection')}>
                <Wrench className="size-4" />
                {failed ? 'Résoudre le problème' : 'Configurer la connexion'}
              </Button>
            )}
            <Button type="button" variant="surface" size="panel" disabled={syncing} onClick={onSync}>
              <RefreshCw className={cn('size-4', syncing && 'animate-spin')} />
              {syncing ? 'Synchronisation…' : failed ? 'Réessayer' : 'Synchroniser'}
            </Button>
          </div>
        </div>
      </div>
      {(last || overview.next_sync_ts) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border bg-muted px-6 py-2.5 text-xs">
          {last && (
            <span className="text-muted-foreground">
              {failed ? 'Dernière tentative' : 'Dernière synchronisation'} : {formatDateTime(last.timestamp)}
            </span>
          )}
          {overview.next_sync_ts && (
            <span className="text-subtle-foreground">
              {failed ? 'Prochain essai automatique' : 'Prochaine synchronisation'} : {formatDateTime(overview.next_sync_ts)}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}

function StatsCard({ settings, overview }: { settings: ReviewsSettings; overview: ReviewsOverview }) {
  const { meta } = overview
  const minRating = Number(settings.min_rating ?? 4)
  const cells = [
    {
      label: 'Note moyenne',
      value: meta ? formatRating(meta.rating) : '—',
      extra: meta && <Stars rating={Math.round(meta.rating)} size={12} />,
    },
    { label: 'Avis sur Google', value: meta ? String(meta.total) : '—', extra: 'Sur votre fiche Business Profile' },
    { label: 'Avis conservés', value: String(overview.reviews.length), extra: 'Le catalogue s\'enrichit à chaque synchro' },
    {
      label: 'Note minimale affichée',
      value: minRating <= 1 ? 'Toutes' : minRating >= 5 ? '5' : `${minRating}+`,
      extra: minRating <= 1 ? 'Tous les avis sont affichés' : 'Les avis inférieurs sont masqués',
    },
  ]

  return (
    <Card variant="panel" className="grid grid-cols-2 lg:grid-cols-4">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={cn(
            'flex flex-col gap-1 border-border px-5 py-4',
            i % 2 === 1 && 'border-l',
            i >= 2 && 'border-t lg:border-t-0',
            i === 2 && 'lg:border-l'
          )}
        >
          <span className="text-xs text-muted-foreground">{cell.label}</span>
          <span className="text-[22px] font-semibold tracking-[-0.3px] text-foreground tabular-nums">{cell.value}</span>
          {typeof cell.extra === 'string' ? <span className="text-xs text-subtle-foreground">{cell.extra}</span> : cell.extra}
        </div>
      ))}
    </Card>
  )
}

function LatestReviews({ overview, placeId }: { overview: ReviewsOverview; placeId: string }) {
  const { reviews } = overview
  return (
    <SettingsSection
      title="Derniers avis collectés"
      description={reviews.length
        ? `${reviews.length} avis conservés · affichés du plus récent au plus ancien`
        : 'Aucun avis collecté pour l\'instant : ils apparaîtront après la première synchronisation réussie.'}
    >
      {reviews.slice(0, LATEST_COUNT).map(review => (
        <div key={`${review.author_name}-${review.time}`} className="flex gap-3.5 border-t border-border px-6 py-3.5">
          <Avatar review={review} size={32} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="text-[13.5px] font-semibold text-foreground">{review.author_name}</span>
              <Stars rating={review.rating} size={12} />
              <span className="text-xs text-subtle-foreground">{review.relative_time_description}</span>
            </div>
            {review.text && <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{review.text}</p>}
          </div>
        </div>
      ))}
      {placeId && (
        <a
          href={`https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1 border-t border-border px-6 py-3 text-[12.5px] font-semibold text-primary no-underline hover:underline"
        >
          Voir sur Google Business Profile
          <ArrowUpRight className="size-[13px]" />
        </a>
      )}
    </SettingsSection>
  )
}
