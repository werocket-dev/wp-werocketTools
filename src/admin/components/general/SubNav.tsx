import { ArrowUpRight, KeyRound, PanelLeft } from 'lucide-react'
import { LINKS } from '@/lib/modules'
import { SectionNav, type SectionNavGroup } from '../SectionNav'

export type GeneralSection = 'login' | 'menu'

interface Props {
  current: GeneralSection
  onChange: (section: GeneralSection) => void
  /** L'URL de connexion personnalisée est active */
  loginActive: boolean
}

/** Navigation secondaire du module Général. */
export function SubNav({ current, onChange, loginActive }: Props) {
  const groups: SectionNavGroup<GeneralSection>[] = [
    {
      label: 'Sécurité',
      items: [{
        id: 'login',
        label: 'URL de connexion',
        icon: KeyRound,
        meta: loginActive && <span className="text-xs font-medium text-primary">Active</span>,
      }],
    },
    { label: 'Administration', items: [{ id: 'menu', label: 'Menu d\'administration', icon: PanelLeft }] },
  ]

  return (
    <SectionNav
      groups={groups}
      current={current}
      onChange={onChange}
      footer={
        <>
          <div className="text-xs font-medium text-muted-foreground">D'autres réglages arrivent bientôt dans ce module.</div>
          <a
            href={LINKS.support}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary no-underline hover:underline"
          >
            Suggérer une fonctionnalité
            <ArrowUpRight className="size-[13px]" />
          </a>
        </>
      }
    />
  )
}
