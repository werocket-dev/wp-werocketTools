import { useEffect, useState } from 'react'
import { GoogleLogo, Stars } from './templates'
import type { ReviewsMeta, ReviewsSettings } from '@/lib/types'

/* ─── Vue pure : réutilisée par le widget frontend ET l'aperçu admin ─── */

export interface RatingBadgeViewProps {
  rating: number
  total: number
  showLogo?: boolean
  showRating?: boolean
  showStars?: boolean
  showCount?: boolean
  /** true = fond blanc + bordure + padding ; false = transparent, sans padding */
  card?: boolean
  /** '' = couleurs par défaut */
  ratingColor?: string
  starColor?: string
  countColor?: string
}

export function RatingBadgeView({
  rating,
  total,
  showLogo = true,
  showRating = true,
  showStars = true,
  showCount = true,
  card = true,
  ratingColor = '',
  starColor = '',
  countColor = '',
}: RatingBadgeViewProps) {
  if (!showLogo && !showRating && !showStars && !showCount) return null

  const cardStyle: React.CSSProperties = card
    ? {
        backgroundColor: '#FFFFFF',
        border: '1px solid #E8EAED',
        borderRadius: 16,
        padding: '18px 26px',
        boxShadow: '0 1px 2px rgba(60, 64, 67, 0.06)',
      }
    : {}

  return (
    <div
      className="wr-rating-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        ...cardStyle,
        // Stars lit var(--wr-star-color, jaune Google)
        ...(starColor ? ({ ['--wr-star-color' as never]: starColor }) : {}),
      }}
    >
      {showLogo && <GoogleLogo size={44} />}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        {showRating && (
          <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: ratingColor || '#1F1F1F' }}>
            {rating.toFixed(1).replace('.', ',')}
          </span>
        )}
        {showStars && <Stars rating={Math.round(rating)} size={17} />}
        {showCount && (
          <span style={{ fontSize: 13, lineHeight: 1.2, color: countColor || '#5F6368' }}>
            {total.toLocaleString('fr-FR')} avis
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Widget frontend : fetch la note + applique réglages et overrides ─── */

function getRestUrl(): string {
  return (window as unknown as Record<string, Record<string, string>>)['werocketFrontend']?.restUrl
    ?? '/wp-json/werocket/v1/'
}

/** Attributs shortcode : '' = défaut réglages, '1'/'0' = override */
export interface RatingBadgeProps {
  logo: string
  note: string
  etoiles: string
  avis: string
  carte: string
}

function resolveFlag(attr: string, settingValue: boolean | undefined): boolean {
  if (attr === '1') return true
  if (attr === '0') return false
  return settingValue !== false
}

export function RatingBadge({ logo, note, etoiles, avis, carte }: RatingBadgeProps) {
  const [meta, setMeta] = useState<ReviewsMeta | null>(null)
  const [settings, setSettings] = useState<Partial<ReviewsSettings>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${getRestUrl()}reviews`)
      .then(r => r.json())
      .then(data => {
        setMeta(data.meta ?? null)
        setSettings(data.settings ?? {})
      })
      .catch(() => setMeta(null))
      .finally(() => setLoading(false))
  }, [])

  // Pas de note disponible (jamais synchronisé) → on n'affiche rien
  if (loading || !meta || !meta.rating) return null

  return (
    <RatingBadgeView
      rating={meta.rating}
      total={meta.total ?? 0}
      showLogo={resolveFlag(logo, settings.badge_show_logo)}
      showRating={resolveFlag(note, settings.badge_show_rating)}
      showStars={resolveFlag(etoiles, settings.badge_show_stars)}
      showCount={resolveFlag(avis, settings.badge_show_count)}
      card={resolveFlag(carte, settings.badge_card)}
      ratingColor={settings.badge_rating_color || ''}
      starColor={settings.badge_star_color || ''}
      countColor={settings.badge_count_color || ''}
    />
  )
}
