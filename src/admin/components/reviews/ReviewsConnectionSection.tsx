import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { ArrowUpRight, CalendarClock, Eye, EyeOff, Info, LoaderCircle, Lock, MapPin, PlugZap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ReviewsOverview, ReviewsSettings } from '@/lib/types'
import { Field } from '../controls'
import { PanelTitle, SettingsSection } from '../SettingsSection'
import { StatusBadge } from '../StatusBadge'
import { API_KEY_GUIDE_URL, PLACE_ID_FINDER_URL, diagnose, formatDateTime, formatRating } from './sync-diagnostics'

interface Props {
  form: UseFormReturn<ReviewsSettings>
  /** Réglages enregistrés : l'erreur ne vise que les identifiants réellement utilisés */
  saved: ReviewsSettings
  overview: ReviewsOverview
  syncing: boolean
  onSync: () => void
}

type TestResult = { success: boolean; error: string | null; rating: number | null; total: number | null }

const REFRESH_OPTIONS = [
  { value: 3600, label: 'Toutes les heures' },
  { value: 21600, label: 'Toutes les 6 heures' },
  { value: 86400, label: 'Une fois par jour' },
  { value: 604800, label: 'Une fois par semaine' },
]

const FIELD_INPUT = 'h-[38px] rounded-[8px] border-input bg-card px-3 font-mono text-[13px] focus-visible:border-primary focus-visible:ring-0 aria-invalid:border-destructive'

export function ReviewsConnectionSection({ form, saved, overview, syncing, onSync }: Props) {
  const { register, watch, setValue } = form
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState<TestResult | null>(null)

  const last = overview.last_sync
  const diagnostic = last && !last.success ? diagnose(last) : null
  const placeId = watch('google_place_id') ?? ''
  const apiKey = watch('google_api_key') ?? ''
  // L'erreur ne s'affiche que tant que l'identifiant en cause n'a pas été modifié.
  const keyError = diagnostic?.field === 'key' && apiKey === saved.google_api_key
  const placeError = diagnostic?.field === 'place_id' && placeId === saved.google_place_id

  const cache = Number(watch('cache_duration') ?? 3600)
  const refreshOptions = REFRESH_OPTIONS.some(o => o.value === cache)
    ? REFRESH_OPTIONS
    : [...REFRESH_OPTIONS, { value: cache, label: `Personnalisé (${cache.toLocaleString('fr-FR')} s)` }]

  async function runTest() {
    setTesting(true)
    try {
      setTest(await api.post<TestResult>('/reviews/test', { place_id: placeId, api_key: apiKey }))
    } catch (e) {
      setTest({ success: false, error: e instanceof Error ? e.message : 'Test impossible', rating: null, total: null })
    } finally {
      setTesting(false)
    }
  }

  const testRow = (hint: string) => (
    <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-4">
      <div className="min-w-0 flex-1 basis-60 text-[13px] text-muted-foreground">
        {test === null ? hint : test.success ? (
          <StatusBadge>
            Connexion réussie{test.rating !== null && ` · ${formatRating(test.rating)} ★`}{test.total !== null && ` · ${test.total} avis`}
          </StatusBadge>
        ) : (
          <span className="text-destructive">{test.error}</span>
        )}
      </div>
      <Button type="button" size="panel" className="font-semibold" disabled={testing || !placeId || !apiKey} onClick={runTest}>
        {testing ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
        Tester la connexion
      </Button>
    </div>
  )

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <SettingsSection title="Identifiants Google" description="Permettent au plugin de lire les avis de votre fiche" padded>
          <Field
            label="Place ID de votre établissement"
            htmlFor="wr-place-id"
            hint={placeError && <span className="text-destructive">Google ne trouve pas cet établissement lors de la dernière synchronisation.</span>}
          >
            <div className="flex flex-wrap gap-3">
              <Input
                id="wr-place-id"
                {...register('google_place_id')}
                placeholder="ChIJ…"
                spellCheck={false}
                aria-invalid={placeError || undefined}
                className={cn(FIELD_INPUT, 'min-w-0 flex-1 basis-64')}
              />
              <Button variant="surface" size="panel" className="h-[38px]" asChild>
                <a href={PLACE_ID_FINDER_URL} target="_blank" rel="noreferrer">
                  <MapPin className="size-4" />
                  Trouver mon Place ID
                </a>
              </Button>
            </div>
          </Field>
          <Field
            label="Clé API Google Places"
            htmlFor="wr-api-key"
            hint={keyError && <span className="text-destructive">Google a refusé cette clé lors de la dernière synchronisation.</span>}
          >
            <div className="relative">
              <Input
                id="wr-api-key"
                {...register('google_api_key')}
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder="AIza…"
                aria-invalid={keyError || undefined}
                className={cn(FIELD_INPUT, 'pr-10')}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                aria-label={showKey ? 'Masquer la clé' : 'Afficher la clé'}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-subtle-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
        </SettingsSection>

        {diagnostic && last ? (
          <SettingsSection
            title="Diagnostic"
            description={`Google a répondu « ${diagnostic.response} » le ${formatDateTime(last.timestamp)}`}
          >
            {diagnostic.steps.map((step, i) => (
              <div key={step.title} className="flex flex-wrap items-start gap-3.5 border-t border-border px-6 py-3.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-muted-foreground ring-1 ring-input">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 basis-60">
                  <div className="text-sm font-medium text-foreground">{step.title}</div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">{step.description}</div>
                </div>
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-[12.5px] font-semibold text-primary no-underline hover:underline"
                  >
                    {step.link.label}
                    <ArrowUpRight className="size-[13px]" />
                  </a>
                )}
              </div>
            ))}
            {testRow('Une fois corrigé, testez la connexion avant d\'enregistrer.')}
          </SettingsSection>
        ) : (
          <Card variant="panel">{testRow('Vérifiez que Google accepte ces identifiants, sans rien enregistrer.')}</Card>
        )}

        <SettingsSection title="Synchronisation" description="Fréquence de mise à jour des avis depuis Google" padded>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rafraîchir les avis" htmlFor="wr-refresh" hint={`Durée du cache : ${cache.toLocaleString('fr-FR')} secondes.`}>
              <Select value={String(cache)} onValueChange={v => setValue('cache_duration', Number(v), { shouldDirty: true })}>
                <SelectTrigger id="wr-refresh" className="h-[38px] w-full rounded-[8px] bg-card ring-1 ring-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {refreshOptions.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prochaine synchronisation">
              <div className="flex h-[38px] items-center gap-2 rounded-[8px] bg-muted pr-1 pl-3 ring-1 ring-border">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-[13px] text-foreground">
                  {overview.next_sync_ts ? formatDateTime(overview.next_sync_ts) : 'Non planifiée'}
                </span>
                <Button type="button" variant="surface" size="row" disabled={syncing} onClick={onSync}>
                  <RefreshCw className={cn('size-[13px]', syncing && 'animate-spin')} />
                  Synchroniser
                </Button>
              </div>
            </Field>
          </div>
          <div className="flex gap-2.5 rounded-[8px] bg-muted px-4 py-3 text-[12.5px] text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Google ne renvoie que 10 avis par synchronisation. Les avis sont conservés d'une synchro à l'autre : votre catalogue s'enrichit avec le temps.
          </div>
        </SettingsSection>
      </div>

      <aside className="flex shrink-0 flex-col gap-5 2xl:w-[360px]">
        <Card variant="panel" className="gap-3 p-4">
          <PanelTitle>Obtenir vos identifiants</PanelTitle>
          <ol className="flex flex-col gap-3">
            {[
              'Créez un projet sur Google Cloud Console.',
              'Activez « Places API » dans la bibliothèque d\'API.',
              'Créez une clé API, restreinte à l\'adresse IP de votre serveur.',
              'Recherchez votre établissement avec « Trouver mon Place ID ».',
            ].map((text, i) => (
              <li key={text} className="flex gap-2.5 text-[12.5px] text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-muted text-[11px] font-semibold text-primary-strong">{i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
          <a
            href={API_KEY_GUIDE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary no-underline hover:underline"
          >
            Guide détaillé avec captures
            <ArrowUpRight className="size-[13px]" />
          </a>
        </Card>
        <Card variant="panel" className="flex-row gap-2.5 p-4 text-[12.5px] text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" />
          Votre clé API n'est jamais affichée sur votre site : elle reste côté serveur.
        </Card>
      </aside>
    </>
  )
}
