export interface KlaroManager {
  confirmed: boolean
  consents: Record<string, boolean>
  updateConsent(name: string, value: boolean): void
  /** Passe tous les services non requis à `value` (les requis restent à true). */
  changeAll(value: boolean): number
  /** L'argument n'est qu'un libellé d'événement : il ne modifie PAS les consentements. */
  saveAndApplyConsents(eventType?: string): void
}

declare global {
  interface Window {
    klaro?: {
      getManager(): KlaroManager
      show(config?: unknown, modal?: boolean): void
    }
    WeRocketCookies?: {
      showSettings(): void
      showBanner(): void
    }
  }
}

export async function getKlaroManager(timeoutMs = 5000): Promise<KlaroManager | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (window.klaro?.getManager) return window.klaro.getManager()
    await new Promise(r => setTimeout(r, 50))
  }
  return null
}

export function hasConsented(cookieName: string): boolean {
  return document.cookie.split(';').some(c => c.trim().startsWith(`${cookieName}=`))
}
