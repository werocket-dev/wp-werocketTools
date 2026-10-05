import { useEffect, useReducer, useRef, useState } from 'react'
import { Check, CircleDot, CloudCheck, ExternalLink, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBootstrap } from '@/lib/admin-bootstrap'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSaveContext } from '../context/SaveContext'

/** Actions de l'en-tête des pages de réglages : état d'enregistrement, voir le site, enregistrer. */
export function GlobalSaveButton() {
  const { formId, saving, isDirty } = useSaveContext()
  const [lastSaved, setLastSaved] = useState<number | null>(null)
  const [, tick] = useReducer((n: number) => n + 1, 0)
  const prevSaving = useRef(false)

  // Réinitialiser la date quand on change de page de réglages
  useEffect(() => {
    setLastSaved(null)
  }, [formId])

  // Enregistrer l'heure dès que saving passe de true → false
  useEffect(() => {
    if (prevSaving.current && !saving) setLastSaved(Math.floor(Date.now() / 1000))
    prevSaving.current = saving
  }, [saving])

  // Rafraîchit « il y a N min »
  useEffect(() => {
    if (lastSaved === null) return
    const timer = window.setInterval(tick, 30_000)
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
      ) : lastSaved !== null && (
        <span className="flex items-center gap-1.5 px-2 text-xs text-subtle-foreground">
          <CloudCheck className="size-[15px]" />
          Enregistré {formatRelative(lastSaved)}
        </span>
      )}
      <Button variant="surface" size="panel" asChild>
        <a href={getBootstrap().homeUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="size-4" />
          Voir sur le site
        </a>
      </Button>
      <Button
        type="submit"
        form={formId}
        size="panel"
        disabled={saving}
        className={cn('font-semibold', isDirty && !saving && 'ring-2 ring-warning/30 ring-offset-2 ring-offset-background')}
      >
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </div>
  )
}
