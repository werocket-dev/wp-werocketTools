import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconStarFilled, IconKey, IconEye, IconLoader2 } from '@tabler/icons-react'
import { api } from '@/lib/api'
import { ModuleHeader } from '../components/ModuleHeader'
import { useState } from 'react'
import type { ReviewsSettings as TReviewsSettings } from '@/lib/types'

export function ReviewsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, watch, reset } = useForm<TReviewsSettings>()

  useEffect(() => {
    api.get<{ settings: TReviewsSettings }>('/settings/google_reviews')
      .then(data => reset(data.settings))
      .finally(() => setLoading(false))
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

  if (loading) return <Spinner />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ModuleHeader
        icon={<IconStarFilled size={20} />}
        title="Avis Google"
        description="Affichage des avis Google My Business sur votre site"
        saving={saving}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconKey size={16} /> API Google</CardTitle>
            <CardDescription>Clés nécessaires pour récupérer les avis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Place ID Google">
              <Input {...register('google_place_id')} placeholder="ChIJ..." />
            </Field>
            <Field label="Clé API Google Places">
              <Input {...register('google_api_key')} type="password" placeholder="AIza..." />
            </Field>
            <Field label="Durée du cache (secondes)">
              <Input {...register('cache_duration', { valueAsNumber: true })} type="number" min={60} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconEye size={16} /> Affichage</CardTitle>
            <CardDescription>Paramètres de rendu des avis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Style d'affichage">
              <Select onValueChange={v => setValue('display_style', v)} defaultValue={watch('display_style')}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grille</SelectItem>
                  <SelectItem value="list">Liste</SelectItem>
                  <SelectItem value="carousel">Carrousel</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nombre d'avis">
              <Input {...register('reviews_count', { valueAsNumber: true })} type="number" min={1} max={20} />
            </Field>
            <Field label="Note minimale">
              <Select onValueChange={v => setValue('min_rating', parseInt(v))} defaultValue={String(watch('min_rating'))}>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">CSS personnalisé</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register('custom_css')}
            className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder=".werocket-review { ... }"
          />
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

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={!!checked} onCheckedChange={onChange} />
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
