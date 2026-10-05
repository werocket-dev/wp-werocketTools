import { createContext, useContext, useEffect } from 'react'
import type { StatusTone } from '../components/StatusBadge'

export interface PageStatus {
  tone: StatusTone
  label: string
}

type Setter = (status: PageStatus | null) => void

export const PageStatusContext = createContext<Setter>(() => {})

/**
 * Remplace le badge d'état de l'en-tête de page (« Actif » par défaut) le
 * temps que la page est montée. Descripteur simple (ton + libellé) plutôt
 * qu'un élément React : comparable entre deux rendus, sans boucle.
 */
export function usePageStatus(status: PageStatus | null) {
  const set = useContext(PageStatusContext)
  const tone = status?.tone
  const label = status?.label
  useEffect(() => {
    set(tone && label ? { tone, label } : null)
    return () => set(null)
  }, [set, tone, label])
}
