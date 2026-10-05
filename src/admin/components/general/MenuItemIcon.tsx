import {
  Brush, ChartColumn, File, Image, LayoutDashboard, Megaphone, MessageSquare, Package,
  Pin, Plug, Puzzle, Rocket, Settings, ShoppingCart, Users, Wrench, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Menus du cœur WordPress / WooCommerce : icônes de la maquette. */
const CORE_ICONS: Record<string, LucideIcon> = {
  'index.php': LayoutDashboard,
  'edit.php': Pin,
  'upload.php': Image,
  'edit.php?post_type=page': File,
  'edit-comments.php': MessageSquare,
  'themes.php': Brush,
  'plugins.php': Plug,
  'users.php': Users,
  'profile.php': Users,
  'tools.php': Wrench,
  'options-general.php': Settings,
  'woocommerce': ShoppingCart,
  'edit.php?post_type=product': Package,
  'wc-admin&path=/analytics/overview': ChartColumn,
  'woocommerce-marketing': Megaphone,
  'werocket-tools': Rocket,
}

interface Props {
  slug: string
  /** Icône déclarée par l'extension : classe dashicons, data URI SVG ou URL */
  icon: string
  /** Rendu sur fond sombre (aperçu du menu) */
  inverse?: boolean
  className?: string
}

/** Icône d'un menu : version maquette pour le cœur, icône réelle de l'extension sinon. */
export function MenuItemIcon({ slug, icon, inverse, className }: Props) {
  const Core = CORE_ICONS[slug]
  if (Core) return <Core className={cn('size-[15px]', className)} />

  if (icon.startsWith('dashicons-')) {
    return <span className={cn('dashicons size-[15px] text-[15px]', icon, className)} aria-hidden />
  }
  if (icon.startsWith('data:image') || icon.startsWith('http')) {
    return (
      <img
        src={icon}
        alt=""
        className={cn('size-[15px] brightness-0', inverse ? 'invert opacity-70' : 'opacity-60', className)}
      />
    )
  }
  return <Puzzle className={cn('size-[15px]', className)} />
}
