import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  IconBuildingStore, IconPhone, IconMapPin, IconClock, IconBrandFacebook, IconLoader2
} from '@tabler/icons-react'
import { api } from '@/lib/api'
import { ModuleHeader } from '../components/ModuleHeader'
import type { BusinessSettings as TBusinessSettings } from '@/lib/types'

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]

export function BusinessSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, watch, reset } = useForm<TBusinessSettings>()

  useEffect(() => {
    api.get<{ settings: TBusinessSettings }>('/settings/google_business')
      .then(data => reset(data.settings))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(data: TBusinessSettings) {
    setSaving(true)
    try {
      await api.put('/settings/google_business', { settings: data })
      toast.success('Informations entreprise enregistrées')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ModuleHeader
        title="Google Business"
        description="Informations de votre fiche Google Business Profile"
        saving={saving}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconBuildingStore size={16} /> Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nom de l'entreprise"><Input {...register('business_name')} /></Field>
            <Field label="Type d'entreprise"><Input {...register('business_type')} /></Field>
            <Field label="Description">
              <textarea {...register('description')}
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconPhone size={16} /> Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Téléphone"><Input {...register('phone')} type="tel" /></Field>
            <Field label="Email"><Input {...register('email')} type="email" /></Field>
            <Field label="Site web"><Input {...register('website')} type="url" /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconMapPin size={16} /> Adresse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Rue"><Input {...register('address.street')} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code postal"><Input {...register('address.postal_code')} /></Field>
              <Field label="Ville"><Input {...register('address.city')} /></Field>
            </div>
            <Field label="Pays"><Input {...register('address.country')} /></Field>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude"><Input {...register('coordinates.lat')} /></Field>
              <Field label="Longitude"><Input {...register('coordinates.lng')} /></Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconBrandFacebook size={16} /> Réseaux sociaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Facebook"><Input {...register('social_links.facebook')} type="url" /></Field>
            <Field label="Instagram"><Input {...register('social_links.instagram')} type="url" /></Field>
            <Field label="LinkedIn"><Input {...register('social_links.linkedin')} type="url" /></Field>
            <Field label="Twitter / X"><Input {...register('social_links.twitter')} type="url" /></Field>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><IconClock size={16} /> Horaires d'ouverture</CardTitle>
          <CardDescription>Laissez vide pour les jours fermés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-[120px_1fr_1fr_auto] items-center gap-3">
                <span className="text-sm font-medium">{label}</span>
                <Input
                  {...register(`opening_hours.${key}.open` as const)}
                  type="time"
                  disabled={watch(`opening_hours.${key}.closed` as const)}
                />
                <Input
                  {...register(`opening_hours.${key}.close` as const)}
                  type="time"
                  disabled={watch(`opening_hours.${key}.closed` as const)}
                />
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={!!watch(`opening_hours.${key}.closed` as const)}
                    onCheckedChange={v => setValue(`opening_hours.${key}.closed` as const, v)}
                  />
                  <span className="text-xs text-muted-foreground">Fermé</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Données structurées Schema.org</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Injecter le JSON-LD dans le &lt;head&gt; de chaque page</p>
            </div>
            <Switch
              checked={!!watch('enable_structured_data')}
              onCheckedChange={v => setValue('enable_structured_data', v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <IconLoader2 size={15} className="animate-spin" />}
          Enregistrer
        </Button>
      </div>
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

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <IconLoader2 size={20} className="animate-spin" /> Chargement...
    </div>
  )
}
