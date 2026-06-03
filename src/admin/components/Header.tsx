import { IconBolt } from '@tabler/icons-react'

export function Header() {
  const root = document.getElementById('werocket-admin-root')!
  const { pluginUrl, version } = root.dataset as { pluginUrl: string; version: string }

  return (
    <div
      className="bg-cover bg-center px-20 py-8 rounded-lg mb-6 mt-4 mr-4"
      style={{ backgroundImage: `url(${pluginUrl}assets/images/banner.jpg)` }}
    >
      <div className="flex items-center justify-between">
        <img src={`${pluginUrl}assets/images/logo.png`} alt="WeRocket Tools" className="h-16" />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <IconBolt size={20} className="text-teal-600" />
          </div>
          <span className="text-xl text-white">v {version}</span>
        </div>
      </div>
    </div>
  )
}
