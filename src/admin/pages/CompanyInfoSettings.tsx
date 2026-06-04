import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  IconLoader2, IconBuildingSkyscraper, IconAddressBook, IconFileText,
  IconSearch, IconPhoto, IconTrash, IconExternalLink,
  IconGavel, IconShieldLock, IconReceipt2,
} from '@tabler/icons-react'
import { api } from '@/lib/api'
import { openMediaPicker } from '@/lib/wp-media'
import { useRegisterSaveForm } from '../context/SaveContext'
import { LegalPageEditor } from '../components/LegalPageEditor'
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
  const [lookupValue, setLookupValue] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const { setSaving } = useRegisterSaveForm(FORM_ID)
  const { register, handleSubmit, setValue, reset, control } = useForm<TCompanyInfo>({
    defaultValues: {
      siren: '', siret: '', name: '', commercial_name: '', legal_form: '',
      capital: '', rcs: '', vat: '', ape_code: '', ape_label: '',
      director: '', creation_date: '',
      street: '', postal_code: '', city: '', country: 'France',
      phone: '', email: '', website: '', logo_id: 0,
      legal_mentions: '', legal_privacy: '', legal_cgv: '',
    },
  })

  useEffect(() => {
    // Settings : essentiel. Variables : nice-to-have (peut échouer si module
    // pas encore actif côté init() — l'UI fonctionne quand même).
    api.get<{ settings: TCompanyInfo }>('/settings/company_info')
      .then(s => {
        reset(s.settings)
        setLookupValue(s.settings.siret || s.settings.siren || '')
        if (s.settings.logo_id) {
          fetchLogoUrl(s.settings.logo_id).then(setLogoUrl).catch(() => {})
        }
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

  async function fetchLogoUrl(id: number): Promise<string> {
    const root = document.getElementById('werocket-admin-root')
    const restUrl = root?.dataset.restUrl ?? '/wp-json/'
    const nonce = root?.dataset.nonce ?? ''
    const res = await fetch(`${restUrl}wp/v2/media/${id}`, { headers: { 'X-WP-Nonce': nonce } })
    if (!res.ok) return ''
    const data = await res.json()
    return data?.source_url ?? ''
  }

  async function onSubmit(data: TCompanyInfo) {
    setSaving(true)
    try {
      await api.put('/settings/company_info', { settings: data })
      toast.success('Infos société enregistrées')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

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
      setValue('logo_id', attachment.id, { shouldDirty: true })
      setLogoUrl(attachment.url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Impossible d\'ouvrir la médiathèque')
    }
  }

  function handleClearLogo() {
    setValue('logo_id', 0, { shouldDirty: true })
    setLogoUrl('')
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
            Identité
          </TabsTrigger>
          <TabsTrigger value="contact">
            <IconAddressBook className="size-4" />
            Coordonnées
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
          </div>
        </TabsContent>

        {/* ───── Onglet COORDONNÉES ───── */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-bold flex items-center gap-2">
                  <IconPhoto className="size-4 text-primary" />
                  Logo de la société
                </CardTitle>
                <CardDescription>Utilisé dans les en-têtes et le shortcode <code className="text-[11px] font-mono bg-muted px-1 py-0.5 rounded">[company_logo]</code></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="size-24 rounded-2xl border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <IconPhoto className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleSelectLogo}>
                      <IconPhoto className="size-4" />
                      {logoUrl ? 'Changer' : 'Sélectionner'}
                    </Button>
                    {logoUrl && (
                      <Button type="button" variant="ghost" onClick={handleClearLogo}>
                        <IconTrash className="size-4" />
                        Retirer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
