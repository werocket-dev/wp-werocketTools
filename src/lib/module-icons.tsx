import { Building2, Cookie, Puzzle, Star, Store, Undo2, type LucideIcon } from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  cookies: Cookie,
  google_reviews: Star,
  retractation: Undo2,
  click_collect: Store,
  company_info: Building2,
}

export function ModuleIcon({ id, size = 18, className }: {
  id: string
  size?: number
  className?: string
}) {
  const Icon = MAP[id] ?? Puzzle
  return <Icon size={size} className={className} />
}
