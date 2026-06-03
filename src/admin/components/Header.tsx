import { IconBolt } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'

interface Props {
  children?: React.ReactNode
}

export function Header({ children }: Props) {
  const root = document.getElementById('werocket-admin-root')!
  const { pluginUrl, version } = root.dataset as { pluginUrl: string; version: string }

  return (
    <div
      className="relative overflow-hidden bg-cover bg-center px-12 pt-20 pb-10 rounded-4xl mb-6 mt-4 mr-4 ring-1 ring-foreground/5"
      style={{ backgroundImage: `url(${pluginUrl}assets/images/banner.jpg)` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" aria-hidden />
      <div className="relative flex items-center justify-between">
        <img src={`${pluginUrl}assets/images/logo.png`} alt="WeRocket Tools" className="h-12" />
        <Badge variant="secondary" className="h-9 gap-1.5 px-3.5 text-sm backdrop-blur bg-background/80">
          <IconBolt size={15} className="text-primary" />
          <span className="font-medium">v {version}</span>
        </Badge>
      </div>
      {children && (
        <div className="relative mt-16">
          {children}
        </div>
      )}
    </div>
  )
}
