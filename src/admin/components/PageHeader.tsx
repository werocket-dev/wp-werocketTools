interface Props {
  icon: React.ReactNode
  title: React.ReactNode
  /** Pastille affichée à droite du titre */
  badge?: React.ReactNode
  description?: React.ReactNode
  /** Zone d'actions alignée à droite (bouton Documentation, Enregistrer…) */
  actions?: React.ReactNode
}

/** En-tête de page sous la barre de navigation : icône, titre, sous-titre, actions. */
export function PageHeader({ icon, title, badge, description, actions }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border px-8 pt-7 pb-6">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <div role="heading" aria-level={1} className="text-[22px] font-semibold tracking-[-0.3px] text-foreground">
            {title}
          </div>
          {badge}
        </div>
        {description && <div className="mt-1 text-[13px] text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}
