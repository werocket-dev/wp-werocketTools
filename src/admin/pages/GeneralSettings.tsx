import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { GeneralSettings as TGeneralSettings, SavedMenuItem } from '@/lib/types'
import { Spinner } from '../components/Spinner'
import { useRegisterSaveForm } from '../context/SaveContext'
import { SubNav, type GeneralSection } from '../components/general/SubNav'
import { LoginUrlAside, LoginUrlSection, type SlugStatus } from '../components/general/LoginUrlSection'
import { AdminMenuSection } from '../components/general/AdminMenuSection'
import { AdminMenuAside } from '../components/general/AdminMenuAside'
import { buildEditorItems, readSnapshot, serializeEditorItems, type EditorItem } from '../components/general/menu-model'

const FORM_ID = 'wr-form-general'
const NO_ITEMS: SavedMenuItem[] = []

function initialSection(): GeneralSection {
  return new URLSearchParams(window.location.search).get('section') === 'menu' ? 'menu' : 'login'
}

export function GeneralSettings() {
  const [saved, setSaved] = useState<TGeneralSettings | null>(null)
  const [section, setSection] = useState<GeneralSection>(initialSection)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ state: 'idle' })
  const snapshot = useMemo(readSnapshot, [])

  const form = useForm<TGeneralSettings>()
  const { handleSubmit, reset, watch, setValue, formState } = form
  const { setSaving } = useRegisterSaveForm(FORM_ID, formState.isDirty)
  const slug = watch('login_slug') ?? ''
  const savedMenu = watch('menu_items') ?? NO_ITEMS
  // L'éditeur se déduit de la valeur du formulaire : une seule source de vérité.
  const menuItems = useMemo(() => buildEditorItems(snapshot, savedMenu), [snapshot, savedMenu])

  function load(settings: TGeneralSettings) {
    reset(settings)
    setSaved(settings)
  }

  useEffect(() => {
    api.get<{ settings: TGeneralSettings }>('/settings/general').then(data => load(data.settings))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Disponibilité de l'adresse, vérifiée côté serveur après une courte pause de saisie.
  useEffect(() => {
    if (!saved || !slug) {
      setSlugStatus({ state: 'idle' })
      return
    }
    // Adresse active : déjà validée par le serveur à l'enregistrement.
    if (saved.login_enabled && slug === saved.login_slug) {
      setSlugStatus({ state: 'available', url: saved.login_url })
      return
    }
    setSlugStatus({ state: 'checking' })
    const timer = window.setTimeout(() => {
      api.get<{ available: boolean; reason: string; url: string }>(`/general/login-slug?slug=${encodeURIComponent(slug)}`)
        .then(r => setSlugStatus(r.available ? { state: 'available', url: r.url } : { state: 'unavailable', reason: r.reason }))
        .catch(() => setSlugStatus({ state: 'idle' }))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [slug, saved])

  function changeMenu(items: EditorItem[]) {
    setValue('menu_items', serializeEditorItems(items), { shouldDirty: true })
  }

  function resetMenu() {
    setValue('menu_items', [], { shouldDirty: true })
    toast.info('Ordre par défaut rétabli : enregistrez pour l\'appliquer.')
  }

  function changeSection(next: GeneralSection) {
    setSection(next)
    const url = new URL(window.location.href)
    url.searchParams.set('section', next)
    window.history.replaceState({}, '', url)
  }

  async function onSubmit(data: TGeneralSettings) {
    if (data.login_enabled && slugStatus.state !== 'available') {
      toast.error('Choisissez une adresse de connexion disponible avant d\'enregistrer.')
      changeSection('login')
      return
    }
    setSaving(true)
    try {
      const { settings } = await api.put<{ settings: TGeneralSettings }>('/settings/general', { settings: data })
      const addressChanged = settings.login_enabled
        && (!saved?.login_enabled || saved.login_slug !== settings.login_slug)

      if (addressChanged && !settings.login_keep_session) {
        // Session fermée côté serveur : on repart de la nouvelle adresse.
        toast.success('Adresse enregistrée. Reconnectez-vous avec la nouvelle adresse…')
        const target = new URL(settings.login_url)
        target.searchParams.set('redirect_to', window.location.href)
        window.setTimeout(() => { window.location.href = target.toString() }, 1500)
        return
      }

      load(settings)
      toast.success(addressChanged ? 'Nouvelle adresse de connexion active' : 'Réglages enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (!saved) return <Spinner />

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 lg:flex-row">
      <SubNav current={section} onChange={changeSection} activeBadges={{ login: saved.login_enabled }} />
      <div className="flex min-w-0 flex-1 flex-col gap-8 2xl:flex-row">
        {section === 'login' ? (
          <>
            <LoginUrlSection form={form} slugStatus={slugStatus} />
            <LoginUrlAside saved={saved} dirty={formState.isDirty} />
          </>
        ) : snapshot.length === 0 ? (
          <div className="flex-1 text-sm text-muted-foreground">Le menu d'administration n'a pas pu être lu sur cette page.</div>
        ) : (
          <>
            <AdminMenuSection items={menuItems} onChange={changeMenu} onReset={resetMenu} />
            <AdminMenuAside items={menuItems} />
          </>
        )}
      </div>
    </form>
  )
}
