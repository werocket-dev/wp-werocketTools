import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { IconLoader2, IconPalette, IconFileText } from '@tabler/icons-react'
import { api } from '@/lib/api'
import { ModuleHeader } from '../components/ModuleHeader'

interface CookiesFormData {
  position: string
  theme: string
  primary_color: string
  accept_all_text: string
  decline_text: string
  settings_text: string
  notice_text: string
  privacy_policy_url: string
  notice_as_modal: boolean
  show_decline_button: boolean
  cookie_expires: number
}

export function CookiesSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, watch, reset } = useForm<CookiesFormData>()

  useEffect(() => {
    api.get<{ settings: CookiesFormData }>('/settings/cookies')
      .then(data => reset(data.settings))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(data: CookiesFormData) {
    setSaving(true)
    try {
      await api.put('/settings/cookies', { settings: data })
      toast.success('Paramètres cookies enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton />

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ModuleHeader
        title="Gestion des Cookies"
        description="Configuration du bandeau de consentement RGPD (Klaro)"
        saving={saving}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconFileText size={16} /> Textes</CardTitle>
            <CardDescription>Messages affichés aux visiteurs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Texte de la notice">
              <Input {...register('notice_text')} placeholder="Nous utilisons des cookies..." />
            </Field>
            <Field label="Bouton Tout accepter">
              <Input {...register('accept_all_text')} placeholder="Tout accepter" />
            </Field>
            <Field label="Bouton Refuser">
              <Input {...register('decline_text')} placeholder="Refuser" />
            </Field>
            <Field label="Bouton Paramètres">
              <Input {...register('settings_text')} placeholder="Gérer mes préférences" />
            </Field>
            <Field label="URL Politique de confidentialité">
              <Input {...register('privacy_policy_url')} type="url" placeholder="https://..." />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><IconPalette size={16} /> Apparence & comportement</CardTitle>
            <CardDescription>Thème et positionnement du bandeau</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Position">
              <Select onValueChange={v => setValue('position', v)} defaultValue={watch('position')}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom">Bas de page</SelectItem>
                  <SelectItem value="top">Haut de page</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Thème">
              <Select onValueChange={v => setValue('theme', v)} defaultValue={watch('theme')}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Couleur principale">
              <div className="flex items-center gap-2">
                <input type="color" {...register('primary_color')} className="h-9 w-14 rounded border border-input cursor-pointer" />
                <Input {...register('primary_color')} className="font-mono text-sm" />
              </div>
            </Field>
            <Separator />
            <SwitchField label="Afficher comme modale" register={register} name="notice_as_modal" watch={watch} setValue={setValue} />
            <SwitchField label="Afficher le bouton Refuser" register={register} name="show_decline_button" watch={watch} setValue={setValue} />
          </CardContent>
        </Card>
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

function SwitchField({ label, name, watch, setValue }: {
  label: string
  register: ReturnType<typeof useForm<CookiesFormData>>['register']
  name: keyof CookiesFormData
  watch: ReturnType<typeof useForm<CookiesFormData>>['watch']
  setValue: ReturnType<typeof useForm<CookiesFormData>>['setValue']
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm cursor-pointer">{label}</Label>
      <Switch checked={!!watch(name)} onCheckedChange={v => setValue(name, v as never)} />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <IconLoader2 size={20} className="animate-spin" />
      Chargement...
    </div>
  )
}
