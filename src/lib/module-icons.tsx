import {
  IconCookie,
  IconStarFilled,
  IconArrowBackUp,
  IconBuildingStore,
  IconPuzzle,
} from '@tabler/icons-react'

const MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  cookies: IconCookie,
  google_reviews: IconStarFilled,
  retractation: IconArrowBackUp,
  click_collect: IconBuildingStore,
}

export function ModuleIcon({ id, size = 18, className }: {
  id: string
  size?: number
  className?: string
}) {
  const Icon = MAP[id] ?? IconPuzzle
  return <Icon size={size} className={className} />
}
