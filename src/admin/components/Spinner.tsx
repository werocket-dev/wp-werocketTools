import { IconLoader2 } from '@tabler/icons-react'

/**
 * État de chargement plein bloc, partagé par tous les écrans de réglages.
 * Chaque page en avait sa propre copie — les variantes (py-16/py-20, avec ou
 * sans <span>) n'étaient pas intentionnelles.
 */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
      <IconLoader2 size={20} className="animate-spin" /> Chargement...
    </div>
  )
}
