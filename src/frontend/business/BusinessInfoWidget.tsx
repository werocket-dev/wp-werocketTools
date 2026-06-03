import { useEffect, useState } from 'react'
import { IconPhone, IconMail, IconWorldWww, IconMapPin } from '@tabler/icons-react'
import type { BusinessSettings } from '@/lib/types'

function getRestUrl(): string {
  return (window as unknown as Record<string, Record<string, string>>)['werocketFrontend']?.restUrl
    ?? '/wp-json/werocket/v1/'
}

export function BusinessInfoWidget() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({})

  useEffect(() => {
    fetch(`${getRestUrl()}business`)
      .then(r => r.json())
      .then(data => setSettings(data.settings ?? {}))
  }, [])

  if (!settings.business_name) return null

  return (
    <div className="flex flex-col gap-2 text-sm">
      {settings.business_name && <p className="font-semibold text-base">{settings.business_name}</p>}
      {settings.phone && (
        <a href={`tel:${settings.phone}`} className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
          <IconPhone size={16} />{settings.phone}
        </a>
      )}
      {settings.email && (
        <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
          <IconMail size={16} />{settings.email}
        </a>
      )}
      {settings.website && (
        <a href={settings.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
          <IconWorldWww size={16} />{settings.website}
        </a>
      )}
      {settings.address?.street && (
        <p className="flex items-start gap-2 text-gray-700">
          <IconMapPin size={16} className="mt-0.5 shrink-0" />
          <span>{settings.address.street}, {settings.address.postal_code} {settings.address.city}</span>
        </p>
      )}
    </div>
  )
}
