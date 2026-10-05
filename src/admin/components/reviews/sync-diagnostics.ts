import type { ReviewsSyncResult } from '@/lib/types'

export const PLACE_ID_FINDER_URL = 'https://developers.google.com/maps/documentation/places/web-service/place-id'
export const API_KEY_GUIDE_URL = 'https://developers.google.com/maps/documentation/places/web-service/get-api-key'
const CONSOLE = 'https://console.cloud.google.com'

export interface DiagnosticStep {
  title: string
  description: string
  link?: { label: string; href: string }
}

export interface Diagnostic {
  /** Titre de la carte d'erreur (vue d'ensemble) */
  title: string
  /** Explication courte, en clair */
  explanation: string
  /** Libellé de la réponse de Google : « Requête refusée »… */
  response: string
  /** Champ des identifiants en cause */
  field: 'key' | 'place_id' | null
  steps: DiagnosticStep[]
}

/** Code d'un échec ; les synchros enregistrées avant l'ajout du code sont déduites de leur message. */
export function failureCode(sync: ReviewsSyncResult): string {
  if (sync.code) return sync.code
  const error = sync.error ?? ''
  if (error.startsWith('Requête refusée')) return 'google_api_request_denied'
  if (error.startsWith('Place ID introuvable')) return 'google_api_not_found'
  if (error.startsWith('Quota Google')) return 'google_api_over_query_limit'
  if (error.includes('manquant')) return 'missing_credentials'
  return 'unknown'
}

const BILLING_STEP: DiagnosticStep = {
  title: 'Vérifier que la facturation est active',
  description: 'Google exige un compte de facturation, même dans la limite gratuite.',
  link: { label: 'Ouvrir la facturation', href: `${CONSOLE}/billing` },
}

const PLACE_ID_STEP: DiagnosticStep = {
  title: 'Vérifier le Place ID de votre établissement',
  description: 'Il commence par « ChIJ » : copiez-le en entier depuis l\'outil de recherche de Google.',
  link: { label: 'Trouver mon Place ID', href: PLACE_ID_FINDER_URL },
}

export function diagnose(sync: ReviewsSyncResult): Diagnostic {
  switch (failureCode(sync)) {
    case 'google_api_request_denied':
      return {
        title: 'Google a refusé la dernière synchronisation',
        explanation: 'L\'API « Places » n\'est probablement pas activée sur votre projet Google Cloud, ou votre clé est restreinte par référent HTTP.',
        response: 'Requête refusée',
        field: 'key',
        steps: [
          {
            title: 'Activer « Places API » sur votre projet',
            description: 'Google Cloud Console › API et services › Bibliothèque',
            link: { label: 'Ouvrir la console', href: `${CONSOLE}/apis/library/places-backend.googleapis.com` },
          },
          {
            title: 'Retirer la restriction « Référents HTTP » de la clé',
            description: 'Les requêtes partent de votre serveur : utilisez plutôt une restriction par adresse IP.',
            link: { label: 'Voir la clé', href: `${CONSOLE}/apis/credentials` },
          },
          BILLING_STEP,
        ],
      }
    case 'google_api_not_found':
    case 'google_api_invalid_request':
    case 'google_api_zero_results':
      return {
        title: 'Google ne trouve pas votre établissement',
        explanation: 'Le Place ID enregistré est introuvable ou mal formé.',
        response: 'Lieu introuvable',
        field: 'place_id',
        steps: [PLACE_ID_STEP],
      }
    case 'google_api_over_query_limit':
      return {
        title: 'Quota Google dépassé',
        explanation: 'Votre projet Google Cloud a atteint sa limite de requêtes, souvent faute de facturation active.',
        response: 'Quota dépassé',
        field: null,
        steps: [
          BILLING_STEP,
          {
            title: 'Vérifier les quotas de « Places API »',
            description: 'Google Cloud Console › API et services › Quotas',
            link: { label: 'Voir les quotas', href: `${CONSOLE}/apis/api/places-backend.googleapis.com/quotas` },
          },
        ],
      }
    case 'http_error':
      return {
        title: 'Google n\'a pas pu être contacté',
        explanation: 'Votre serveur n\'a pas réussi à joindre l\'API Google.',
        response: 'Injoignable',
        field: null,
        steps: [
          { title: 'Réessayer dans quelques minutes', description: 'L\'API Google peut être momentanément indisponible.' },
          {
            title: 'Vérifier les connexions sortantes de l\'hébergement',
            description: 'Demandez à votre hébergeur d\'autoriser les requêtes vers maps.googleapis.com.',
          },
        ],
      }
    case 'missing_credentials':
      return {
        title: 'Identifiants Google manquants',
        explanation: 'Renseignez le Place ID de votre établissement et une clé API Google Places.',
        response: 'Identifiants manquants',
        field: null,
        steps: [PLACE_ID_STEP],
      }
    default:
      return {
        title: 'La dernière synchronisation a échoué',
        explanation: sync.error ?? 'Google a renvoyé une erreur inattendue.',
        response: 'Erreur',
        field: null,
        steps: [],
      }
  }
}

/** « 5 oct. 2026, 01:13 » */
export function formatDateTime(unixTs: number): string {
  return new Date(unixTs * 1000).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Note au format français : 4,9 */
export function formatRating(rating: number): string {
  return rating.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
