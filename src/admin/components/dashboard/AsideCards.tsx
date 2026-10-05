import { ArrowRight, ArrowUpRight, BookOpen, MessageCircle, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { LINKS } from '@/lib/modules'
import type { DashboardStatus } from '@/lib/types'
import { getBootstrap } from '@/lib/admin-bootstrap'
import { PanelTitle } from '../SettingsSection'
import { StatusBadge } from '../StatusBadge'

/** Version du plugin, environnement WordPress / WooCommerce, modules actifs. */
export function PluginInfoCard({ status }: { status: DashboardStatus | null }) {
  const rows: [string, string][] = [
    ['Version', status?.plugin.version ?? '—'],
    ['WordPress', status?.wordpress ?? '—'],
    ['WooCommerce', status ? (status.woocommerce ? 'Détecté' : 'Non détecté') : '—'],
    ['Modules actifs', status ? `${status.modules.active} sur ${status.modules.total}` : '—'],
  ]

  return (
    <Card variant="panel">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <PanelTitle className="flex-1">Werocket Tools</PanelTitle>
        {status && (status.plugin.update
          ? <StatusBadge tone="warning">v{status.plugin.update} disponible</StatusBadge>
          : <StatusBadge>À jour</StatusBadge>)}
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center border-t border-border px-4 py-2.5 text-[12.5px]">
            <dt className="flex-1 text-muted-foreground">{label}</dt>
            <dd className="m-0 font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

/** Teaser de la boutique de modules (surface sombre, comme le header). */
export function ShopCard() {
  const { pluginUrl } = getBootstrap()

  return (
    <div className="relative overflow-hidden rounded-[12px] bg-inverse">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${pluginUrl}assets/images/banner.jpg)` }}
        aria-hidden
      />
      <div className="relative flex flex-col items-start gap-2.5 p-[18px]">
        <span className="flex h-5 items-center rounded-[10px] bg-inverse-foreground/12 px-2 text-[11px] font-semibold text-inverse-foreground/90">
          Bientôt disponible
        </span>
        <div className="text-base font-semibold tracking-[-0.2px] text-inverse-foreground">La boutique Werocket arrive</div>
        <p className="m-0 text-[12.5px] leading-normal text-inverse-foreground/80">
          De nouveaux modules à activer en un clic, directement depuis ce tableau de bord.
        </p>
        <a
          href={LINKS.shopNotify}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 pt-1 text-[12.5px] font-semibold text-inverse-accent no-underline hover:underline"
        >
          Être prévenu
          <ArrowRight className="size-[13px]" />
        </a>
      </div>
    </div>
  )
}

/** Liens d'aide : documentation, support, notes de version. */
export function HelpCard({ version }: { version: string }) {
  const links = [
    { label: 'Documentation', href: LINKS.documentation, icon: BookOpen },
    { label: 'Contacter le support', href: LINKS.support, icon: MessageCircle },
    { label: `Nouveautés de la version ${version}`, href: LINKS.releaseNotes(version), icon: Sparkles },
  ]

  return (
    <Card variant="panel">
      <PanelTitle className="px-4 pt-4 pb-3">Besoin d'aide ?</PanelTitle>
      {links.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 border-t border-border px-4 py-[11px] text-[13px] font-medium text-foreground no-underline transition-colors hover:bg-muted"
        >
          <Icon className="size-[15px] text-muted-foreground" />
          <span className="flex-1">{label}</span>
          <ArrowUpRight className="size-3.5 text-subtle-foreground" />
        </a>
      ))}
    </Card>
  )
}
