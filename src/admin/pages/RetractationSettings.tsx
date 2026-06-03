import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  IconLoader2, IconSettings, IconShieldCheck, IconBell, IconExternalLink,
  IconClipboardList, IconCode, IconAlertTriangle, IconPalette, IconPhoto, IconTrash,
} from '@tabler/icons-react'
import { api } from '@/lib/api'
import { openMediaPicker } from '@/lib/wp-media'
import { useRegisterSaveForm } from '../context/SaveContext'
import type { RetractationSettings as TRetractationSettings } from '@/lib/types'

const FORM_ID = 'wr-form-retractation'

export function RetractationSettings() {
  const [loading, setLoading] = useState(true)
  const { setSaving } = useRegisterSaveForm(FORM_ID)
  const { register, handleSubmit, setValue, watch, reset } = useForm<TRetractationSettings>()

  useEffect(() => {
    api.get<{ settings: TRetractationSettings }>('/settings/retractation')
      .then(data => reset(data.settings))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(data: TRetractationSettings) {
    setSaving(true)
    try {
      await api.put('/settings/retractation', { settings: data })
      toast.success('Réglages enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  async function handleSelectLogo() {
    try {
      const attachment = await openMediaPicker({
        title: 'Choisir le logo pour les emails',
        button: { text: 'Utiliser ce logo' },
      })
      setValue('email_logo_id', attachment.id)
      setValue('email_logo_url', attachment.url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible d\'ouvrir la médiathèque')
    }
  }

  function handleClearLogo() {
    setValue('email_logo_id', 0)
    setValue('email_logo_url', '')
  }

  if (loading) return <Spinner />

  const slug = watch('endpoint_slug') ?? 'retractation'
  const siteUrl = window.location.origin

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div
        role="alert"
        className="relative overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/60 shadow-sm dark:border-amber-800/60 dark:from-amber-950/40 dark:to-amber-900/30"
      >
        <div className="absolute left-0 inset-y-0 w-1.5 bg-amber-500 dark:bg-amber-400" aria-hidden />
        <div className="flex items-start gap-4 px-5 py-4 pl-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow ring-4 ring-amber-200/70 dark:bg-amber-400 dark:text-amber-950 dark:ring-amber-700/40">
            <IconAlertTriangle className="size-5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              À valider par un juriste avant mise en production
            </p>
            <p className="text-[13px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
              Ce module s'inscrit dans la continuité du droit existant (Code de la consommation, art. <strong>L221-18 et s.</strong> ; formulaire type <strong>R221-1</strong> ; AR support durable <strong>L221-21</strong>). La date d'entrée en application et la rédaction des CGV doivent être validées par un juriste.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><IconSettings size={16} /> Page publique</CardTitle>
            <CardDescription>Titre + slug de l'endpoint My Account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Titre de la page">
              <Input {...register('page_title')} placeholder="Demande de rétractation" />
            </Field>
            <Field label="Slug de l'endpoint">
              <Input {...register('endpoint_slug')} placeholder="retractation" />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Après modification, allez dans <strong>Réglages → Permaliens</strong> et cliquez sur Enregistrer pour rafraîchir les URLs.
              </p>
            </Field>
            <SwitchRow
              label="Afficher la notice légale"
              description="Phrase introductive rappelant le droit de rétractation au-dessus du formulaire."
              checked={!!watch('show_legal_notice')}
              onChange={v => setValue('show_legal_notice', v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><IconBell size={16} /> Notifications marchand</CardTitle>
            <CardDescription>Email reçu à chaque nouvelle demande</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchRow
              label="Notifier le marchand"
              description="Envoie un email à chaque nouvelle demande de rétractation."
              checked={!!watch('merchant_notify')}
              onChange={v => setValue('merchant_notify', v)}
            />
            <Field label="Email marchand (optionnel)">
              <Input {...register('merchant_email')} type="email" placeholder="admin@monsite.fr" />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Si vide, l'email d'administration WordPress est utilisé.
              </p>
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconPalette size={16} /> Identité visuelle</CardTitle>
          <CardDescription>Couleurs d'accent et logo email pour aligner le module à votre marque</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ── Formulaire client ── */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Formulaire client (My Account)
              </span>
              <span className="h-px flex-1 bg-border/60" />
            </div>
            <ColorField
              label="Couleur d'accent"
              description="Titre italique, étapes, boutons, focus, ticket de référence."
              value={watch('frontend_color') ?? '#0F766E'}
              onChange={v => setValue('frontend_color', v)}
            />
          </section>

          {/* ── Emails ── */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Emails (client + marchand)
              </span>
              <span className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorField
                label="Couleur d'accent"
                description="Barre, ticket, badges, liens."
                value={watch('email_color') ?? '#0F766E'}
                onChange={v => setValue('email_color', v)}
              />
              <ColorField
                label="Couleur de fond"
                description="Arrière-plan général de l'email (autour du panneau)."
                value={watch('email_bg_color') ?? '#FAF8F4'}
                onChange={v => setValue('email_bg_color', v)}
              />
              <ColorField
                label="Couleur du panneau"
                description="Carte centrale qui contient le contenu."
                value={watch('email_surface_color') ?? '#FFFFFF'}
                onChange={v => setValue('email_surface_color', v)}
              />
            </div>

            <div className="mt-5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <IconPhoto size={13} />
                Logo en en-tête
              </Label>
              <LogoPicker
                url={watch('email_logo_url')}
                onPick={handleSelectLogo}
                onClear={handleClearLogo}
              />
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Format conseillé : PNG/SVG, hauteur ≤ 80px. Si vide, le nom du site est affiché en texte.
              </p>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconClipboardList size={16} /> Accès rapides</CardTitle>
          <CardDescription>Liens vers le formulaire public et l'écran de gestion</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button type="button" variant="outline" asChild className="h-auto py-3 justify-start text-left">
            <a href={`${siteUrl}/mon-compte/${slug}/`} target="_blank" rel="noreferrer noopener">
              <div className="flex flex-col items-start gap-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <IconExternalLink size={14} />
                  Page client (My Account)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal truncate">
                  /mon-compte/{slug}/
                </span>
              </div>
            </a>
          </Button>

          <Button type="button" variant="outline" asChild className="h-auto py-3 justify-start text-left">
            <a href={`${siteUrl}/wp-admin/admin.php?page=wr-retractations`}>
              <div className="flex flex-col items-start gap-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <IconShieldCheck size={14} />
                  Gérer les demandes
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  WooCommerce → Rétractations
                </span>
              </div>
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconCode size={16} /> Shortcode invité</CardTitle>
          <CardDescription>Pour offrir le formulaire aux visiteurs non connectés</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Insérez ce shortcode sur une page publique :
          </p>
          <code className="block bg-muted text-foreground px-3 py-2 rounded-md font-mono text-sm">
            [wr_retractation]
          </code>
          <p className="text-xs text-muted-foreground">
            Le client saisit son numéro de commande + email pour ouvrir l'étape 2 (sélection des articles).
            Idéal pour une page « Rétractation » référencée dans le footer / les CGV.
          </p>
        </CardContent>
      </Card>

    </form>
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

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1 shrink-0" />
    </label>
  )
}

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: string
  onChange: (v: string) => void
}) {
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValid ? value : '#0F766E'}
          onChange={e => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-input cursor-pointer p-0.5 bg-background"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#0F766E"
          className="font-mono text-sm"
        />
      </div>
    </div>
  )
}

function LogoPicker({
  url,
  onPick,
  onClear,
}: {
  url: string
  onPick: () => void
  onClear: () => void
}) {
  if (!url) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onPick}
        className="gap-1.5 w-full sm:w-auto"
      >
        <IconPhoto size={14} />
        Choisir une image dans la médiathèque
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
      <div className="size-16 rounded-md bg-muted/40 ring-1 ring-border flex items-center justify-center overflow-hidden shrink-0">
        <img src={url} alt="Logo email" className="max-h-full max-w-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate font-mono">{url}</p>
        <div className="flex gap-2 mt-2">
          <Button type="button" variant="outline" size="sm" onClick={onPick} className="gap-1.5">
            <IconPhoto size={13} />
            Remplacer
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-muted-foreground hover:text-destructive">
            <IconTrash size={13} />
            Retirer
          </Button>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <IconLoader2 size={20} className="animate-spin" /> Chargement...
    </div>
  )
}
