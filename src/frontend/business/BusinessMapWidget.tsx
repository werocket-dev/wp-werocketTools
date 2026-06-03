import { useEffect, useState } from 'react'
import type { BusinessSettings } from '@/lib/types'

function getRestUrl(): string {
  return (window as unknown as Record<string, Record<string, string>>)['werocketFrontend']?.restUrl
    ?? '/wp-json/werocket/v1/'
}

export function BusinessMapWidget() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({})

  useEffect(() => {
    fetch(`${getRestUrl()}business`)
      .then(r => r.json())
      .then(data => setSettings(data.settings ?? {}))
  }, [])

  const { coordinates, address, business_name, google_maps_api_key } = settings

  if (!coordinates?.lat) return null

  const lat = coordinates.lat
  const lng = coordinates.lng

  const src = google_maps_api_key
    ? `https://www.google.com/maps/embed/v1/place?key=${google_maps_api_key}&q=${lat},${lng}&zoom=15`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.01},${parseFloat(lat) - 0.01},${parseFloat(lng) + 0.01},${parseFloat(lat) + 0.01}&layer=mapnik&marker=${lat},${lng}`

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
      <iframe
        title={business_name ?? address?.city ?? 'Carte'}
        src={src}
        className="w-full h-64"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
