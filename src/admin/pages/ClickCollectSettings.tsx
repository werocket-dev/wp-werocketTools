import { useEffect, useState } from 'react'
import { useForm, useFieldArray, type Control, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  IconMapPin, IconClock, IconSettings, IconPlus, IconTrash,
  IconBuildingStore, IconCalendarTime, IconAlertCircle, IconEye, IconPalette,
} from '@tabler/icons-react'
import { api } from '@/lib/api'
import { Spinner } from '../components/Spinner'
import { useRegisterSaveForm } from '../context/SaveContext'
import type {
  ClickCollectSettings as TClickCollectSettings, ClickCollectLocation,
  DayKey, CCDaySchedule, CCTimeSlot,
} from '@/lib/types'

const FORM_ID = 'wr-form-click-collect'

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Lundi' },
  { key: 'tue', label: 'Mardi' },
  { key: 'wed', label: 'Mercredi' },
  { key: 'thu', label: 'Jeudi' },
  { key: 'fri', label: 'Vendredi' },
  { key: 'sat', label: 'Samedi' },
  { key: 'sun', label: 'Dimanche' },
]

function emptyDay(): CCDaySchedule {
  return { enabled: false, slots: [] }
}

function emptySchedule(): Record<DayKey, CCDaySchedule> {
  return {
    mon: emptyDay(), tue: emptyDay(), wed: emptyDay(), thu: emptyDay(),
    fri: emptyDay(), sat: emptyDay(), sun: emptyDay(),
  }
}

function newLocation(): ClickCollectLocation {
  return {
    id: 'loc_' + Math.random().toString(36).slice(2, 10),
    name: 'Nouveau lieu de retrait',
    address: '',
    phone: '',
    email: '',
    enabled: true,
    cost: 0,
    schedule: emptySchedule(),
    closed_dates: [],
  }
}

export function ClickCollectSettings() {
  const [loading, setLoading] = useState(true)
  const { setSaving } = useRegisterSaveForm(FORM_ID)
  const { register, handleSubmit, control, setValue, watch, reset } =
    useForm<TClickCollectSettings>({ defaultValues: undefined })

  const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
    control, name: 'locations', keyName: '_key',
  })

  useEffect(() => {
    api.get<{ settings: TClickCollectSettings }>('/settings/click_collect')
      .then(data => reset(data.settings))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(data: TClickCollectSettings) {
    setSaving(true)
    try {
      await api.put('/settings/click_collect', { settings: data })
      toast.success('Réglages enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconSettings size={16} /></div>
            Méthode d'expédition
          </CardTitle>
          <CardDescription>Réglages de la méthode WooCommerce « Clic & Collect ».</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Titre affiché au client">
              <Input {...register('method_title')} placeholder="Clic & Collect" />
            </Field>
            <Field label="Coût (€)">
              <Input type="number" step="0.01" {...register('cost', { valueAsNumber: true })} />
            </Field>
          </div>
          <Field label="Description courte">
            <Textarea rows={2} {...register('method_description')} />
          </Field>
          <Field label="Instructions affichées dans la commande / l'email">
            <Textarea rows={3} {...register('instructions')} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SwitchRow
              label="Afficher dans le récap panier"
              description="Ajoute lieu + date sous la ligne de méthode d'expédition dans le panier."
              checked={!!watch('show_in_cart')}
              onChange={v => setValue('show_in_cart', v)}
            />
            <SwitchRow
              label="Afficher dans la page de commande"
              description="Bloc dédié sur la page « Merci » et le détail My Account."
              checked={!!watch('show_in_order')}
              onChange={v => setValue('show_in_order', v)}
            />
            <SwitchRow
              label="Afficher dans les emails"
              description="Ajoute le bloc dans les emails client (commande, traitement)."
              checked={!!watch('show_in_emails')}
              onChange={v => setValue('show_in_emails', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconPalette size={16} /></div>
            Apparence du sélecteur
          </CardTitle>
          <CardDescription>Personnalisez les couleurs du calendrier et des créneaux affichés au checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ColorRow
                label="Couleur d'accent"
                description="Jour sélectionné, créneau actif, badges numérotés."
                value={watch('accent_color') ?? '#0F766E'}
                onChange={v => setValue('accent_color', v)}
              />
              <ColorRow
                label="Texte sur accent"
                description="Couleur du chiffre dans le pavé sélectionné."
                value={watch('accent_text_color') ?? '#FFFFFF'}
                onChange={v => setValue('accent_text_color', v)}
              />
              <ColorRow
                label="Fond du panneau"
                description="Arrière-plan du bloc « Retrait en magasin »."
                value={watch('panel_bg_color') ?? '#FAF8F4'}
                onChange={v => setValue('panel_bg_color', v)}
              />
              <ColorRow
                label="Bordures"
                description="Contour du panneau et du calendrier."
                value={watch('panel_border_color') ?? '#E7E1D5'}
                onChange={v => setValue('panel_border_color', v)}
              />
              <ColorRow
                label="Couleur du texte"
                description="Texte principal."
                value={watch('text_color') ?? '#1F2A37'}
                onChange={v => setValue('text_color', v)}
              />
            </div>
            <CalendarPreview
              accent={watch('accent_color') ?? '#0F766E'}
              accentText={watch('accent_text_color') ?? '#FFFFFF'}
              panelBg={watch('panel_bg_color') ?? '#FAF8F4'}
              panelBorder={watch('panel_border_color') ?? '#E7E1D5'}
              text={watch('text_color') ?? '#1F2A37'}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconCalendarTime size={16} /></div>
            Délai & disponibilités
          </CardTitle>
          <CardDescription>Contrôle le délai de préparation et la fenêtre de retrait.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            label="Activer un délai minimum (delta)"
            description="Bloque les créneaux trop proches de la commande."
            checked={!!watch('enable_lead_time')}
            onChange={v => setValue('enable_lead_time', v)}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Délai minimum (heures)">
              <Input
                type="number" min={0} step={1}
                disabled={!watch('enable_lead_time')}
                {...register('min_lead_time_hours', { valueAsNumber: true })}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Ex. 24 = retrait possible à partir de 24h après la commande.
              </p>
            </Field>
            <Field label="Fenêtre maximale (jours)">
              <Input type="number" min={1} step={1} {...register('max_days_ahead', { valueAsNumber: true })} />
              <p className="text-[11px] text-muted-foreground mt-1">
                Combien de jours à l'avance le client peut réserver.
              </p>
            </Field>
            <Field label="Intervalle entre créneaux (minutes)">
              <Input type="number" min={5} step={5} {...register('slot_interval_minutes', { valueAsNumber: true })} />
              <p className="text-[11px] text-muted-foreground mt-1">
                Génère les créneaux par pas (ex. 30 → 09:00, 09:30, 10:00…).
              </p>
            </Field>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SwitchRow
              label="Demander un créneau horaire"
              description="Si désactivé, seule la date est demandée."
              checked={!!watch('require_time_slot')}
              onChange={v => setValue('require_time_slot', v)}
            />
            <SwitchRow
              label="Bloquer les commandes hors créneau"
              description="Refuse la validation si le créneau ne respecte plus le delta ou les horaires."
              checked={!!watch('block_unavailable')}
              onChange={v => setValue('block_unavailable', v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-3 font-bold">
              <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconBuildingStore size={16} /></div>
              Lieux de retrait
            </CardTitle>
            <CardDescription>Configurez un ou plusieurs lieux et leurs horaires d'ouverture.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => appendLocation(newLocation())} className="gap-1.5">
            <IconPlus size={14} /> Ajouter un lieu
          </Button>
        </CardHeader>
        <CardContent>
          {locationFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              <IconAlertCircle size={28} className="mx-auto mb-2 opacity-60" />
              Aucun lieu configuré. Cliquez sur « Ajouter un lieu » pour commencer.
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={[locationFields[0]?._key]} className="space-y-3">
              {locationFields.map((field, idx) => (
                <LocationItem
                  key={field._key}
                  itemKey={field._key}
                  index={idx}
                  control={control}
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  onRemove={() => removeLocation(idx)}
                />
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-bold">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><IconEye size={16} /></div>
            Activation
          </CardTitle>
          <CardDescription>Pour activer le mode au checkout, ajoutez la méthode « Clic & Collect » à vos zones d'expédition WooCommerce.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" asChild>
            <a href="/wp-admin/admin.php?page=wc-settings&tab=shipping" target="_blank" rel="noreferrer">
              Ouvrir WooCommerce → Expédition
            </a>
          </Button>
        </CardContent>
      </Card>

    </form>
  )
}

function LocationItem({
  itemKey, index, control, register, watch, setValue, onRemove,
}: {
  itemKey: string
  index: number
  control: Control<TClickCollectSettings>
  register: UseFormRegister<TClickCollectSettings>
  watch: UseFormWatch<TClickCollectSettings>
  setValue: UseFormSetValue<TClickCollectSettings>
  onRemove: () => void
}) {
  const name = watch(`locations.${index}.name`)
  const enabled = !!watch(`locations.${index}.enabled`)

  return (
    <AccordionItem value={itemKey} className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 pr-3 pl-4 py-1">
        <AccordionTrigger className="flex-1 hover:no-underline py-3">
          <div className="flex items-center gap-3 min-w-0">
            <IconMapPin size={16} className="text-primary shrink-0" />
            <span className="font-semibold truncate">{name || 'Lieu sans nom'}</span>
            {enabled
              ? <Badge variant="default" className="ml-1">Actif</Badge>
              : <Badge variant="secondary" className="ml-1">Désactivé</Badge>
            }
          </div>
        </AccordionTrigger>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={enabled}
            onCheckedChange={v => setValue(`locations.${index}.enabled`, v)}
            aria-label="Activer ce lieu"
          />
          <Button
            type="button" variant="ghost" size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <IconTrash size={14} />
          </Button>
        </div>
      </div>

      <AccordionContent className="px-4 pb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nom du lieu">
            <Input {...register(`locations.${index}.name`)} placeholder="Boutique Paris" />
          </Field>
          <Field label="Coût additionnel (€)">
            <Input type="number" step="0.01" {...register(`locations.${index}.cost`, { valueAsNumber: true })} />
          </Field>
        </div>
        <Field label="Adresse">
          <Textarea rows={2} {...register(`locations.${index}.address`)} placeholder="12 rue de Paris&#10;75001 Paris" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Téléphone">
            <Input {...register(`locations.${index}.phone`)} placeholder="01 23 45 67 89" />
          </Field>
          <Field label="Email de contact">
            <Input type="email" {...register(`locations.${index}.email`)} placeholder="boutique@monsite.fr" />
          </Field>
        </div>

        <Separator />

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <IconClock size={13} /> Horaires d'ouverture
          </h4>
          <div className="space-y-2">
            {DAYS.map(d => (
              <DayScheduleRow
                key={d.key}
                dayKey={d.key}
                label={d.label}
                locationIndex={index}
                control={control}
                register={register}
                watch={watch}
                setValue={setValue}
              />
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function DayScheduleRow({
  dayKey, label, locationIndex, control, register, watch, setValue,
}: {
  dayKey: DayKey
  label: string
  locationIndex: number
  control: Control<TClickCollectSettings>
  register: UseFormRegister<TClickCollectSettings>
  watch: UseFormWatch<TClickCollectSettings>
  setValue: UseFormSetValue<TClickCollectSettings>
}) {
  const enabled = !!watch(`locations.${locationIndex}.schedule.${dayKey}.enabled`)
  const { fields, append, remove } = useFieldArray({
    control,
    name: `locations.${locationIndex}.schedule.${dayKey}.slots` as const,
    keyName: '_key',
  })

  function addSlot() {
    const last = fields[fields.length - 1] as unknown as CCTimeSlot | undefined
    const start = last?.end || '09:00'
    const end = bumpTime(start, 3)
    append({ start, end } as CCTimeSlot)
    if (!enabled) {
      setValue(`locations.${locationIndex}.schedule.${dayKey}.enabled`, true)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Switch
            checked={enabled}
            onCheckedChange={v => setValue(`locations.${locationIndex}.schedule.${dayKey}.enabled`, v)}
          />
          <span className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addSlot} className="gap-1.5 text-xs h-7">
          <IconPlus size={12} /> Plage
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="text-[11px] text-muted-foreground ml-12">Fermé</p>
      ) : (
        <div className="space-y-1.5 ml-12">
          {fields.map((slot, sIdx) => (
            <div key={slot._key} className="flex items-center gap-2">
              <Input
                type="time"
                {...register(`locations.${locationIndex}.schedule.${dayKey}.slots.${sIdx}.start`)}
                className="w-28 h-8"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <Input
                type="time"
                {...register(`locations.${locationIndex}.schedule.${dayKey}.slots.${sIdx}.end`)}
                className="w-28 h-8"
              />
              <Button
                type="button" variant="ghost" size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => remove(sIdx)}
              >
                <IconTrash size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function bumpTime(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(':').map(n => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return '18:00'
  const total = (h + hours) * 60 + m
  const hh = Math.min(23, Math.floor(total / 60))
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
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
  label, description, checked, onChange,
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

function ColorRow({
  label, description, value, onChange,
}: {
  label: string
  description?: string
  value: string
  onChange: (v: string) => void
}) {
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
  return (
    <div className="space-y-1.5">
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

function CalendarPreview({
  accent, accentText, panelBg, panelBorder, text,
}: {
  accent: string
  accentText: string
  panelBg: string
  panelBorder: string
  text: string
}) {
  const weeks = [
    [null, null, null, null, null, null, 1],
    [2, 3, 4, 5, 6, 7, 8],
    [9, 10, 11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20, 21, 22],
    [23, 24, 25, 26, 27, 28, 29],
    [30, null, null, null, null, null, null],
  ]
  const closed = new Set([7, 14, 21, 28])
  const selected = 13
  const today = 11
  const weekdayLabels = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: panelBg, border: `1px solid ${panelBorder}`, color: text }}
    >
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          className="size-7 rounded-full inline-flex items-center justify-center text-xs"
          style={{ border: `1px solid ${panelBorder}`, color: text }}
        >‹</button>
        <span className="text-sm font-bold capitalize" style={{ color: text }}>septembre 2026</span>
        <button
          type="button"
          className="size-7 rounded-full inline-flex items-center justify-center text-xs"
          style={{ border: `1px solid ${panelBorder}`, color: text }}
        >›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {weekdayLabels.map(d => (
          <span key={d} className="text-center text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: hexAlpha(text, 0.55) }}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((d, i) => {
          if (d === null) return <span key={i} className="aspect-square" />
          const isSelected = d === selected
          const isToday = d === today
          const isClosed = closed.has(d)
          const isPast = d < 5
          const style: React.CSSProperties = {
            color: isSelected ? accentText : (isPast || isClosed) ? hexAlpha(text, 0.3) : text,
            background: isSelected ? accent : 'transparent',
            boxShadow: isToday && !isSelected ? `inset 0 0 0 1.5px ${hexAlpha(accent, 0.4)}` : undefined,
            backgroundImage: isClosed
              ? `repeating-linear-gradient(45deg, transparent 0, transparent 3px, ${hexAlpha(text, 0.15)} 3px, ${hexAlpha(text, 0.15)} 4px)`
              : undefined,
            textDecoration: isClosed || isPast ? 'line-through' : 'none',
            fontWeight: isSelected ? 700 : 500,
          }
          return (
            <span
              key={i}
              className="aspect-square rounded-[8px] inline-flex items-center justify-center text-[11px] tabular-nums"
              style={style}
            >{d}</span>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {['10:00', '10:30', '11:00'].map((t, i) => {
          const active = i === 1
          return (
            <span
              key={t}
              className="text-center text-[11px] font-semibold rounded-md py-1.5"
              style={{
                background: active ? accent : '#fff',
                color: active ? accentText : text,
                border: `1px solid ${active ? accent : panelBorder}`,
              }}
            >{t}</span>
          )
        })}
      </div>
    </div>
  )
}

function hexAlpha(hex: string, alpha: number): string {
  const v = hex.replace('#', '')
  if (v.length !== 3 && v.length !== 6) return hex
  const full = v.length === 3 ? v.split('').map(c => c + c).join('') : v
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
