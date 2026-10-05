interface Props {
  children?: React.ReactNode
}

/** Barre sombre pleine largeur : logo + version à gauche, navigation à droite. */
export function Header({ children }: Props) {
  const root = document.getElementById('werocket-admin-root')!
  const { pluginUrl, version } = root.dataset as { pluginUrl: string; version: string }

  return (
    <header className="relative overflow-hidden bg-inverse">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55"
        style={{ backgroundImage: `url(${pluginUrl}assets/images/banner.jpg)` }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3 px-8 py-[18px]">
        <div className="flex flex-1 items-center gap-2.5">
          <img src={`${pluginUrl}assets/images/logo.png`} alt="Werocket" className="h-6 w-auto" />
          <span className="rounded-[10px] bg-inverse-foreground/12 px-2 py-[3px] text-[11px] font-medium text-inverse-foreground/90">
            v {version}
          </span>
        </div>
        {children}
      </div>
    </header>
  )
}
