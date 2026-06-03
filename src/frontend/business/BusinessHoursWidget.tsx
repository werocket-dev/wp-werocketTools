import { useEffect, useState } from 'react'
import { IconClock } from '@tabler/icons-react'
import type { BusinessSettings } from '@/lib/types'

const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
}

function getRestUrl(): string {
  return (window as unknown as Record<string, Record<string, string>>)['werocketFrontend']?.restUrl
    ?? '/wp-json/werocket/v1/'
}

export function BusinessHoursWidget() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({})

  useEffect(() => {
    fetch(`${getRestUrl()}business`)
      .then(r => r.json())
      .then(data => setSettings(data.settings ?? {}))
  }, [])

  const hours = settings.opening_hours
  if (!hours) return null

  return (
    <div className="text-sm">
      <p className="flex items-center gap-1.5 font-medium mb-2">
        <IconClock size={15} />Horaires
      </p>
      <ul className="space-y-1">
        {Object.entries(hours).map(([day, h]) => (
          <li key={day} className="flex justify-between gap-4">
            <span className="text-gray-600">{DAY_LABELS[day] ?? day}</span>
            <span className={h.closed ? 'text-gray-400' : 'font-medium'}>
              {h.closed ? 'Fermé' : `${h.open} – ${h.close}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
