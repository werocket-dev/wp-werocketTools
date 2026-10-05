import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { BadgeCheck, GalleryHorizontal, LayoutDashboard, PlugZap } from 'lucide-react'
import { api } from '@/lib/api'
import type { ReviewsOverview, ReviewsSettings as TReviewsSettings, ReviewsSyncResult } from '@/lib/types'
import { Spinner } from '../components/Spinner'
import { CopyChip } from '../components/CopyChip'
import { SectionNav, type SectionNavGroup } from '../components/SectionNav'
import { useRegisterSaveForm } from '../context/SaveContext'
import { usePageStatus } from '../context/PageStatusContext'
import { ReviewsOverviewSection } from '../components/reviews/ReviewsOverviewSection'
import { ReviewsConnectionSection } from '../components/reviews/ReviewsConnectionSection'
import { ReviewsWidgetSection } from '../components/reviews/ReviewsWidgetSection'
import { ReviewsBadgeSection } from '../components/reviews/ReviewsBadgeSection'
import type { ReviewsSection } from '../components/reviews/summary'

const FORM_ID = 'wr-form-reviews'
const SECTIONS: ReviewsSection[] = ['overview', 'connection', 'widget', 'badge']

function initialSection(): ReviewsSection {
  const param = new URLSearchParams(window.location.search).get('section') as ReviewsSection | null
  return param && SECTIONS.includes(param) ? param : 'overview'
}

export function ReviewsSettings() {
  const [saved, setSaved] = useState<TReviewsSettings | null>(null)
  const [overview, setOverview] = useState<ReviewsOverview | null>(null)
  const [section, setSection] = useState<ReviewsSection>(initialSection)
  const [syncing, setSyncing] = useState(false)

  const form = useForm<TReviewsSettings>()
  const { handleSubmit, reset, getValues, formState } = form
  const { setSaving } = useRegisterSaveForm(FORM_ID, formState.isDirty)

  const loadOverview = useCallback(() => api.get<ReviewsOverview>('/reviews/overview').then(setOverview), [])

  useEffect(() => {
    Promise.all([api.get<{ settings: TReviewsSettings }>('/settings/google_reviews'), loadOverview()])
      .then(([{ settings }]) => { reset(settings); setSaved(settings) })
      .catch(e => toast.error(e instanceof Error ? e.message : 'Chargement impossible'))
  }, [reset, loadOverview])

  const last = overview?.last_sync ?? null
  const failed = last !== null && !last.success
  usePageStatus(failed
    ? { tone: 'destructive', label: 'Synchronisation en échec' }
    : last ? null : { tone: 'neutral', label: 'Jamais synchronisé' })

  async function save(data: TReviewsSettings) {
    const { settings } = await api.put<{ settings: TReviewsSettings }>('/settings/google_reviews', { settings: data })
    reset(settings)
    setSaved(settings)
  }

  async function onSubmit(data: TReviewsSettings) {
    setSaving(true)
    try {
      await save(data)
      toast.success('Réglages enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  async function sync() {
    setSyncing(true)
    try {
      // Enregistre d'abord : la synchronisation lit les identifiants en base.
      if (formState.isDirty) await save(getValues())
      const result = await api.post<{ last_sync: ReviewsSyncResult }>('/reviews/refresh', {})
      await loadOverview()
      if (result.last_sync.success) toast.success(`Avis synchronisés : ${result.last_sync.count} au catalogue`)
      else toast.error('La synchronisation a échoué : consultez le diagnostic.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  function changeSection(next: ReviewsSection) {
    setSection(next)
    const url = new URL(window.location.href)
    url.searchParams.set('section', next)
    window.history.replaceState({}, '', url)
  }

  if (!saved || !overview) return <Spinner />

  const groups: SectionNavGroup<ReviewsSection>[] = [
    {
      label: 'Configuration',
      items: [
        { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
        {
          id: 'connection',
          label: 'Connexion Google',
          icon: PlugZap,
          meta: failed && <span className="text-xs font-semibold text-destructive">Erreur</span>,
        },
      ],
    },
    {
      label: 'Widgets',
      items: [
        { id: 'widget', label: 'Widget d\'avis', icon: GalleryHorizontal },
        { id: 'badge', label: 'Badge de note', icon: BadgeCheck },
      ],
    },
  ]

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 lg:flex-row">
      <SectionNav
        groups={groups}
        current={section}
        onChange={changeSection}
        footer={
          <>
            <div className="text-xs font-semibold text-muted-foreground">Shortcodes</div>
            <CopyChip size="sm" text="[werocket_reviews]" />
            <CopyChip size="sm" text="[werocket_reviews_badge]" />
          </>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col gap-8 2xl:flex-row">
        {section === 'overview' && (
          <ReviewsOverviewSection settings={saved} overview={overview} syncing={syncing} onSync={sync} onNavigate={changeSection} />
        )}
        {section === 'connection' && (
          <ReviewsConnectionSection form={form} saved={saved} overview={overview} syncing={syncing} onSync={sync} />
        )}
        {section === 'widget' && <ReviewsWidgetSection form={form} catalog={overview.reviews} />}
        {section === 'badge' && <ReviewsBadgeSection form={form} meta={overview.meta} />}
      </div>
    </form>
  )
}
