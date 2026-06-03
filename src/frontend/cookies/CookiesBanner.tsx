import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconCookie, IconSettings, IconX } from '@tabler/icons-react'

declare global {
  interface Window {
    klaro?: {
      getManager(): { saveAndApplyConsents(accept: boolean): void; show(): void }
      show(): void
    }
  }
}

interface KlaroConfig {
  notice_text?: string
  accept_all_text?: string
  decline_text?: string
  settings_text?: string
  position?: string
  theme?: string
  primary_color?: string
}

interface Props {
  config: KlaroConfig
}

export function CookiesBanner({ config }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Afficher la bannière seulement si pas de consentement déjà enregistré
    const hasConsented = document.cookie.includes('klaro=')
    if (!hasConsented) {
      setTimeout(() => setVisible(true), 400)
    }
  }, [])

  function accept() {
    window.klaro?.getManager().saveAndApplyConsents(true)
    setVisible(false)
  }

  function decline() {
    window.klaro?.getManager().saveAndApplyConsents(false)
    setVisible(false)
  }

  function openSettings() {
    window.klaro?.show()
  }

  if (!visible) return null

  const posClass = config.position === 'top' ? 'top-0 left-0 right-0' : 'bottom-0 left-0 right-0'

  return (
    <div
      className={`fixed ${posClass} z-[9999] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg`}
      style={{
        backgroundColor: config.theme === 'dark' ? '#1a1a2e' : '#ffffff',
        color: config.theme === 'dark' ? '#e2e8f0' : '#1e293b',
        borderTop: config.position !== 'top' ? `2px solid ${config.primary_color ?? '#10b981'}` : undefined,
        borderBottom: config.position === 'top' ? `2px solid ${config.primary_color ?? '#10b981'}` : undefined,
      }}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <IconCookie size={20} className="shrink-0 mt-0.5" style={{ color: config.primary_color ?? '#10b981' }} />
        <p className="text-sm leading-relaxed">
          {config.notice_text ?? 'Nous utilisons des cookies pour améliorer votre expérience.'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={openSettings}
          className="gap-1.5 text-xs h-8"
          style={{ borderColor: config.primary_color ?? '#10b981' }}
        >
          <IconSettings size={13} />
          {config.settings_text ?? 'Paramètres'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={decline}
          className="gap-1.5 text-xs h-8"
        >
          <IconX size={13} />
          {config.decline_text ?? 'Refuser'}
        </Button>
        <Button
          size="sm"
          onClick={accept}
          className="text-xs h-8 text-white"
          style={{ backgroundColor: config.primary_color ?? '#10b981' }}
        >
          {config.accept_all_text ?? 'Tout accepter'}
        </Button>
      </div>
    </div>
  )
}
