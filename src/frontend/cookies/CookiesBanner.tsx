import { useEffect, useState } from 'react'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IconCookie, IconSettings, IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { type CookiesSettings } from '@/lib/types'
import { getKlaroManager, hasConsented } from './klaro-client'

interface Props {
  config: CookiesSettings
  onOpenSettings: () => void
  onDismiss: () => void
}

const POSITION_CLASSES: Record<string, string> = {
  'bottom-left':  'fixed bottom-4 left-4 right-4 sm:right-auto max-w-md',
  'bottom-right': 'fixed bottom-4 right-4 left-4 sm:left-auto max-w-md',
  'top-left':     'fixed top-4 left-4 right-4 sm:right-auto max-w-md',
  'top-right':    'fixed top-4 right-4 left-4 sm:left-auto max-w-md',
  'center':       'fixed inset-x-4 bottom-4 max-w-3xl mx-auto',
}

const ANIMATION_CLASSES: Record<string, string> = {
  'bottom-left':  'animate-in fade-in slide-in-from-bottom-4 duration-500',
  'bottom-right': 'animate-in fade-in slide-in-from-bottom-4 duration-500',
  'top-left':     'animate-in fade-in slide-in-from-top-4 duration-500',
  'top-right':    'animate-in fade-in slide-in-from-top-4 duration-500',
  'center':       'animate-in fade-in slide-in-from-bottom-4 duration-500',
}

export function CookiesBanner({ config, onOpenSettings, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hasConsented(config.cookie_name)) return
    getKlaroManager().then(manager => {
      if (manager?.confirmed) return
      setTimeout(() => setVisible(true), 400)
    })
  }, [config.cookie_name])

  async function acceptAll() {
    const manager = await getKlaroManager()
    manager?.saveAndApplyConsents(true)
    setVisible(false)
    onDismiss()
  }

  async function declineAll() {
    const manager = await getKlaroManager()
    manager?.saveAndApplyConsents(false)
    setVisible(false)
    onDismiss()
  }

  if (!visible) return null

  const title = config.texts.notice_title || 'Gestion des cookies'
  const description = config.texts.notice_description || ''
  const acceptText = config.texts.accept_all || 'Tout accepter'
  const declineText = config.texts.decline_all || 'Tout refuser'
  const settingsText = config.texts.settings || 'Paramètres'
  const privacyText = config.texts.privacy_policy || 'Politique de confidentialité'
  const privacyUrl = config.texts.privacy_policy_url

  const renderDescription = () =>
    config.html_texts
      ? <span dangerouslySetInnerHTML={{ __html: description }} />
      : description

  const buttons = (
    <div className={cn(
      'flex items-center gap-2 flex-wrap',
      config.flip_buttons && 'flex-row-reverse'
    )}>
      {!config.hide_learn_more && (
        <Button variant="outline" onClick={onOpenSettings}>
          <IconSettings />
          {settingsText}
        </Button>
      )}
      {!config.hide_decline_all && (
        <Button variant="ghost" onClick={declineAll}>
          <IconX />
          {declineText}
        </Button>
      )}
      <Button onClick={acceptAll}>
        {acceptText}
      </Button>
    </div>
  )

  if (config.notice_as_modal) {
    return (
      <Dialog open onOpenChange={open => !open && onDismiss()}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCookie className="size-5 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              {renderDescription()}
              {privacyUrl && (
                <a
                  href={privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline underline-offset-2 text-primary"
                >
                  {privacyText}
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {buttons}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card
      role="dialog"
      aria-labelledby="werocket-cookies-title"
      aria-describedby="werocket-cookies-description"
      className={cn(
        'z-[9999]',
        POSITION_CLASSES[config.position] ?? POSITION_CLASSES['bottom-right'],
        ANIMATION_CLASSES[config.position] ?? ANIMATION_CLASSES['bottom-right']
      )}
    >
      <CardHeader>
        <CardTitle id="werocket-cookies-title" className="flex items-center gap-2">
          <IconCookie className="size-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription id="werocket-cookies-description" className="leading-relaxed">
          {renderDescription()}
          {privacyUrl && (
            <>
              {' '}
              <a
                href={privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-primary hover:opacity-80"
              >
                {privacyText}
              </a>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        {buttons}
      </CardFooter>
    </Card>
  )
}
