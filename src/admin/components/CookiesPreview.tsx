import type { UseFormWatch } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconEye } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { CookiesSettings } from '@/lib/types'

type FormValues = Omit<CookiesSettings, 'services'>

const POSITION_CLASSES: Record<string, string> = {
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
  'top-left': 'top-7 left-3',
  'top-right': 'top-7 right-3',
  'center': 'left-3 right-3 bottom-3',
}

const POSITION_LABEL: Record<string, string> = {
  'bottom-left': 'Bas gauche',
  'bottom-right': 'Bas droite',
  'top-left': 'Haut gauche',
  'top-right': 'Haut droite',
  'center': 'Pleine largeur',
}

// Couleurs principales par défaut (thèmes Clair/Sombre). Les couleurs custom
// ne s'appliquent qu'au thème "Personnalisé" — cf. CookiesRoot.tsx :
// config.theme !== 'custom' => aucune variable injectée, le front retombe sur
// le token --primary du thème (globals.css : oklch(0.511 0.096 186.391) clair /
// oklch(0.437 0.078 188.216) sombre).
const DEFAULT_PRIMARY_LIGHT = '#0F766E'
const DEFAULT_PRIMARY_DARK = '#107568'

const FALLBACK = {
  title: 'Gestion des cookies',
  description: 'Nous utilisons des cookies pour améliorer votre expérience, mesurer l\'audience et personnaliser le contenu.',
  accept: 'Tout accepter',
  decline: 'Tout refuser',
  settings: 'Personnaliser',
  privacy: 'Politique de confidentialité',
}

export function CookiesPreview({ watch }: { watch: UseFormWatch<FormValues> }) {
  const theme = watch('theme') || 'light'
  const position = (watch('position') as keyof typeof POSITION_CLASSES) || 'bottom-right'
  const noticeAsModal = !!watch('notice_as_modal')
  const flipButtons = !!watch('flip_buttons')
  const hideDecline = !!watch('hide_decline_all')
  const hideLearnMore = !!watch('hide_learn_more')

  const customColors = {
    primary: watch('color_primary') || '#0F766E',
    bg: watch('color_background') || '#FFFFFF',
    text: watch('color_text') || '#0F172A',
    textSecondary: watch('color_text_secondary') || '#64748B',
    border: watch('color_border') || '#E2E8F0',
  }

  const palette = theme === 'dark'
    ? { bg: '#0F172A', text: '#F1F5F9', textSecondary: '#94A3B8', border: 'rgba(255,255,255,0.08)', primary: DEFAULT_PRIMARY_DARK }
    : theme === 'custom'
      ? { bg: customColors.bg, text: customColors.text, textSecondary: customColors.textSecondary, border: customColors.border, primary: customColors.primary }
      : { bg: '#FFFFFF', text: '#0F172A', textSecondary: '#64748B', border: '#E2E8F0', primary: DEFAULT_PRIMARY_LIGHT }

  const title = (watch('texts.notice_title' as keyof FormValues) as string) || FALLBACK.title
  const description = (watch('texts.notice_description' as keyof FormValues) as string) || FALLBACK.description
  const acceptText = (watch('texts.accept_all' as keyof FormValues) as string) || FALLBACK.accept
  const declineText = (watch('texts.decline_all' as keyof FormValues) as string) || FALLBACK.decline
  const settingsText = (watch('texts.settings' as keyof FormValues) as string) || FALLBACK.settings
  const privacyText = (watch('texts.privacy_policy' as keyof FormValues) as string) || FALLBACK.privacy
  const privacyUrl = (watch('texts.privacy_policy_url' as keyof FormValues) as string) || ''

  const truncatedDesc = description.length > 140 ? description.slice(0, 140) + '…' : description

  const buttons: { key: string; text: string; primary: boolean }[] = [
    { key: 'accept', text: acceptText, primary: true },
  ]
  if (!hideDecline) buttons.push({ key: 'decline', text: declineText, primary: false })
  if (!hideLearnMore) buttons.push({ key: 'settings', text: settingsText, primary: false })
  if (flipButtons) buttons.reverse()

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconEye className="size-4 text-primary" />
          Aperçu
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="font-normal">{theme === 'dark' ? 'Sombre' : theme === 'custom' ? 'Personnalisé' : 'Clair'}</Badge>
          <Badge variant="outline" className="font-normal">{noticeAsModal ? 'Modale' : POSITION_LABEL[position]}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden ring-1 ring-foreground/10 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50">
          {/* Faux browser chrome */}
          <div className="absolute top-0 inset-x-0 h-6 bg-white/70 backdrop-blur flex items-center gap-1.5 px-3 border-b border-slate-200/60 z-10">
            <span className="w-2 h-2 rounded-full bg-red-400/80" />
            <span className="w-2 h-2 rounded-full bg-amber-400/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
            <div className="flex-1 mx-2 h-2.5 rounded-full bg-slate-200/70" />
          </div>

          {/* Faux page content */}
          <div className="absolute inset-0 top-6 p-3 space-y-2 opacity-50">
            <div className="h-2 w-3/5 rounded-full bg-slate-300/60" />
            <div className="h-2 w-4/5 rounded-full bg-slate-300/50" />
            <div className="h-2 w-2/5 rounded-full bg-slate-300/40" />
            <div className="mt-3 h-12 rounded-xl bg-slate-300/30" />
            <div className="h-2 w-3/5 rounded-full bg-slate-300/50" />
            <div className="h-2 w-4/5 rounded-full bg-slate-300/40" />
          </div>

          {/* Modal overlay */}
          {noticeAsModal && (
            <div className="absolute inset-0 top-6 bg-slate-950/40 backdrop-blur-[2px]" />
          )}

          {/* Banner */}
          <div
            className={cn(
              'absolute z-20 p-3 rounded-2xl shadow-xl transition-all',
              noticeAsModal
                ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[260px]'
                : position === 'center'
                  ? POSITION_CLASSES[position]
                  : cn(POSITION_CLASSES[position], 'max-w-[210px]')
            )}
            style={{
              backgroundColor: palette.bg,
              color: palette.text,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: palette.border,
            }}
          >
            <div className="text-[11px] font-semibold leading-tight mb-1">{title}</div>
            <p
              className="text-[9px] leading-snug mb-2.5"
              style={{ color: palette.textSecondary }}
            >
              {truncatedDesc}
            </p>

            {privacyUrl && (
              <div
                className="text-[8px] mb-2 underline underline-offset-2 inline-block"
                style={{ color: palette.primary }}
              >
                {privacyText}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {buttons.map(b => (
                <div
                  key={b.key}
                  className="text-[9px] px-2 py-1 rounded-full font-medium leading-none whitespace-nowrap"
                  style={b.primary ? {
                    backgroundColor: palette.primary,
                    color: theme === 'dark' ? palette.bg : '#FFFFFF',
                  } : {
                    backgroundColor: 'transparent',
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          L'aperçu reflète les réglages d'apparence et de textes en temps réel. Les boutons sont indicatifs (non cliquables).
        </p>
      </CardContent>
    </Card>
  )
}
