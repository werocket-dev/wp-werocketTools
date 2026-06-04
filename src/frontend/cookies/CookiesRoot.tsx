import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { type CookiesSettings } from '@/lib/types'
import { CookiesBanner } from './CookiesBanner'
import { CookiesSettingsDialog } from './CookiesSettingsDialog'
import { hasConsented } from './klaro-client'
import { cn } from '@/lib/utils'

interface Props {
  config: CookiesSettings
}

export function CookiesRoot({ config }: Props) {
  const [bannerVisible, setBannerVisible] = useState(!hasConsented(config.cookie_name))
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setDialogOpen(true)
    const onBanner = () => setBannerVisible(true)
    document.addEventListener('werocket:open-settings', onOpen)
    document.addEventListener('werocket:show-banner', onBanner)
    return () => {
      document.removeEventListener('werocket:open-settings', onOpen)
      document.removeEventListener('werocket:show-banner', onBanner)
    }
  }, [])

  const themeStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (config.theme !== 'custom') return undefined
    return {
      ['--primary' as never]: config.color_primary,
      ['--primary-foreground' as never]: '#ffffff',
      ['--background' as never]: config.color_background,
      ['--card' as never]: config.color_background,
      ['--popover' as never]: config.color_background,
      ['--foreground' as never]: config.color_text,
      ['--card-foreground' as never]: config.color_text,
      ['--popover-foreground' as never]: config.color_text,
      ['--muted-foreground' as never]: config.color_text_secondary,
      ['--border' as never]: config.color_border,
      ['--input' as never]: config.color_border,
      ['--ring' as never]: config.color_primary,
    }
  }, [config])

  return createPortal(
    <div
      className={cn(
        'werocket-cookies-scope font-sans',
        config.theme === 'dark' && 'dark',
        config.additional_class
      )}
      style={themeStyle}
    >
      {bannerVisible && (
        <CookiesBanner
          config={config}
          onOpenSettings={() => {
            setBannerVisible(false)
            setDialogOpen(true)
          }}
          onDismiss={() => setBannerVisible(false)}
        />
      )}
      <CookiesSettingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={config}
        onConsentSaved={() => setBannerVisible(false)}
      />
    </div>,
    document.body
  )
}
