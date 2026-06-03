import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  IconLoader2, IconDatabase, IconAdjustmentsHorizontal, IconPalette,
  IconFileText, IconCookie, IconBrandGoogle, IconCode,
  IconBrandGoogleAnalytics, IconBrandMeta, IconBrandYoutube,
  IconBrandLinkedin, IconBrandVimeo, IconTag, IconChartHistogram, IconAd,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { useRegisterSaveForm } from '../context/SaveContext'
import { CookiesPreview } from '../components/CookiesPreview'
import type { CookiesSettings, CookieService } from '@/lib/types'

const FORM_ID = 'wr-form-cookies'

type ServiceWithCsv = CookieService & { _cookies_csv: string }

type FormValues = Omit<CookiesSettings, 'services'>

const PURPOSE_KEYS = ['necessary', 'analytics', 'marketing', 'preferences'] as const
const PURPOSE_LABELS: Record<string, string> = {
  necessary: 'Nécessaires',
  analytics: 'Statistiques',
  marketing: 'Marketing',
  preferences: 'Préférences',
}

type ServiceMeta = { Icon: typeof IconCookie; color: string; bg: string }

const SERVICE_META: Record<string, ServiceMeta> = {
  'google-analytics':    { Icon: IconBrandGoogleAnalytics, color: '#E37400', bg: 'rgb(255 247 237)' },
  'google-tag-manager':  { Icon: IconTag,                  color: '#1A73E8', bg: 'rgb(239 246 255)' },
  'google-ads':          { Icon: IconAd,                   color: '#34A853', bg: 'rgb(236 253 245)' },
  'facebook-pixel':      { Icon: IconBrandMeta,            color: '#0866FF', bg: 'rgb(239 246 255)' },
  'hotjar':              { Icon: IconChartHistogram,       color: '#FD3A5C', bg: 'rgb(255 241 242)' },
  'linkedin-insight':    { Icon: IconBrandLinkedin,        color: '#0A66C2', bg: 'rgb(239 246 255)' },
  'youtube':             { Icon: IconBrandYoutube,         color: '#FF0000', bg: 'rgb(254 242 242)' },
  'vimeo':               { Icon: IconBrandVimeo,           color: '#1AB7EA', bg: 'rgb(236 254 255)' },
}

const FALLBACK_META: ServiceMeta = { Icon: IconCookie, color: 'var(--primary)', bg: 'color-mix(in oklch, var(--primary) 12%, transparent)' }

export function CookiesSettings() {
  const [loading, setLoading] = useState(true)
  const { setSaving } = useRegisterSaveForm(FORM_ID)
  const [services, setServices] = useState<ServiceWithCsv[]>([])

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormValues>()

  useEffect(() => {
    api.get<{ settings: CookiesSettings }>('/settings/cookies')
      .then(data => {
        const { services: svc, ...rest } = data.settings
        reset(rest as FormValues)
        setServices((svc ?? []).map(s => ({ ...s, _cookies_csv: s.cookies.join(', ') })))
      })
      .finally(() => setLoading(false))
  }, [reset])

  function updateService(index: number, field: keyof ServiceWithCsv, value: unknown) {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function toggleServicePurpose(index: number, purpose: string, checked: boolean) {
    setServices(prev => prev.map((s, i) => {
      if (i !== index) return s
      const purposes = checked
        ? [...s.purposes, purpose]
        : s.purposes.filter(p => p !== purpose)
      return { ...s, purposes }
    }))
  }

  async function onSubmit(data: FormValues) {
    setSaving(true)
    try {
      const servicesForSubmit = services.map(({ _cookies_csv, ...s }) => ({
        ...s,
        cookies: _cookies_csv.split(',').map(c => c.trim()).filter(Boolean),
      }))
      const fullSettings: CookiesSettings = { ...(data as CookiesSettings), services: servicesForSubmit }
      await api.put('/settings/cookies', { settings: fullSettings })
      toast.success('Paramètres cookies enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <IconLoader2 size={20} className="animate-spin" />
      Chargement...
    </div>
  )

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto w-fit rounded-3xl">
          <TabsTrigger value="general"><IconDatabase />Général</TabsTrigger>
          <TabsTrigger value="behavior"><IconAdjustmentsHorizontal />Comportement</TabsTrigger>
          <TabsTrigger value="appearance"><IconPalette />Apparence</TabsTrigger>
          <TabsTrigger value="texts"><IconFileText />Textes</TabsTrigger>
          <TabsTrigger value="services"><IconCookie />Services</TabsTrigger>
          <TabsTrigger value="gcm"><IconBrandGoogle />Consent Mode</TabsTrigger>
          <TabsTrigger value="advanced"><IconCode />Avancé</TabsTrigger>
        </TabsList>

        {/* ─── Général ─── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Cookie de stockage</CardTitle>
              <CardDescription>Paramètres du cookie de consentement Klaro</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom du cookie">
                <Input {...register('cookie_name')} placeholder="werocket_consent" />
              </Field>
              <Field label="Durée (jours)">
                <Input {...register('cookie_expires_days', { valueAsNumber: true })} type="number" min={1} max={730} />
              </Field>
              <Field label="Domaine (optionnel)">
                <Input {...register('cookie_domain')} placeholder=".example.com" />
              </Field>
              <Field label="Méthode de stockage">
                <Select onValueChange={v => setValue('storage_method', v as 'cookie' | 'localStorage')} value={watch('storage_method')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cookie">Cookie</SelectItem>
                    <SelectItem value="localStorage">localStorage</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Comportement ─── */}
        <TabsContent value="behavior">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Politique de consentement</CardTitle>
                <CardDescription>Comment le bandeau interagit avec les visiteurs</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border/60 py-0">
                <SwitchRow label="Consentement obligatoire" description="Bloque l'accès au site jusqu'au consentement" name="must_consent" watch={watch} setValue={setValue} />
                <SwitchRow label="Bouton Tout accepter" description="Afficher le bouton d'acceptation globale" name="accept_all" watch={watch} setValue={setValue} />
                <SwitchRow label="Activer par défaut" description="Les services sont activés par défaut (opt-out)" name="default" watch={watch} setValue={setValue} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Éléments visibles</CardTitle>
                <CardDescription>Masquer certains boutons ou liens du bandeau</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border/60 py-0">
                <SwitchRow label="Masquer le bouton « Tout refuser »" name="hide_decline_all" watch={watch} setValue={setValue} />
                <SwitchRow label="Masquer le lien « En savoir plus »" name="hide_learn_more" watch={watch} setValue={setValue} />
                <SwitchRow label="Masquer le toggle global" description="Le bouton qui active/désactive tout d'un coup" name="hide_toggle_all" watch={watch} setValue={setValue} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disposition &amp; rendu</CardTitle>
                <CardDescription>Affichage et organisation visuelle du bandeau</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border/60 py-0">
                <SwitchRow label="Afficher comme modale" description="Centre le bandeau avec un overlay plein écran" name="notice_as_modal" watch={watch} setValue={setValue} />
                <SwitchRow label="Grouper par finalité" description="Regroupe les services par catégorie dans la modale détails" name="group_by_purpose" watch={watch} setValue={setValue} />
                <SwitchRow label="Inverser les boutons" description="Inverse l'ordre Accepter / Refuser" name="flip_buttons" watch={watch} setValue={setValue} />
                <SwitchRow label="Autoriser le HTML dans les textes" description="Interprète les balises HTML des descriptions" name="html_texts" watch={watch} setValue={setValue} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Apparence ─── */}
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Disposition</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Thème">
                    <Select onValueChange={v => setValue('theme', v as 'light' | 'dark' | 'custom')} value={watch('theme')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Position">
                    <Select onValueChange={v => setValue('position', v as CookiesSettings['position'])} value={watch('position')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-left">Bas gauche</SelectItem>
                        <SelectItem value="bottom-right">Bas droite</SelectItem>
                        <SelectItem value="top-left">Haut gauche</SelectItem>
                        <SelectItem value="top-right">Haut droite</SelectItem>
                        <SelectItem value="center">Barre complète</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Couleurs personnalisées</CardTitle>
                  <CardDescription>Actives uniquement avec le thème "Personnalisé"</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    ['color_primary', 'Couleur principale'],
                    ['color_primary_hover', 'Couleur principale (survol)'],
                    ['color_background', 'Fond'],
                    ['color_text', 'Texte'],
                    ['color_text_secondary', 'Texte secondaire'],
                    ['color_border', 'Bordure'],
                    ['color_toggle_on', 'Toggle activé'],
                    ['color_toggle_off', 'Toggle désactivé'],
                  ] as [keyof FormValues, string][]).map(([name, label]) => (
                    <Field key={name} label={label}>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          {...register(name)}
                          className="h-9 w-14 shrink-0 cursor-pointer p-1"
                        />
                        <Input {...register(name)} className="font-mono text-sm" placeholder="#000000" />
                      </div>
                    </Field>
                  ))}
                </CardContent>
              </Card>
            </div>

            <CookiesPreview watch={watch} />
          </div>
        </TabsContent>

        {/* ─── Textes ─── */}
        <TabsContent value="texts">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Notice principale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Titre">
                    <Input {...register('texts.notice_title')} placeholder="Gestion des cookies" />
                  </Field>
                  <Field label="Description">
                    <Textarea {...register('texts.notice_description')} rows={3} placeholder="Nous utilisons des cookies..." />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Boutons</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Tout accepter"><Input {...register('texts.accept_all')} /></Field>
                  <Field label="Tout refuser"><Input {...register('texts.decline_all')} /></Field>
                  <Field label="Personnaliser"><Input {...register('texts.settings')} /></Field>
                  <Field label="Accepter la sélection"><Input {...register('texts.accept_selected')} /></Field>
                  <Field label="Enregistrer"><Input {...register('texts.save')} /></Field>
                  <Field label="Fermer"><Input {...register('texts.close')} /></Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liens légaux</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Texte politique de confidentialité">
                    <Input {...register('texts.privacy_policy')} />
                  </Field>
                  <Field label="URL politique de confidentialité">
                    <Input {...register('texts.privacy_policy_url')} type="url" placeholder="https://..." />
                  </Field>
                  <Field label="Texte mentions légales">
                    <Input {...register('texts.imprint')} />
                  </Field>
                  <Field label="URL mentions légales">
                    <Input {...register('texts.imprint_url')} type="url" placeholder="https://..." />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Finalités</CardTitle>
                  <CardDescription>Titres et descriptions des catégories de consentement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {PURPOSE_KEYS.map(key => (
                    <div key={key} className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{PURPOSE_LABELS[key]}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Titre">
                          <Input {...register(`purposes.${key}.title` as keyof FormValues)} placeholder={PURPOSE_LABELS[key]} />
                        </Field>
                        <Field label="Description">
                          <Input {...register(`purposes.${key}.description` as keyof FormValues)} />
                        </Field>
                      </div>
                      {key !== 'preferences' && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <CookiesPreview watch={watch} />
          </div>
        </TabsContent>

        {/* ─── Services ─── */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services de tracking</CardTitle>
              <CardDescription>
                {services.filter(s => s.enabled).length} service(s) actif(s) sur {services.length}
                {' · '}Cliquez sur une ligne pour configurer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple">
                {services.map((svc, i) => {
                  const meta = SERVICE_META[svc.name] ?? FALLBACK_META
                  const Icon = meta.Icon
                  const cookieCount = svc._cookies_csv.split(',').map(s => s.trim()).filter(Boolean).length
                  const purposesLabel = svc.purposes.map(p => PURPOSE_LABELS[p] ?? p).join(' · ')

                  return (
                    <AccordionItem key={svc.name} value={svc.name}>
                      <AccordionTrigger className="hover:no-underline py-3 px-4 -mx-px gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            onClick={e => { e.preventDefault(); e.stopPropagation() }}
                            onPointerDown={e => e.stopPropagation()}
                            className="shrink-0"
                          >
                            <Switch
                              checked={svc.enabled}
                              onCheckedChange={v => updateService(i, 'enabled', v)}
                              aria-label={`Activer ${svc.title || svc.name}`}
                            />
                          </div>

                          <div
                            className={cn(
                              'size-10 rounded-2xl flex items-center justify-center shrink-0 transition-opacity',
                              !svc.enabled && 'opacity-40 grayscale'
                            )}
                            style={{ backgroundColor: meta.bg }}
                          >
                            <Icon size={20} style={{ color: meta.color }} />
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <div className={cn('text-sm font-medium truncate', !svc.enabled && 'text-muted-foreground')}>
                              {svc.title || svc.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {purposesLabel || <span className="italic">Aucune finalité</span>}
                              {cookieCount > 0 && (
                                <span className="ml-1.5 inline-flex items-center gap-1 text-muted-foreground/70">
                                  · <IconCookie className="size-3" /> {cookieCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {svc.required && (
                            <Badge variant="outline" className="shrink-0 font-normal">
                              Requis
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-5 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Field label="Nom d'affichage">
                            <Input value={svc.title} onChange={e => updateService(i, 'title', e.target.value)} />
                          </Field>
                          <Field label="Cookies (séparés par virgule)">
                            <Input value={svc._cookies_csv} onChange={e => updateService(i, '_cookies_csv', e.target.value)} placeholder="_ga, _gid, ..." />
                          </Field>
                        </div>
                        <Field label="Description">
                          <Textarea value={svc.description} onChange={e => updateService(i, 'description', e.target.value)} rows={2} />
                        </Field>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Finalités</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {PURPOSE_KEYS.map(pk => {
                              const active = svc.purposes.includes(pk)
                              const disabled = pk === 'necessary' && svc.required
                              return (
                                <button
                                  type="button"
                                  key={pk}
                                  onClick={() => !disabled && toggleServicePurpose(i, pk, !active)}
                                  disabled={disabled}
                                  className={cn(
                                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                                    active
                                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                      : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
                                    disabled && 'opacity-50 cursor-not-allowed'
                                  )}
                                >
                                  {PURPOSE_LABELS[pk]}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Options avancées</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <OptionCard
                              label="Requis"
                              description="Toujours actif, non désactivable"
                              checked={svc.required}
                              onChange={v => updateService(i, 'required', v)}
                            />
                            <OptionCard
                              label="Activé par défaut"
                              description="Service pré-coché à l'ouverture"
                              checked={svc.default}
                              onChange={v => updateService(i, 'default', v)}
                            />
                            <OptionCard
                              label="Opt-out"
                              description="Chargé par défaut, désactivable"
                              checked={svc.opt_out}
                              onChange={v => updateService(i, 'opt_out', v)}
                            />
                            <OptionCard
                              label="Une seule fois"
                              description="Exécuter le script un seul fois"
                              checked={svc.only_once}
                              onChange={v => updateService(i, 'only_once', v)}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Google Consent Mode ─── */}
        <TabsContent value="gcm">
          <Card>
            <CardHeader>
              <CardTitle>Google Consent Mode v2</CardTitle>
              <CardDescription>Paramètres des défauts de consentement envoyés à Google avant toute interaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SwitchRow label="Activer Google Consent Mode v2" name="gcm_enabled" watch={watch} setValue={setValue} />
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  ['gcm_default_analytics', 'Analytics (analytics_storage)'],
                  ['gcm_default_ad_storage', 'Publicité (ad_storage)'],
                  ['gcm_default_ad_user_data', 'Données utilisateur (ad_user_data)'],
                  ['gcm_default_ad_personalization', 'Personnalisation (ad_personalization)'],
                  ['gcm_default_functionality', 'Fonctionnalité (functionality_storage)'],
                  ['gcm_default_security', 'Sécurité (security_storage)'],
                ] as [keyof FormValues, string][]).map(([name, label]) => (
                  <Field key={name} label={label}>
                    <Select onValueChange={v => setValue(name, v as 'granted' | 'denied')} value={watch(name) as string}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="denied">denied (refusé par défaut)</SelectItem>
                        <SelectItem value="granted">granted (accordé par défaut)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                ))}
                <Field label="Délai d'attente (ms)">
                  <Input {...register('gcm_wait_for_update', { valueAsNumber: true })} type="number" min={0} max={2000} />
                </Field>
                <Field label="Régions (CSV, vide = toutes)">
                  <Input {...register('gcm_region')} placeholder="FR,BE,DE" />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Avancé ─── */}
        <TabsContent value="advanced">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CSS & classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Classe CSS additionnelle">
                  <Input {...register('additional_class')} placeholder="my-custom-class" />
                </Field>
                <Field label="CSS personnalisé">
                  <Textarea {...register('custom_css')} rows={6} className="font-mono text-xs" placeholder="/* CSS appliqué au bandeau */" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Callbacks JavaScript</CardTitle>
                <CardDescription>Code exécuté après acceptation ou refus (usage avancé)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Après acceptation">
                  <Textarea {...register('callback_on_accept')} rows={3} className="font-mono text-xs" placeholder="console.log('accepted')" />
                </Field>
                <Field label="Après refus">
                  <Textarea {...register('callback_on_decline')} rows={3} className="font-mono text-xs" placeholder="console.log('declined')" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shortcodes disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">[werocket_manage_cookies]</code>
                  <span className="ml-2">Lien pour ouvrir les préférences cookies</span>
                </div>
                <div>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">[werocket_manage_cookies text="Mon texte" tag="button" class="ma-classe"]</code>
                </div>
                <p className="text-xs">Attributs : <code>text</code> (texte du lien), <code>tag</code> (a|button), <code>class</code>, <code>style</code></p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
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

function OptionCard({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all',
        checked
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-background hover:bg-muted/50'
      )}
    >
      <Checkbox checked={checked} onCheckedChange={v => onChange(!!v)} className="mt-0.5" />
      <div className="min-w-0">
        <div className="text-sm font-medium leading-tight">{label}</div>
        <p className="text-[11px] text-muted-foreground leading-snug mt-1">{description}</p>
      </div>
    </label>
  )
}

function SwitchRow({ label, description, name, watch, setValue }: {
  label: string
  description?: string
  name: keyof FormValues
  watch: ReturnType<typeof useForm<FormValues>>['watch']
  setValue: ReturnType<typeof useForm<FormValues>>['setValue']
}) {
  const checked = !!watch(name)
  return (
    <label
      className="group flex items-center justify-between gap-4 py-4 -mx-2 px-2 rounded-2xl cursor-pointer transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {checked && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              On
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={v => setValue(name, v as never)} />
    </label>
  )
}
