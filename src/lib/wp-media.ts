/**
 * Helper d'accès à la WP Media Library (wp.media).
 *
 * Pré-requis : wp_enqueue_media() doit avoir été appelé côté PHP sur la page admin.
 * Voir AdminMenu::enqueue_assets().
 */

export interface WpMediaAttachment {
  id: number
  url: string
  alt?: string
  title?: string
  width?: number
  height?: number
  mime?: string
}

interface WpMediaSelection {
  first(): { toJSON(): WpMediaAttachment }
}

interface WpMediaState {
  get(key: 'selection'): WpMediaSelection
}

interface WpMediaFrame {
  on(event: string, handler: () => void): void
  open(): void
  state(): WpMediaState
}

interface WpMediaOptions {
  title?: string
  button?: { text?: string }
  multiple?: boolean
  library?: { type?: string | string[] }
}

interface WpMediaGlobal {
  media: (opts?: WpMediaOptions) => WpMediaFrame
}

declare global {
  interface Window {
    wp?: WpMediaGlobal
  }
}

/**
 * Ouvre le sélecteur de médias WP et résout avec l'attachement choisi.
 * Rejette si wp.media n'est pas disponible (wp_enqueue_media oublié).
 */
export function openMediaPicker(options: WpMediaOptions = {}): Promise<WpMediaAttachment> {
  return new Promise((resolve, reject) => {
    if (typeof window.wp === 'undefined' || typeof window.wp.media !== 'function') {
      reject(new Error('wp.media n\'est pas disponible (wp_enqueue_media manquant).'))
      return
    }

    const frame = window.wp.media({
      title: 'Choisir une image',
      button: { text: 'Utiliser cette image' },
      multiple: false,
      library: { type: 'image' },
      ...options,
    })

    frame.on('select', () => {
      const attachment = frame.state().get('selection').first().toJSON()
      resolve(attachment)
    })

    frame.open()
  })
}
