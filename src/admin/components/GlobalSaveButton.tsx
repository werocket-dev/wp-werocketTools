import { useEffect, useRef, useState } from 'react'
import { Check, CircleDot, CloudCheck, ExternalLink, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSaveContext } from '../context/SaveContext'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './styles'
import { cn } from '@/lib/utils'

function relativeTime(date: Date, now: number): string {
  const minutes = Math.floor((now - date.getTime()) / 60_000)
  if (minutes < 1) return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes} min`
  return `il y a ${Math.floor(minutes / 60)} h`
}

/** Actions de l'en-tête des pages de réglages : état d'enregistrement, voir le site, enregistrer. */
export function GlobalSaveButton() {
  const { formId, saving, isDirty } = useSaveContext()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const prevSaving = useRef(false)
  const { homeUrl } = document.getElementById('werocket-admin-root')!.dataset as { homeUrl: string }

  // Réinitialiser la date quand on change de page de réglages
  useEffect(() => {
    setLastSaved(null)
  }, [formId])

  // Enregistrer l'heure dès que saving passe de true → false
  useEffect(() => {
    if (prevSaving.current && !saving) {
      setLastSaved(new Date())
      setNow(Date.now())
    }
    prevSaving.current = saving
  }, [saving])

  // Rafraîchit « il y a N min »
  useEffect(() => {
    if (!lastSaved) return
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [lastSaved])

  if (!formId) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isDirty && !saving ? (
        <span className="flex items-center gap-1.5 px-2 text-xs font-medium text-warning">
          <CircleDot className="size-3.5 animate-pulse" />
          Modifications non enregistrées
        </span>
      ) : lastSaved && (
        <span className="flex items-center gap-1.5 px-2 text-xs text-subtle-foreground">
          <CloudCheck className="size-[15px]" />
          Enregistré {relativeTime(lastSaved, now)}
        </span>
      )}
      {homeUrl && (
        <Button variant="outline" className={SECONDARY_BUTTON} asChild>
          <a href={homeUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            Voir sur le site
          </a>
        </Button>
      )}
      <Button
        type="submit"
        form={formId}
        disabled={saving}
        className={cn(PRIMARY_BUTTON, isDirty && !saving && 'ring-2 ring-warning/30 ring-offset-2 ring-offset-background')}
      >
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </div>
  )
}
