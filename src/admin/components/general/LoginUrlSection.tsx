import { useEffect, useState } from 'react'
import type { PathValue, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AppWindow, Ban, Check, Copy, Dices, LifeBuoy, LoaderCircle, LogIn, ShieldAlert, ShieldCheck, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { getAdminData, getBootstrap } from '@/lib/admin-bootstrap'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'
import type { GeneralSettings, LoginRedirectMode } from '@/lib/types'
import { PanelTitle, SettingsSection, SettingSwitchRow } from '../SettingsSection'
import { StatusBadge } from '../StatusBadge'

export type SlugStatus =
  | { state: 'idle' | 'checking' }
  | { state: 'available'; url: string }
  | { state: 'unavailable'; reason: string }

type Page = { id: number; title: string }

/** Liste des pages publiées : chargée une fois, à la première demande. */
let pagesRequest: Promise<Page[]> | null = null
function loadPages(): Promise<Page[]> {
  return (pagesRequest ??= api.get<Page[]>('/general/pages').catch(() => []))
}

async function copyUrl(url: string, success: string) {
  if (await copyToClipboard(url)) toast.success(success)
  else toast.error(`Copie impossible : ${url}`)
}

const WORDS_A = ['espace', 'acces', 'portail', 'entree', 'bureau', 'atelier']
const WORDS_B = ['equipe', 'prive', 'interne', 'pro', 'gestion', 'studio']
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]

function randomSlug(): string {
  return `${pick(WORDS_A)}-${pick(WORDS_B)}-${Math.floor(100 + Math.random() * 900)}`
}

/** Garde uniquement minuscules, chiffres et tirets pendant la saisie. */
function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-/, '')
}

const REDIRECT_OPTIONS: { value: LoginRedirectMode; title: string; description: string }[] = [
  { value: '404', title: 'Afficher une page 404', description: 'Le visiteur pense que la page n\'existe pas. Recommandé.' },
  { value: 'home', title: 'Rediriger vers l\'accueil', description: 'Renvoie vers la page d\'accueil de votre site.' },
  { value: 'page', title: 'Rediriger vers une autre page', description: 'Choisissez une page de votre site.' },
]

interface Props {
  form: UseFormReturn<GeneralSettings>
  slugStatus: SlugStatus
}

export function LoginUrlSection({ form, slugStatus }: Props) {
  const { watch, setValue } = form
  const enabled = watch('login_enabled')
  const slug = watch('login_slug') ?? ''
  const redirect = watch('login_redirect')
  const [pages, setPages] = useState<Page[]>([])

  useEffect(() => {
    if (redirect === 'page') loadPages().then(setPages)
  }, [redirect])

  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) =>
    setValue(key, value as PathValue<GeneralSettings, K>, { shouldDirty: true })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
      <Card variant="panel" className="flex-row flex-wrap items-center gap-4 p-6">
        <div className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          enabled ? 'bg-primary-muted text-primary' : 'bg-warning-muted text-warning'
        )}>
          {enabled ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
        </div>
        <div className="min-w-0 flex-1 basis-64">
          <div className="text-base font-semibold text-foreground">
            {enabled ? 'Votre page de connexion est masquée' : 'Votre page de connexion est visible de tous'}
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {enabled
              ? 'Les robots qui tentent /wp-login.php ou /wp-admin ne trouvent plus votre formulaire de connexion.'
              : 'Activez une URL personnalisée pour que les robots qui tentent /wp-login.php ou /wp-admin ne trouvent plus votre formulaire.'}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-[8px] bg-muted px-3 py-2 ring-1 ring-border">
          <span className="text-[13px] font-medium text-foreground">URL personnalisée</span>
          <Switch checked={enabled} onCheckedChange={v => set('login_enabled', v)} />
        </label>
      </Card>

      <SettingsSection
        title="Nouvelle adresse de connexion"
        description="C'est l'adresse que vous et vos équipes utiliserez pour vous connecter"
        padded
      >
        <div className="flex items-center">
          <label htmlFor="wr-login-slug" className="flex-1 text-[13px] font-medium text-foreground">Adresse</label>
          <button
            type="button"
            onClick={() => set('login_slug', randomSlug())}
            className="inline-flex items-center gap-[5px] text-xs font-semibold text-primary hover:underline"
          >
            <Dices className="size-[13px]" />
            Générer une adresse aléatoire
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={cn(
            'flex h-[42px] min-w-0 flex-1 basis-80 items-center overflow-hidden rounded-[8px] bg-card ring-1 ring-input transition-shadow',
            'focus-within:ring-[1.5px] focus-within:ring-primary',
            slugStatus.state === 'unavailable' && 'ring-destructive focus-within:ring-destructive'
          )}>
            <span className="flex h-full max-w-[45%] shrink-0 items-center truncate border-r border-border bg-muted px-3 font-mono text-[13px] text-muted-foreground">
              {getAdminData().general?.loginPrefix}
            </span>
            <Input
              id="wr-login-slug"
              value={slug}
              onChange={e => set('login_slug', normalizeSlug(e.target.value))}
              placeholder="espace-equipe"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={slugStatus.state === 'unavailable'}
              aria-describedby="wr-login-slug-hint"
              className="h-full flex-1 rounded-none border-0 bg-transparent px-2.5 font-mono text-[13.5px] font-medium focus-visible:ring-0 aria-invalid:ring-0"
            />
            <SlugStatusBadge status={slugStatus} />
          </div>
          <Button
            type="button"
            variant="surface"
            size="panel"
            className="h-[42px]"
            disabled={slugStatus.state !== 'available'}
            onClick={() => slugStatus.state === 'available' && copyUrl(slugStatus.url, 'Adresse copiée')}
          >
            <Copy className="size-4" />
            Copier
          </Button>
        </div>
        <div id="wr-login-slug-hint" className={cn('text-xs', slugStatus.state === 'unavailable' ? 'text-destructive' : 'text-subtle-foreground')}>
          {slugStatus.state === 'unavailable'
            ? slugStatus.reason
            : 'Lettres minuscules, chiffres et tirets. Évitez les mots évidents comme login, admin ou connexion.'}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Si quelqu'un utilise l'ancienne adresse"
        description="Réponse affichée sur /wp-login.php et /wp-admin aux visiteurs non connectés"
      >
        <RadioGroup value={redirect} onValueChange={v => set('login_redirect', v as LoginRedirectMode)} className="gap-0">
          {REDIRECT_OPTIONS.map(option => {
            const checked = redirect === option.value
            return (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer gap-3.5 border-t border-border px-6 py-3.5 transition-colors',
                  checked ? 'bg-primary-muted' : 'hover:bg-muted/60'
                )}
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{option.title}</span>
                  <span className="mt-[3px] block text-[13px] text-muted-foreground">{option.description}</span>
                  {option.value === 'page' && checked && (
                    <Select
                      value={String(watch('login_redirect_page') || '')}
                      onValueChange={v => set('login_redirect_page', Number(v))}
                    >
                      <SelectTrigger className="mt-2.5 h-9 w-full max-w-sm rounded-[8px] bg-card ring-1 ring-input">
                        <SelectValue placeholder={pages.length ? 'Choisir une page' : 'Aucune page publiée'} />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </span>
              </label>
            )
          })}
        </RadioGroup>
      </SettingsSection>

      <SettingsSection title="Options">
        <SettingSwitchRow
          title="Prévenir les administrateurs par email"
          description="Envoie la nouvelle adresse à tous les administrateurs dès l'enregistrement"
          checked={watch('login_notify')}
          onCheckedChange={v => set('login_notify', v)}
        />
        <SettingSwitchRow
          title="Conserver la session après le changement"
          description="Vous restez connecté : pas besoin de vous reconnecter tout de suite"
          checked={watch('login_keep_session')}
          onCheckedChange={v => set('login_keep_session', v)}
        />
      </SettingsSection>

      <div className="flex gap-3 rounded-[10px] bg-warning-muted px-4 py-3.5 text-warning">
        <LifeBuoy className="mt-px size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">Notez cette adresse avant d'enregistrer</div>
          <div className="mt-[3px] text-[12.5px]">
            En cas d'oubli, renommez le dossier {getBootstrap().pluginFolder} par FTP : l'adresse /wp-login.php redeviendra accessible.
          </div>
        </div>
      </div>
    </div>
  )
}

function SlugStatusBadge({ status }: { status: SlugStatus }) {
  switch (status.state) {
    case 'idle':
      return null
    case 'checking':
      return <StatusBadge tone="neutral" icon={<LoaderCircle className="animate-spin" />} className="mr-2">Vérification</StatusBadge>
    case 'available':
      return <StatusBadge icon={<Check />} className="mr-2">Disponible</StatusBadge>
    case 'unavailable':
      return <StatusBadge tone="destructive" icon={<X />} className="mr-2">Indisponible</StatusBadge>
  }
}

const REDIRECT_RESULT: Record<LoginRedirectMode, string> = { '404': 'Page 404', home: 'Accueil', page: 'Autre page' }

/** Colonne de droite : ce que voient les visiteurs avec la configuration enregistrée. */
export function LoginUrlAside({ saved, dirty }: { saved: GeneralSettings; dirty: boolean }) {
  const active = saved.login_enabled && saved.login_url !== ''
  const blocked = REDIRECT_RESULT[saved.login_redirect] ?? 'Page 404'
  const rows = active
    ? [
        { path: '/wp-login.php', allowed: false, result: blocked },
        { path: '/wp-admin', allowed: false, result: blocked },
        { path: `/${saved.login_slug}`, allowed: true, result: 'Connexion' },
      ]
    : [
        { path: '/wp-login.php', allowed: true, result: 'Connexion' },
        { path: '/wp-admin', allowed: true, result: 'Connexion' },
      ]

  function test() {
    if (!active) {
      toast.info('Activez et enregistrez une URL personnalisée pour la tester.')
      return
    }
    if (dirty) toast.warning('Le test porte sur l\'adresse enregistrée, pas sur vos modifications en cours.')
    copyUrl(saved.login_url, 'Adresse copiée : collez-la dans une fenêtre de navigation privée.')
  }

  return (
    <aside className="flex shrink-0 flex-col gap-5 2xl:w-[360px]">
      <Card variant="panel">
        <div className="px-4 pt-4 pb-3">
          <PanelTitle>Ce que voient les visiteurs</PanelTitle>
          <div className="mt-1 text-xs text-subtle-foreground">Visiteur non connecté</div>
        </div>
        {rows.map(row => (
          <div key={row.path} className="flex items-center gap-2.5 border-t border-border px-4 py-[11px]">
            {row.allowed
              ? <LogIn className="size-3.5 shrink-0 text-primary" />
              : <Ban className="size-3.5 shrink-0 text-subtle-foreground" />}
            <span className={cn('min-w-0 flex-1 truncate font-mono text-[12.5px]', row.allowed ? 'text-foreground' : 'text-muted-foreground')}>
              {row.path}
            </span>
            <span className={cn(
              'flex h-[22px] shrink-0 items-center rounded-[6px] px-2 text-[11.5px] font-semibold',
              row.allowed ? 'bg-primary-muted text-primary-strong' : 'bg-muted text-muted-foreground ring-1 ring-border'
            )}>
              {row.result}
            </span>
          </div>
        ))}
        <div className="border-t border-border p-4">
          <Button type="button" variant="surface" size="panel" className="w-full" onClick={test}>
            <AppWindow className="size-4" />
            Tester en navigation privée
          </Button>
        </div>
      </Card>

      <Card variant="panel" className="gap-2.5 p-4">
        <PanelTitle>Bon à savoir</PanelTitle>
        {[
          'Les liens « Mot de passe oublié » et les emails de réinitialisation utilisent automatiquement la nouvelle adresse.',
          'WooCommerce : la page « Mon compte » continue de fonctionner pour vos clients.',
        ].map(text => (
          <div key={text} className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span className="text-[12.5px] text-muted-foreground">{text}</span>
          </div>
        ))}
      </Card>
    </aside>
  )
}
