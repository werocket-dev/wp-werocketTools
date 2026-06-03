import { IconRocket } from '@tabler/icons-react'

export function Header() {
  const root = document.getElementById('werocket-admin-root')!
  const { pluginUrl, version } = root.dataset as { pluginUrl: string; version: string }

  return (
    <div
      className="bg-cover bg-center px-12 py-10 mb-6"
      style={{ backgroundImage: `url(${pluginUrl}assets/images/banner.jpg)` }}
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <img src={`${pluginUrl}assets/images/logo.png`} alt="WeRocket Tools" className="h-14" />
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
          <IconRocket size={18} className="text-white" />
          <span className="text-white text-sm font-medium">v{version}</span>
        </div>
      </div>
    </div>
  )
}
