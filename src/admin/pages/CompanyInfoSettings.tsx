import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  IconLoader2, IconBuildingSkyscraper, IconFileText,
  IconSearch, IconPhoto, IconTrash, IconExternalLink, IconPalette,
  IconGavel, IconShieldLock, IconReceipt2, IconLogin2,
  IconRuler2, IconDroplet, IconRestore,
} from '@tabler/icons-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { openMediaPicker } from '@/lib/wp-media'
import { useRegisterSaveForm } from '../context/SaveContext'
import { LegalPageEditor } from '../components/LegalPageEditor'
import { FigmaSlider } from '../components/layout-builder/FigmaSlider'
import type { CompanyInfoSettings as TCompanyInfo, CompanyVariable } from '@/lib/types'

const FORM_ID = 'wr-form-company-info'

interface LookupResponse {
  found: boolean
  data: Partial<TCompanyInfo> | null
}

export function CompanyInfoSettings() {
  const [loading, setLoading] = useState(true)
  const [variables, setVariables] = useState<CompanyVariable[]>([])
  const [logoUrl, setLogoUrl] = useState('')
  const [loginCoverUrl, setLoginCoverUrl] = useState('')
  const [lookupValue, setLookupValue] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const { register, handleSubmit, setValue, reset, control, watch, formState } = useForm<TCompanyInfo>({
    defaultValues: {
      siren: '', siret: '', name: '', commercial_name: '', legal_form: '',
      capital: '', rcs: '', vat: '', ape_code: '', ape_label: '',
      director: '', creation_date: '',
      street: '', postal_code: '', city: '', country: 'France',
      phone: '', email: '', website: '', logo_id: 0,
      login_enabled: false, login_show_logo: true, login_cover_id: 0,
      login_logo_size: 64, login_button_bg_color: '', login_button_text_color: '',
      legal_mentions: '', legal_privacy: '', legal_cgv: '',
    },
  })

  const { setSaving } = useRegisterSaveForm(FORM_ID, formState.isDirty)

  // Beforeunload : alerte si on quitte avec des modifs non sauvées
  useEffect(() => {
    if (!formState.isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [formState.isDirty])

  useEffect(() => {
    // Settings : essentiel. Variables : nice-to-have (peut échouer si module
    // pas encore actif côté init() — l'UI fonctionne quand même).
    api.get<{ settings: TCompanyInfo }>('/settings/company_info')
      .then(s => {
        reset(s.settings)
        setLookupValue(s.settings.siret || s.settings.siren || '')
        // logo_url est computed côté serveur (CompanyInfoModule::get_settings)
        // → on l'utilise directement, plus besoin d'appel /wp/v2/media/{id}.
        setLogoUrl(s.settings.logo_url || '')
        setLoginCoverUrl(s.settings.login_cover_url || '')
      })
      .catch(e => {
        toast.error(e instanceof Error ? e.message : 'Impossible de charger les réglages')
      })
      .finally(() => setLoading(false))

    api.get<{ variables: CompanyVariable[] }>('/company-info/variables')
      .then(v => setVariables(v.variables))
      .catch(() => {
        // Endpoint indispo (module pas init()) — fallback minimal
        setVariables([])
      })
  }, [reset])

  async function onSubmit(data: TCompanyInfo) {
    setSaving(true)
    try {
      const resp = await api.put<{ settings: TCompanyInfo }>('/settings/company_info', { settings: data })
      // reset(data) marque la valeur courante comme "propre" (isDirty → false)
      // → l'indicateur "Modifications non enregistrées" disparait, le
      // beforeunload guard se désactive.
      // On utilise la réponse serveur (settings réellement sauvegardés) pour
      // que le state matche exactement la DB.
      const saved = resp?.settings ?? data
      reset(saved, { keepDirty: false })
      // Le serveur renvoie logo_url computed depuis logo_id. Si vide, le
      // logo_id n'a pas été sauvegardé OU le média a été supprimé.
      setLogoUrl(saved.logo_url || '')
      setLoginCoverUrl(saved.login_cover_url || '')
      toast.success('Infos société enregistrées')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  // Raccourci ⌘/Ctrl + S → submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        const form = document.getElementById(FORM_ID) as HTMLFormElement | null
        form?.requestSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleLookup() {
    const identifier = lookupValue.replace(/\D/g, '')
    if (identifier.length !== 9 && identifier.length !== 14) {
      toast.error('Saisis un SIREN (9 chiffres) ou un SIRET (14 chiffres)')
      return
    }
    setLookingUp(true)
    try {
      const res = await api.post<LookupResponse>('/company-info/lookup', { identifier })
      if (!res.found || !res.data) {
        toast.error('Aucune entreprise trouvée pour ce numéro')
        return
      }
      // Pré-remplit tous les champs renvoyés par l'API
      Object.entries(res.data).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          setValue(key as keyof TCompanyInfo, val as never, { shouldDirty: true })
        }
      })
      toast.success('Infos pré-remplies — vérifie et enregistre')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur réseau lors du lookup')
    } finally {
      setLookingUp(false)
    }
  }

  async function handleSelectLogo() {
    try {
      const attachment = await openMediaPicker({
        title: 'Choisir le logo de la société',
        button: { text: 'Utiliser ce logo' },
      })
      setValue('logo_id', Number(attachment.id), { shouldDirty: true, shouldValidate: true })
      setLogoUrl(attachment.url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible d\'ouvrir la médiathèque')
    }
  }

  function handleClearLogo() {
    setValue('logo_id', 0, { shouldDirty: true })
    setLogoUrl('')
  }

  async function handleSelectLoginCover() {
    try {
      const attachment = await openMediaPicker({
        title: 'Choisir l\'image de la page de connexion',
        button: { text: 'Utiliser cette image' },
      })
      setValue('login_cover_id', Number(attachment.id), { shouldDirty: true, shouldValidate: true })
      setLoginCoverUrl(attachment.url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible d\'ouvrir la médiathèque')
    }
  }

  function handleClearLoginCover() {
    setValue('login_cover_id', 0, { shouldDirty: true })
    setLoginCoverUrl('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <IconLoader2 size={20} className="animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    )
  }

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs defaultValue="identity">
        <TabsList>
          <TabsTrigger value="identity">
            <IconBuildingSkyscraper className="size-4" />
            Identité & Coordonnées
          </TabsTrigger>
          <TabsTrigger value="branding">
            <IconPalette className="size-4" />
            Personnalisation
          </TabsTrigger>
          <TabsTrigger value="legal">
            <IconFileText className="size-4" />
            Pages légales
          </TabsTrigger>
        </TabsList>

        {/* ───── Onglet IDENTITÉ ───── */}
        <TabsContent value="identity" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Recherche par SIREN / SIRET</CardTitle>
              <CardDescription>
                Récupère automatiquement les infos depuis l'API gouvernementale{' '}
                <a
                  href="https://recherche-entreprises.api.gouv.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 inline-flex items-center gap-1"
                >
                  recherche-entreprises <IconExternalLink className="size-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 flex-wrap">
                <Field label="SIREN (9) ou SIRET (14)" className="flex-1 min-w-[240px]">
                  <Input
                    value={lookupValue}
                    onChange={e => setLookupValue(e.target.value)}
                    placeholder="ex : 552 100 554 ou 55210055400022"
                    inputMode="numeric"
                  />
                </Field>
                <Button type="button" onClick={handleLookup} disabled={lookingUp}>
                  {lookingUp ? <IconLoader2 className="size-4 animate-spin" /> : <IconSearch className="size-4" />}
                  Récupérer
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Identité légale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Raison sociale">
                  <Input {...register('name')} placeholder="Société Exemple SAS" />
                </Field>
                <Field label="Nom commercial">
                  <Input {...register('commercial_name')} placeholder="(optionnel)" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="SIREN">
                    <Input {...register('siren')} placeholder="9 chiffres" />
                  </Field>
                  <Field label="SIRET">
                    <Input {...register('siret')} placeholder="14 chiffres" />
                  </Field>
                </div>
                <Field label="Forme juridique">
                  <Input {...register('legal_form')} placeholder="SAS, SARL, EURL…" />
                </Field>
                <Field label="Dirigeant">
                  <Input {...register('director')} placeholder="Prénom Nom" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Identifiants fiscaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Capital social">
                  <Input {...register('capital')} placeholder="ex : 10 000 €" />
                </Field>
                <Field label="RCS">
                  <Input {...register('rcs')} placeholder="RCS Paris 552 100 554" />
                </Field>
                <Field label="TVA intracommunautaire">
                  <Input {...register('vat')} placeholder="FR12345678901" />
                </Field>
                <div className="grid grid-cols-[1fr_2fr] gap-3">
                  <Field label="Code APE">
                    <Input {...register('ape_code')} placeholder="6201Z" />
                  </Field>
                  <Field label="Libellé APE">
                    <Input {...register('ape_label')} placeholder="Programmation informatique" />
                  </Field>
                </div>
                <Field label="Date de création">
                  <Input {...register('creation_date')} placeholder="2024-01-15" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Adresse du siège</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Rue">
                  <Input {...register('street')} placeholder="12 rue de la Paix" />
                </Field>
                <div className="grid grid-cols-[1fr_2fr] gap-3">
                  <Field label="Code postal">
                    <Input {...register('postal_code')} placeholder="75002" />
                  </Field>
                  <Field label="Ville">
                    <Input {...register('city')} placeholder="Paris" />
                  </Field>
                </div>
                <Field label="Pays">
                  <Input {...register('country')} placeholder="France" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-bold">Contact & web</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Téléphone">
                  <Input {...register('phone')} placeholder="+33 1 23 45 67 89" />
                </Field>
                <Field label="Email">
                  <Input type="email" {...register('email')} placeholder="contact@example.com" />
                </Field>
                <Field label="Site web">
                  <Input type="url" {...register('website')} placeholder="https://example.com" />
                </Field>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ───── Onglet PERSONNALISATION ───── */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          <input type="hidden" {...register('logo_id', { valueAsNumber: true })} />
          <input type="hidden" {...register('login_cover_id', { valueAsNumber: true })} />

          {/* Bandeau d'activation — bien visible */}
          <Card className={cn('transition-all', watch('login_enabled') && 'ring-2 ring-primary/50 bg-primary/[0.03]')}>
            <CardContent className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'size-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors',
                  watch('login_enabled') ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  <IconLogin2 size={22} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                    Page de connexion personnalisée
                    <Badge variant={watch('login_enabled') ? 'default' : 'secondary'}>
                      {watch('login_enabled') ? 'Activée' : 'Désactivée'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    Habille <code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded">wp-login.php</code> en deux colonnes :
                    logo + formulaire à gauche, image de couverture à droite.
                  </p>
                </div>
              </div>
              <Controller
                control={control}
                name="login_enabled"
                render={({ field }) => (
                  <label className="flex items-center gap-2.5 cursor-pointer shrink-0 py-1 pl-3 pr-1">
                    <span className="text-sm font-medium text-foreground">
                      {field.value ? 'Activé' : 'Activer'}
                    </span>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      className="scale-125"
                      aria-label="Activer la personnalisation de la page de connexion"
                    />
                  </label>
                )}
              />
            </CardContent>
          </Card>

          {/* Sidebar réglages (gauche) + aperçu (droite) */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
                <aside className="space-y-6 lg:border-r lg:border-border/60 lg:pr-6">
                  {/* Logo société — global (header, emails, shortcode) */}
                  <section className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <IconPhoto size={13} />
                      Logo société
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="size-16 rounded-2xl border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <IconPhoto className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={handleSelectLogo}>
                          <IconPhoto className="size-3.5" />
                          {logoUrl ? 'Changer' : 'Sélectionner'}
                        </Button>
                        {logoUrl && (
                          <Button type="button" variant="ghost" size="sm" onClick={handleClearLogo}>
                            <IconTrash className="size-3.5" />
                            Retirer
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Aussi utilisé dans les en-têtes, emails et le shortcode{' '}
                      <code className="font-mono bg-muted px-1 py-0.5 rounded">[company_logo]</code>
                    </p>
                  </section>

                  {/* Réglages spécifiques à la page de connexion */}
                  <div className={cn('space-y-6', !watch('login_enabled') && 'opacity-50 pointer-events-none select-none')}>
                    <section className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                      <Controller
                        control={control}
                        name="login_show_logo"
                        render={({ field }) => (
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                            aria-label="Afficher le logo société"
                          />
                        )}
                      />
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Afficher le logo</Label>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Remplace le logo WordPress sur la page de connexion.
                        </p>
                      </div>
                    </section>

                    <section className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <IconRuler2 size={13} />
                        Taille du logo
                      </Label>
                      <FigmaSlider
                        value={Number(watch('login_logo_size') ?? 64)}
                        onChange={v => setValue('login_logo_size', v, { shouldDirty: true })}
                        min={32}
                        max={160}
                        presets={[32, 48, 64, 96, 128, 160]}
                      />
                    </section>

                    <section className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <IconPhoto size={13} />
                        Image de couverture
                      </Label>
                      <div className="h-24 rounded-2xl border border-border bg-muted/40 overflow-hidden">
                        {loginCoverUrl ? (
                          <img src={loginCoverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconPhoto className="size-7 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={handleSelectLoginCover}>
                          <IconPhoto className="size-3.5" />
                          {loginCoverUrl ? 'Changer' : 'Choisir'}
                        </Button>
                        {loginCoverUrl && (
                          <Button type="button" variant="ghost" size="sm" onClick={handleClearLoginCover}>
                            <IconTrash className="size-3.5" />
                            Retirer
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Paysage haute résolution recommandé (≥ 1600 × 1200 px).
                      </p>
                    </section>

                    <section className="space-y-3">
                      <Label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <IconDroplet size={13} />
                        Bouton de connexion
                      </Label>
                      <ColorAutoField
                        label="Couleur du bouton"
                        fallback="#2271B1"
                        value={watch('login_button_bg_color') ?? ''}
                        onChange={v => setValue('login_button_bg_color', v, { shouldDirty: true })}
                      />
                      <ColorAutoField
                        label="Couleur du texte"
                        fallback="#FFFFFF"
                        value={watch('login_button_text_color') ?? ''}
                        onChange={v => setValue('login_button_text_color', v, { shouldDirty: true })}
                      />
                    </section>
                  </div>
                </aside>

                {/* ── Aperçu (droite) ── */}
                <div className={cn(!watch('login_enabled') && 'opacity-50 select-none')}>
                  <div className="lg:sticky lg:top-4 space-y-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Aperçu
                    </Label>
                    <div className="rounded-2xl overflow-hidden ring-1 ring-foreground/10 grid grid-cols-2 aspect-[16/9] bg-background">
                      <div className="relative bg-background p-4 flex flex-col items-center justify-center gap-3">
                        {watch('login_show_logo') !== false && (
                          <div
                            className="flex items-center justify-center overflow-hidden transition-all"
                            style={{ height: Math.round(Number(watch('login_logo_size') ?? 64) * 0.75) }}
                          >
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="max-w-[180px] max-h-full object-contain" />
                            ) : (
                              <div className="h-full aspect-square rounded-xl bg-muted/40 ring-1 ring-border flex items-center justify-center">
                                <IconPhoto className="size-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="w-full max-w-[200px] space-y-1.5">
                          <div className="h-2 rounded-full bg-muted/70" />
                          <div className="h-7 rounded-lg bg-muted/40 ring-1 ring-border/60" />
                          <div className="h-2 rounded-full bg-muted/70 mt-3" />
                          <div className="h-7 rounded-lg bg-muted/40 ring-1 ring-border/60" />
                          <div
                            className={cn(
                              'h-8 mt-3 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors',
                              !watch('login_button_bg_color') && 'bg-primary/85 text-primary-foreground'
                            )}
                            style={{
                              backgroundColor: watch('login_button_bg_color') || undefined,
                              color: watch('login_button_text_color') || undefined,
                            }}
                          >
                            Se connecter
                          </div>
                        </div>
                      </div>
                      <div
                        className="relative bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50"
                        style={loginCoverUrl ? { backgroundImage: `url(${loginCoverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                      >
                        {!loginCoverUrl && (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
                            Image de couverture
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Rendu indicatif de <code className="font-mono bg-muted px-1 py-0.5 rounded">wp-login.php</code> — la taille du logo et les couleurs du bouton sont appliquées en temps réel.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Onglet PAGES LÉGALES ───── */}
        <TabsContent value="legal" className="space-y-4 mt-4">
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="leading-relaxed">
              Chaque page possède un <strong>shortcode</strong> à coller dans une page WordPress.
              À l'affichage, les variables <code className="text-[11px] font-mono bg-background px-1 py-0.5 rounded">{'{company.name}'}</code>,{' '}
              <code className="text-[11px] font-mono bg-background px-1 py-0.5 rounded">{'{company.siret}'}</code>, etc. seront remplacées par les valeurs des onglets Identité / Coordonnées.
            </p>
          </div>

          <Tabs defaultValue="mentions">
            <TabsList>
              <TabsTrigger value="mentions">
                <IconGavel className="size-4" />
                Mentions légales
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <IconShieldLock className="size-4" />
                Confidentialité
              </TabsTrigger>
              <TabsTrigger value="cgv">
                <IconReceipt2 className="size-4" />
                CGV / CGU
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mentions" className="mt-4">
              <Controller
                control={control}
                name="legal_mentions"
                render={({ field }) => (
                  <LegalPageEditor
                    title="Mentions légales"
                    description="Obligation légale pour tout site web professionnel (LCEN 2004)"
                    shortcode='[werocket_legal type="mentions"]'
                    value={field.value || ''}
                    onChange={field.onChange}
                    variables={variables}
                  />
                )}
              />
            </TabsContent>

            <TabsContent value="privacy" className="mt-4">
              <Controller
                control={control}
                name="legal_privacy"
                render={({ field }) => (
                  <LegalPageEditor
                    title="Politique de confidentialité"
                    description="Obligatoire dès lors que tu collectes des données personnelles (RGPD)"
                    shortcode='[werocket_legal type="privacy"]'
                    value={field.value || ''}
                    onChange={field.onChange}
                    variables={variables}
                  />
                )}
              />
            </TabsContent>

            <TabsContent value="cgv" className="mt-4">
              <Controller
                control={control}
                name="legal_cgv"
                render={({ field }) => (
                  <LegalPageEditor
                    title="CGV / CGU"
                    description="Conditions générales de vente ou d'utilisation"
                    shortcode='[werocket_legal type="cgv"]'
                    value={field.value || ''}
                    onChange={field.onChange}
                    variables={variables}
                  />
                )}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </form>
  )
}

/**
 * Champ couleur avec mode « Auto » : valeur vide = couleur WordPress
 * par défaut, le bouton Restore revient à ce mode.
 */
function ColorAutoField({
  label,
  fallback,
  value,
  onChange,
}: {
  label: string
  fallback: string
  value: string
  onChange: (v: string) => void
}) {
  const isAuto = value === ''
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {label}
        {isAuto && <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded-md">Auto</span>}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValid ? value : fallback}
          onChange={e => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-input cursor-pointer p-0.5 bg-background shrink-0"
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
            title="Revenir à la couleur par défaut"
            className="shrink-0 px-2"
          >
            <IconRestore size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className ?? 'space-y-1.5'}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
