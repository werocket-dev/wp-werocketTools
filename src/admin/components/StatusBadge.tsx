import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'warning' | 'neutral'

const TONES: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: 'bg-primary-muted text-primary-strong', dot: 'bg-primary' },
  warning: { badge: 'bg-warning-muted text-warning', dot: 'bg-warning' },
  neutral: { badge: 'bg-muted text-muted-foreground ring-1 ring-border', dot: 'bg-subtle-foreground' },
}

/** Pastille d'état (point + libellé) : « Actif », « 3 points à vérifier »… */
export function StatusBadge({ tone = 'success', children, className }: {
  tone?: StatusTone
  children: React.ReactNode
  className?: string
}) {
  const t = TONES[tone]
  return (
    <Badge className={cn('h-[22px] gap-1.5 rounded-full px-2 text-xs font-semibold', t.badge, className)}>
      <span className={cn('size-1.5 rounded-full', t.dot)} aria-hidden />
      {children}
    </Badge>
  )
}
