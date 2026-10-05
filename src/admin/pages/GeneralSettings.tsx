import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { GeneralSettings as TGeneralSettings } from '@/lib/types'
import { Spinner } from '../components/Spinner'
import { useRegisterSaveForm } from '../context/SaveContext'
import { SubNav, type GeneralSection } from '../components/general/SubNav'
import { LoginUrlAside, LoginUrlSection, loginUrl, type SlugStatus } from '../components/general/LoginUrlSection'
import { AdminMenuAside, AdminMenuSection } from '../components/general/AdminMenuSection'
import { buildEditorItems, readSnapshot, serializeEditorItems, type EditorItem } from '../components/general/menu-model'

const FORM_ID = 'wr-form-general'

function initialSection(): GeneralSection {
  return new URLSearchParams(window.location.search).get('section') === 'menu' ? 'menu' : 'login'
}

export function GeneralSettings() {
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<TGeneralSettings | null>(null)
  const [section, setSection] = useState<GeneralSection>(initialSection)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ state: 'idle' })
  const [menuItems, setMenuItems] = useState<EditorItem[]>([])
  const snapshot = useMemo(readSnapshot, [])

  const form = useForm<TGeneralSettings>()
  const { handleSubmit, reset, watch, setValue, formState } = form
  const { setSaving } = useRegisterSaveForm(FORM_ID, formState.isDirty)
  const slug = watch('login_slug') ?? ''

  function load(settings: TGeneralSettings) {
    reset(settings)
    setSaved(settings)
    setMenuItems(buildEditorItems(snapshot, settings.menu_items))
  }

  useEffect(() => {
    api.get<{ settings: TGeneralSettings }>('/settings/general')
      .then(data => load(data.settings))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Disponibilité de l'adresse, vérifiée côté serveur après une courte pause de saisie.
  useEffect(() => {
    if (loading) return
    if (!slug) {
      setSlugStatus({ state: 'idle' })
      return
    }
    setSlugStatus({ state: 'checking' })
    const timer = window.setTimeout(() => {
      api.get<{ available: boolean; reason: string }>(`/general/login-slug?slug=${encodeURIComponent(slug)}`)
        .then(r => setSlugStatus(r.available ? { state: 'available' } : { state: 'unavailable', reason: r.reason }))
        .catch(() => setSlugStatus({ state: 'idle' }))
    }, 400)
    return () => window.clearTimeout(timer)
  }, [slug, loading])

  function changeMenu(items: EditorItem[]) {
    setMenuItems(items)
    setValue('menu_items', serializeEditorItems(items), { shouldDirty: true })
  }

  function resetMenu() {
    setMenuItems(buildEditorItems(snapshot, []))
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
    const previous = saved
    setSaving(true)
    try {
      await api.put('/settings/general', { settings: data })
      const addressChanged = data.login_enabled
        && (!previous?.login_enabled || previous.login_slug !== data.login_slug)

      if (addressChanged && !data.login_keep_session) {
        // Session fermée côté serveur : on repart de la nouvelle adresse.
        toast.success('Adresse enregistrée. Reconnectez-vous avec la nouvelle adresse…')
        const target = loginUrl(data.login_slug)
        const separator = target.includes('?') ? '&' : '?'
        window.setTimeout(() => {
          window.location.href = `${target}${separator}redirect_to=${encodeURIComponent(window.location.href)}`
        }, 1500)
        return
      }

      const fresh = await api.get<{ settings: TGeneralSettings }>('/settings/general')
      load(fresh.settings)
      toast.success(addressChanged ? 'Nouvelle adresse de connexion active' : 'Réglages enregistrés')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !saved) return <Spinner />

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
