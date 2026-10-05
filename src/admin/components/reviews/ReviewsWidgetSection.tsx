import { useState } from 'react'
import type { PathValue, UseFormReturn } from 'react-hook-form'
import {
  CircleCheck, Eye, GalleryHorizontal, Info, LayoutGrid, LayoutTemplate, ListFilter, Monitor, Moon,
  Paintbrush, Rows3, Smartphone, Sun, Tablet,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewsLayout } from '@/frontend/reviews/layout'
import { selectReviews } from '@/frontend/reviews/select'
import { TEMPLATES, TEMPLATE_META } from '@/frontend/reviews/templates'
import { cn } from '@/lib/utils'
import type { Breakpoint, Review, ResponsiveValue, ReviewsSettings, ReviewTemplate } from '@/lib/types'
import { ColorField, Field, NumberStepper, SegmentedControl } from '../controls'
import { CopyChip } from '../CopyChip'
import { SettingsSection, SettingSwitchRow } from '../SettingsSection'
import { DEMO_REVIEWS } from './demo-reviews'
import { visibleCount } from './summary'

interface Props {
  form: UseFormReturn<ReviewsSettings>
  /** Catalogue réel ; vide → avis de démonstration */
  catalog: Review[]
}

type Device = Breakpoint
type Background = 'light' | 'dark'

const DEVICE_WIDTH: Record<Device, string> = { desktop: 'max-w-none', tablet: 'max-w-[768px]', mobile: 'max-w-[375px]' }

/** Couleurs « Auto » : celles des modèles (templates.tsx), affichées à titre indicatif. */
const AUTO_COLORS = { star: '#FBBC04', cardBg: '#FFFFFF', text: '#1F1F1F', border: '#E8EAED' }

export function ReviewsWidgetSection({ form, catalog }: Props) {
  const [device, setDevice] = useState<Device>('desktop')
  const [background, setBackground] = useState<Background>('light')
  const settings = form.watch()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <Card variant="panel">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Eye className="size-[15px] text-muted-foreground" />
          <div role="heading" aria-level={2} className="flex-1 text-[13px] font-semibold text-foreground">Aperçu en direct</div>
          <SegmentedControl<Device>
            size="sm"
            label="Largeur d'écran"
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', icon: Monitor, label: <span className="sr-only">Ordinateur</span> },
              { value: 'tablet', icon: Tablet, label: <span className="sr-only">Tablette</span> },
              { value: 'mobile', icon: Smartphone, label: <span className="sr-only">Mobile</span> },
            ]}
          />
          <SegmentedControl<Background>
            size="sm"
            label="Fond de la page"
            value={background}
            onChange={setBackground}
            options={[
              { value: 'light', icon: Sun, label: 'Fond clair' },
              { value: 'dark', icon: Moon, label: 'Fond sombre' },
            ]}
          />
          <CopyChip text="[werocket_reviews]" />
        </div>
        <div className={cn('border-t border-border px-6 py-8', background === 'light' ? 'bg-preview-light' : 'bg-preview-dark')}>
          <div className={cn('mx-auto w-full transition-[max-width]', DEVICE_WIDTH[device])}>
            <WidgetPreview settings={settings} catalog={catalog} />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="template">
        <TabsList variant="line" className="h-10 w-full justify-start gap-6 rounded-none border-b border-input px-1">
          {[
            { value: 'template', icon: LayoutTemplate, label: 'Modèle' },
            { value: 'content', icon: ListFilter, label: 'Contenu' },
            { value: 'style', icon: Paintbrush, label: 'Style' },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-none px-0 text-[13.5px] group-data-horizontal/tabs:after:bottom-[-1px] data-active:font-semibold data-active:text-foreground"
            >
              <Icon className="size-[15px]" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="template" className="pt-5"><TemplatePicker form={form} /></TabsContent>
        <TabsContent value="content" className="pt-5"><ContentTab form={form} catalogSize={catalog.length} /></TabsContent>
        <TabsContent value="style" className="pt-5"><StyleTab form={form} /></TabsContent>
      </Tabs>
    </div>
  )
}

function WidgetPreview({ settings, catalog }: { settings: ReviewsSettings; catalog: Review[] }) {
  const demo = catalog.length === 0
  const count = Math.max(1, Math.min(20, Number(settings.reviews_count ?? 3)))
  const reviews = selectReviews(demo ? DEMO_REVIEWS : catalog, settings, count)
  const Template = TEMPLATES[(settings.template as ReviewTemplate) ?? 'classic'] ?? TEMPLATES.classic

  if (!reviews.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Aucun avis ne correspond à la note minimale choisie.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {demo && (
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="size-3.5" />
          Avis fictifs : synchronisez votre fiche Google pour afficher vos vrais avis.
        </p>
      )}
      <ReviewsLayout settings={settings}>
        {reviews.map((review, i) => <Template key={`${review.author_name}-${i}`} review={review} settings={settings} />)}
      </ReviewsLayout>
    </div>
  )
}

/** Raccourci typé pour modifier un réglage en marquant le formulaire comme modifié. */
function useSet(form: UseFormReturn<ReviewsSettings>) {
  return <K extends keyof ReviewsSettings>(key: K, value: ReviewsSettings[K]) =>
    form.setValue(key, value as PathValue<ReviewsSettings, K>, { shouldDirty: true })
}

function TemplatePicker({ form }: { form: UseFormReturn<ReviewsSettings> }) {
  const set = useSet(form)
  const current = (form.watch('template') as ReviewTemplate) || 'classic'
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">Choisissez un modèle de départ. Vous pourrez ajuster le contenu et le style ensuite.</p>
      <div role="radiogroup" aria-label="Modèle" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {(Object.entries(TEMPLATE_META) as [ReviewTemplate, (typeof TEMPLATE_META)[ReviewTemplate]][]).map(([key, meta]) => {
          const active = current === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => set('template', key)}
              className={cn(
                'flex flex-col overflow-hidden rounded-[10px] bg-card text-left transition-shadow',
                active ? 'ring-[1.5px] ring-primary' : 'ring-1 ring-border hover:ring-input'
              )}
            >
              <span className="m-1.5 flex aspect-[5/3] items-center justify-center overflow-hidden rounded-[6px] bg-muted p-2">
                {meta.thumbnail}
              </span>
              <span className={cn('flex items-center gap-2 px-2.5 pt-1 pb-2.5', active && 'bg-primary-muted')}>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-foreground">{meta.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{meta.description}</span>
                </span>
                {active && <CircleCheck className="size-[18px] shrink-0 fill-primary text-primary-foreground" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ContentTab({ form, catalogSize }: { form: UseFormReturn<ReviewsSettings>; catalogSize: number }) {
  const set = useSet(form)
  const { watch } = form
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SettingsSection title="Avis affichés" description="Sélection des avis parmi votre catalogue" padded>
        <Field
          label="Nombre d'avis"
          htmlFor="wr-reviews-count"
          hint={`${catalogSize} avis disponible${catalogSize > 1 ? 's' : ''} aujourd'hui. Google en renvoie 10 par synchronisation : le catalogue grandit avec le temps.`}
        >
          <NumberStepper id="wr-reviews-count" min={1} max={20} value={Number(watch('reviews_count') ?? 5)} onChange={v => set('reviews_count', v)} />
        </Field>
        <Field label="Note minimale" hint="Les avis en dessous de cette note ne sont jamais affichés.">
          <SegmentedControl<number>
            label="Note minimale"
            value={Number(watch('min_rating') ?? 4)}
            onChange={v => set('min_rating', v)}
            options={[
              { value: 1, label: 'Toutes' },
              { value: 3, label: '3 et +' },
              { value: 4, label: '4 et +' },
              { value: 5, label: '5 seulement' },
            ]}
          />
        </Field>
        <Field label="Ordre d'affichage" htmlFor="wr-order">
          <Select value={watch('reviews_order') ?? 'newest'} onValueChange={v => set('reviews_order', v as ReviewsSettings['reviews_order'])}>
            <SelectTrigger id="wr-order" className="h-[38px] w-full rounded-[8px] bg-card ring-1 ring-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Les plus récents d'abord</SelectItem>
              <SelectItem value="best">Les mieux notés d'abord</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </SettingsSection>

      <SettingsSection title="Éléments de la carte" description="Ce qui apparaît sur chaque avis">
        <SettingSwitchRow title="Étoiles" description="Note de l'avis sous le nom de l'auteur" checked={watch('show_rating') !== false} onCheckedChange={v => set('show_rating', v)} />
        <SettingSwitchRow title="Date" description="Ancienneté relative, ex. « il y a 2 mois »" checked={watch('show_date') !== false} onCheckedChange={v => set('show_date', v)} />
        <SettingSwitchRow title="Photo de profil" description="Avatar Google de l'auteur, ou son initiale" checked={watch('show_avatar') !== false} onCheckedChange={v => set('show_avatar', v)} />
        <SettingSwitchRow title="Mention « Publié sur Google »" description="Rappelle la provenance de l'avis" checked={watch('show_google_badge') !== false} onCheckedChange={v => set('show_google_badge', v)} />
      </SettingsSection>
    </div>
  )
}

function StyleTab({ form }: { form: UseFormReturn<ReviewsSettings> }) {
  const set = useSet(form)
  const { watch } = form
  const format = watch('display_style') || 'grid'
  const radius = Number(watch('card_radius') ?? 12)

  /** Avis visibles : n sur ordinateur, au plus 2 sur tablette, 1 sur mobile. */
  function setVisible(n: number) {
    const value = { desktop: n, tablet: Math.min(n, 2), mobile: 1 }
    set(format === 'carousel' ? 'carousel_slides' : 'grid_columns', value)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <SettingsSection title="Disposition" description="Organisation des avis dans la page" padded>
          <Field label="Format">
            <SegmentedControl<string>
              label="Format"
              value={format}
              onChange={v => set('display_style', v)}
              options={[
                { value: 'carousel', icon: GalleryHorizontal, label: 'Carrousel' },
                { value: 'grid', icon: LayoutGrid, label: 'Grille' },
                { value: 'list', icon: Rows3, label: 'Liste' },
              ]}
            />
          </Field>
          {format !== 'list' && (
            <Field label="Avis visibles à la fois" hint="Passe automatiquement à 1 avis sur mobile.">
              <SegmentedControl<number>
                label="Avis visibles à la fois"
                value={visibleCount(watch())}
                onChange={setVisible}
                options={[1, 2, 3, 4].map(n => ({ value: n, label: String(n) }))}
              />
            </Field>
          )}
          {format === 'carousel' && (
            <SettingSwitchRow
              className="px-0 pt-3.5 pb-0"
              title="Défilement automatique"
              description={`Change d'avis toutes les ${Number(watch('carousel_autoplay_speed') ?? 5)} secondes`}
              checked={!!watch('carousel_autoplay')}
              onCheckedChange={v => set('carousel_autoplay', v)}
            />
          )}
        </SettingsSection>

        <SettingsSection title="Couleurs et formes" description="Laissez « Auto » pour suivre les couleurs de Google" padded>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <ColorField id="wr-star-color" label="Étoiles" value={watch('star_color') ?? ''} auto={AUTO_COLORS.star} onChange={v => set('star_color', v)} />
            <ColorField id="wr-card-bg" label="Fond des cartes" value={watch('card_bg_color') ?? ''} auto={AUTO_COLORS.cardBg} onChange={v => set('card_bg_color', v)} />
            <ColorField id="wr-text-color" label="Texte" value={watch('text_color') ?? ''} auto={AUTO_COLORS.text} onChange={v => set('text_color', v)} />
            <ColorField id="wr-border-color" label="Bordure" value={watch('card_border_color') ?? ''} auto={AUTO_COLORS.border} onChange={v => set('card_border_color', v)} />
          </div>
          <Field label="Arrondi des cartes">
            <div className="flex items-center gap-3">
              <Slider className="flex-1" min={0} max={32} step={1} value={[radius]} onValueChange={([v]) => set('card_radius', v)} aria-label="Arrondi des cartes" />
              <span className="flex h-[30px] w-14 items-center justify-center rounded-[7px] text-[12.5px] text-foreground ring-1 ring-input tabular-nums">{radius} px</span>
            </div>
          </Field>
          <SettingSwitchRow
            className="px-0 pt-3.5 pb-0"
            title="Ombre portée"
            description="Détache les cartes du fond de la page"
            checked={(watch('card_shadow') ?? 'subtle') !== 'none'}
            onCheckedChange={v => set('card_shadow', v ? 'subtle' : 'none')}
          />
        </SettingsSection>
      </div>

      <AdvancedSettings form={form} />
    </div>
  )
}

const BREAKPOINTS: { key: Breakpoint; label: string }[] = [
  { key: 'desktop', label: 'Ordinateur' },
  { key: 'tablet', label: 'Tablette' },
  { key: 'mobile', label: 'Mobile' },
]

/** Réglages fins conservés hors maquette : valeurs par écran, avatar, options du carrousel. */
function AdvancedSettings({ form }: { form: UseFormReturn<ReviewsSettings> }) {
  const set = useSet(form)
  const { watch } = form
  const format = watch('display_style') || 'grid'
  const avatar = Number(watch('avatar_size') ?? 40)
  const speed = Number(watch('carousel_autoplay_speed') ?? 5)

  const rows: { key: 'carousel_slides' | 'grid_columns' | 'grid_gap' | 'card_padding'; label: string; min: number; max: number }[] = [
    ...(format === 'list' ? [] : [format === 'carousel'
      ? { key: 'carousel_slides' as const, label: 'Avis visibles', min: 1, max: 4 }
      : { key: 'grid_columns' as const, label: 'Colonnes', min: 1, max: 4 }]),
    { key: 'grid_gap', label: 'Espacement (px)', min: 0, max: 48 },
    { key: 'card_padding', label: 'Marge interne des cartes (px)', min: 8, max: 40 },
  ]

  function setResponsive(key: (typeof rows)[number]['key'], bp: Breakpoint, raw: string, min: number, max: number) {
    const n = parseInt(raw, 10)
    if (Number.isNaN(n)) return
    const current = (watch(key) as ResponsiveValue<number> | undefined) ?? { desktop: min, tablet: min, mobile: min }
    set(key, { ...current, [bp]: Math.max(min, Math.min(max, n)) })
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced" className="rounded-[12px] bg-card ring-1 ring-border">
        <AccordionTrigger className="px-6 py-4 text-[15px] font-semibold hover:no-underline">
          <span className="flex flex-col gap-1 text-left">
            Réglages avancés
            <span className="text-[13px] font-normal text-muted-foreground">Valeurs par écran, taille des avatars, options du carrousel</span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-5 border-t border-border px-6 pt-5 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-xs text-subtle-foreground">
                  <th className="pb-2 text-left font-medium">Réglage</th>
                  {BREAKPOINTS.map(bp => <th key={bp.key} className="pb-2 text-left font-medium">{bp.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const value = watch(row.key) as ResponsiveValue<number> | undefined
                  return (
                    <tr key={row.key} className="border-t border-border">
                      <td className="py-2 pr-4 font-medium text-foreground">{row.label}</td>
                      {BREAKPOINTS.map(bp => (
                        <td key={bp.key} className="py-2 pr-3">
                          <Input
                            type="number"
                            min={row.min}
                            max={row.max}
                            aria-label={`${row.label} — ${bp.label}`}
                            value={value?.[bp.key] ?? ''}
                            onChange={e => setResponsive(row.key, bp.key, e.target.value, row.min, row.max)}
                            className="h-8 w-20 rounded-[7px] border-input bg-card px-2 text-[13px] focus-visible:border-primary focus-visible:ring-0"
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Field label="Taille des avatars">
            <div className="flex items-center gap-3">
              <Slider className="flex-1" min={24} max={72} step={2} value={[avatar]} onValueChange={([v]) => set('avatar_size', v)} aria-label="Taille des avatars" />
              <span className="flex h-[30px] w-14 items-center justify-center rounded-[7px] text-[12.5px] text-foreground ring-1 ring-input tabular-nums">{avatar} px</span>
            </div>
          </Field>

          {format === 'carousel' && (
            <div className="flex flex-col">
              <Field label="Vitesse du défilement automatique">
                <div className="flex items-center gap-3">
                  <Slider className="flex-1" min={2} max={30} step={1} value={[speed]} onValueChange={([v]) => set('carousel_autoplay_speed', v)} aria-label="Vitesse du défilement" />
                  <span className="flex h-[30px] w-14 items-center justify-center rounded-[7px] text-[12.5px] text-foreground ring-1 ring-input tabular-nums">{speed} s</span>
                </div>
              </Field>
              <SettingSwitchRow className="mt-4 px-0 py-3.5" title="Lecture en boucle" description="Revient au premier avis après le dernier" checked={watch('carousel_loop') !== false} onCheckedChange={v => set('carousel_loop', v)} />
              <SettingSwitchRow className="px-0 py-3.5" title="Flèches de navigation" checked={watch('carousel_show_arrows') !== false} onCheckedChange={v => set('carousel_show_arrows', v)} />
              <SettingSwitchRow className="px-0 pt-3.5 pb-0" title="Points indicateurs" checked={watch('carousel_show_dots') !== false} onCheckedChange={v => set('carousel_show_dots', v)} />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
