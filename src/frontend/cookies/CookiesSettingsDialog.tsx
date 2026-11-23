import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { IconShieldCheck } from '@tabler/icons-react'
import { type CookiesSettings } from '@/lib/types'
import { getKlaroManager, type KlaroManager } from './klaro-client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: CookiesSettings
  onConsentSaved: () => void
}

export function CookiesSettingsDialog({ open, onOpenChange, config, onConsentSaved }: Props) {
  const [manager, setManager] = useState<KlaroManager | null>(null)
  const [consents, setConsents] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getKlaroManager().then(m => {
      if (!m) return
      setManager(m)
      const initial: Record<string, boolean> = {}
      config.services.filter(s => s.enabled).forEach(s => {
        initial[s.name] = m.consents[s.name] ?? s.default
      })
      setConsents(initial)
    })
  }, [config.services])

  function setConsent(name: string, value: boolean) {
    setConsents(prev => ({ ...prev, [name]: value }))
  }

  function save(next: Record<string, boolean>) {
    if (!manager) {
      onOpenChange(false)
      return
    }
    config.services.filter(s => s.enabled).forEach(s => {
      manager.updateConsent(s.name, s.required || (next[s.name] ?? s.default))
    })
    manager.saveAndApplyConsents()
    onConsentSaved()
    onOpenChange(false)
  }

  // « Tout accepter » / « Tout refuser » enregistrent immédiatement (comme dans
  // le bandeau) : sinon le visiteur ferme la fenêtre sans que rien ne soit sauvé.
  function acceptAll() {
    const all: Record<string, boolean> = {}
    config.services.filter(s => s.enabled).forEach(s => { all[s.name] = true })
    setConsents(all)
    save(all)
  }

  function declineAll() {
    const none: Record<string, boolean> = {}
    config.services.filter(s => s.enabled).forEach(s => {
      none[s.name] = s.required
    })
    setConsents(none)
    save(none)
  }

  function saveSelected() {
    save(consents)
  }

  const purposes = Object.entries(config.purposes)
  const enabledServices = config.services.filter(s => s.enabled)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconShieldCheck className="size-5 text-primary" />
            {config.texts.purposes_title ?? 'Préférences de confidentialité'}
          </DialogTitle>
          <DialogDescription>
            Activez ou désactivez les services par finalité. Vos choix sont enregistrés sur cet appareil.
          </DialogDescription>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={['necessary']}>
          {purposes.map(([key, purpose]) => {
            const purposeServices = enabledServices.filter(s => s.purposes.includes(key))
            if (purposeServices.length === 0 && key !== 'necessary') return null
            const activeCount = purposeServices.filter(s => consents[s.name] ?? s.default).length

            return (
              <AccordionItem value={key} key={key}>
                <AccordionTrigger>
                  <div className="flex flex-col items-start text-left gap-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{purpose.title}</span>
                      <Badge variant="secondary" className="font-normal">
                        {activeCount}/{purposeServices.length}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-normal">{purpose.description}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {purposeServices.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Aucun service configuré.</p>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {purposeServices.map(svc => (
                        <div key={svc.name} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`werocket-svc-${svc.name}`} className="text-sm font-medium cursor-pointer">
                                {svc.title}
                              </Label>
                              {svc.required && (
                                <Badge variant="outline" className="font-normal">Requis</Badge>
                              )}
                            </div>
                            {svc.description && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{svc.description}</p>
                            )}
                            {svc.cookies.length > 0 && (
                              <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono">
                                {svc.cookies.join(', ')}
                              </p>
                            )}
                          </div>
                          <Switch
                            id={`werocket-svc-${svc.name}`}
                            checked={consents[svc.name] ?? svc.default}
                            disabled={svc.required}
                            onCheckedChange={v => setConsent(svc.name, v)}
                            className="shrink-0 mt-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        <DialogFooter>
          <Button variant="ghost" onClick={declineAll}>
            {config.texts.decline_all ?? 'Tout refuser'}
          </Button>
          <Button variant="outline" onClick={acceptAll}>
            {config.texts.accept_all ?? 'Tout accepter'}
          </Button>
          <Button onClick={saveSelected}>
            {config.texts.save ?? 'Enregistrer mes choix'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
