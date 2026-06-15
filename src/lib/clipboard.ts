/**
 * Copie un texte dans le presse-papier avec fallback.
 *
 * `navigator.clipboard` n'existe qu'en contexte sécurisé (HTTPS ou localhost) ;
 * sur un site servi en HTTP (ex: Local by Flywheel) on retombe sur
 * `document.execCommand('copy')` via un <textarea> masqué.
 *
 * @returns true si la copie a réussi, false sinon.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}
