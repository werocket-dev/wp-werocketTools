import { useEffect, useState } from 'react'
import { useForm, type UseFormRegister } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  IconKey, IconEye, IconEyeOff, IconLoader2, IconExternalLink, IconRefresh,
  IconCircleCheck, IconAlertTriangle, IconClock, IconClipboard, IconCheck,
  IconTemplate, IconLayoutGrid, IconPalette, IconStar,
} from '@tabler/icons-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/clipboard'
import { useRegisterSaveForm } from '../context/SaveContext'
import { ReviewsPreview } from '../components/ReviewsPreview'
import { LayoutBuilder } from '../components/layout-builder/LayoutBuilder'
import { CustomizationPanel } from '../components/reviews/CustomizationPanel'
import { BadgePanel } from '../components/reviews/BadgePanel'

const FORM_ID = 'wr-form-reviews'
import { TEMPLATE_META } from '@/frontend/reviews/templates'
import type { ReviewsSettings as TReviewsSettings, ReviewTemplate } from '@/lib/types'

const PLACE_ID_FINDER_URL = 'https://developers.google.com/maps/documentation/places/web-service/place-id'

interface SyncResult {
  success: boolean
  count: number
  timestamp: number
  error: string | null
}

interface SyncStatus {
  last_sync: SyncResult | null
  next_sync_ts: number | null
}

function formatRelative(unixTs: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - unixTs
  if (diff < 60) return 'à l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`
  return new Date(unixTs * 1000).toLocaleDateString('fr-FR')
}

function formatAbsolute(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ReviewsSettings() {
  const [loading, setLoading] = useState(true)
  const { setSaving } = useRegisterSaveForm(FORM_ID)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ last_sync: null, next_sync_ts: null })
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0)
  const { register, handleSubmit, setValue, watch, reset, getValues } = useForm<TReviewsSettings>()

  useEffect(() => {
    api.get<{ settings: TReviewsSettings }>('/settings/google_reviews')
      .then(data => reset(data.settings))
      .finally(() => setLoading(false))

    api.get<SyncStatus>('/reviews/sync-status')
      .then(setSyncStatus)
      .catch(() => {/* silent */})
  }, [reset])

  async function onSubmit(data: TReviewsSettings) {
    setSaving(true)
    try {
      await api.put('/settings/google_reviews', { settings: data })
      toast.success('Paramètres avis Google enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      // Sauvegarde d'abord les réglages courants : sinon force_refresh()
      // lit l'ancien Place ID / clé API et échoue avec « champ manquant »
      // alors que le formulaire est rempli.
      await api.put('/settings/google_reviews', { settings: getValues() })

      const result = await api.post<SyncStatus>('/reviews/refresh', {})
      setSyncStatus(result)
      if (result.last_sync?.success) {
        toast.success(`Avis synchronisés (${result.last_sync.count} avis récupérés)`)
        setPreviewRefreshKey(k => k + 1)
      } else {
        toast.error(result.last_sync?.error || 'Échec de la synchronisation')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <Spinner />

  const currentTemplate = (watch('template') as ReviewTemplate) || 'classic'

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-bold"><div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconKey size={16} /></div> API Google</CardTitle>
            <CardDescription>Clés nécessaires pour récupérer les avis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Place ID Google">
              <div className="flex items-center gap-2">
                <Input {...register('google_place_id')} placeholder="ChIJ..." className="flex-1" />
                <Button type="button" asChild className="shrink-0 gap-1.5 whitespace-nowrap">
                  <a href={PLACE_ID_FINDER_URL} target="_blank" rel="noreferrer noopener">
                    <IconExternalLink size={14} />
                    Trouver mon Place ID
                  </a>
                </Button>
              </div>
            </Field>
            <Field label="Clé API Google Places">
              <SecretInput registration={register('google_api_key')} placeholder="AIza..." />
            </Field>
            <Field label="Durée du cache (secondes)">
              <Input {...register('cache_duration', { valueAsNumber: true })} type="number" min={60} />
            </Field>

            <SyncBlock
              status={syncStatus}
              syncing={syncing}
              onSync={handleSync}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-bold"><div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconEye size={16} /></div> Affichage</CardTitle>
            <CardDescription>Paramètres de rendu des avis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nombre d'avis">
              <Input {...register('reviews_count', { valueAsNumber: true })} type="number" min={1} max={20} />
            </Field>
            <Field label="Note minimale">
              <Select onValueChange={v => setValue('min_rating', parseInt(v))} value={String(watch('min_rating') ?? 4)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} étoile{n > 1 ? 's' : ''} minimum</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="space-y-3 pt-1">
              <SwitchRow label="Afficher les étoiles" checked={watch('show_rating')} onChange={v => setValue('show_rating', v)} />
              <SwitchRow label="Afficher la date" checked={watch('show_date')} onChange={v => setValue('show_date', v)} />
              <SwitchRow label="Afficher les avatars" checked={watch('show_avatar')} onChange={v => setValue('show_avatar', v)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold"><div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconPalette size={16} /></div> Apparence & aperçu</CardTitle>
          <CardDescription>Template, disposition, personnalisation et rendu en temps réel</CardDescription>
          <CardAction>
            <ShortcodeClipboard code="[werocket_reviews]" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="template">
            <TabsList className="mb-5">
              <TabsTrigger value="template" className="gap-1.5">
                <IconTemplate size={14} />
                Template
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-1.5">
                <IconLayoutGrid size={14} />
                Disposition
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-1.5">
                <IconPalette size={14} />
                Personnalisation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {(Object.entries(TEMPLATE_META) as [ReviewTemplate, typeof TEMPLATE_META[ReviewTemplate]][]).map(([key, meta]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setValue('template', key)}
                    className={cn(
                      'flex flex-col items-stretch gap-2 p-2.5 rounded-2xl border-2 transition-all text-left',
                      currentTemplate === key
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-foreground/30 bg-card'
                    )}
                  >
                    <div className="aspect-[4/3] rounded-lg bg-muted/60 flex items-center justify-center p-2 overflow-hidden">
                      {meta.thumbnail}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{meta.label}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{meta.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layout">
              <LayoutBuilder watch={watch} setValue={setValue} register={register} />
            </TabsContent>

            <TabsContent value="custom">
              <CustomizationPanel watch={watch} setValue={setValue} />
            </TabsContent>
          </Tabs>

          {/* ── Sous-section Aperçu, visuellement séparée ── */}
          <div className="mt-6 pt-5 border-t border-border/60 space-y-3">
            <div className="flex items-center gap-2">
              <IconEye size={14} className="text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Aperçu en temps réel
              </span>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4 sm:p-6">
              <ReviewsPreview watch={watch} refreshKey={previewRefreshKey} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold"><div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconStar size={16} /></div> Badge note Google</CardTitle>
          <CardDescription>Logo Google, note, étoiles et nombre d'avis — idéal pour un header ou un footer</CardDescription>
          <CardAction>
            <ShortcodeClipboard code="[werocket_reviews_badge]" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <BadgePanel watch={watch} setValue={setValue} refreshKey={previewRefreshKey} />
        </CardContent>
      </Card>

    </form>
  )
}

/**
 * Input masqué par défaut (type password) avec bouton œil pour révéler
 * temporairement la valeur — pour les secrets type clé API.
 */
function SecretInput({
  registration,
  placeholder,
}: {
  registration: ReturnType<UseFormRegister<TReviewsSettings>>
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        {...registration}
        type={visible ? 'text' : 'password'}
        autoComplete="off"
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Masquer la clé' : 'Afficher la clé'}
        title={visible ? 'Masquer la clé' : 'Afficher la clé'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={!!checked} onCheckedChange={onChange} />
    </div>
  )
}

function SyncBlock({
  status,
  syncing,
  onSync,
}: {
  status: SyncStatus
  syncing: boolean
  onSync: () => void
}) {
  const last = status.last_sync
  const next = status.next_sync_ts

  return (
    <div className="pt-3 mt-1 border-t border-border/60 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 text-xs">
            {!last ? (
              <span className="text-muted-foreground inline-flex items-center gap-1.5">
                <IconClock size={13} />
                Jamais synchronisé
              </span>
            ) : last.success ? (
              <span className="text-foreground inline-flex items-center gap-1.5">
                <IconCircleCheck size={14} className="text-primary" />
                <span className="font-medium">Dernière synchro :</span>
                <span className="text-muted-foreground" title={formatAbsolute(last.timestamp)}>
                  {formatRelative(last.timestamp)} · {last.count} avis
                </span>
              </span>
            ) : (
              <span className="text-foreground inline-flex items-center gap-1.5">
                <IconAlertTriangle size={14} className="text-destructive" />
                <span className="font-medium">Échec :</span>
                <span className="text-muted-foreground">{last.error}</span>
              </span>
            )}
          </div>
          {next && (
            <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
              <IconClock size={11} />
              Prochaine synchro automatique : {formatAbsolute(next)}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncing}
          className="shrink-0 gap-1.5"
        >
          <IconRefresh size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Synchro…' : 'Synchroniser'}
        </Button>
      </div>
    </div>
  )
}

function ShortcodeClipboard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!(await copyToClipboard(code))) {
      toast.error('Impossible de copier')
      return
    }
    setCopied(true)
    toast.success('Shortcode copié dans le presse-papier')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copier le shortcode"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/70 text-xs font-mono text-foreground/80 transition-all ring-1 ring-border"
    >
      {code}
      {copied
        ? <IconCheck size={13} className="text-primary shrink-0" />
        : <IconClipboard size={13} className="text-muted-foreground shrink-0" />}
    </button>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <IconLoader2 size={20} className="animate-spin" /> Chargement...
    </div>
  )
}
