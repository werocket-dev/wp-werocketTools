import { IconQuote } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { Review, ReviewsSettings, ReviewTemplate } from '@/lib/types'

/* ─── Palette Google officielle (exception charte de marque) ─── */
const G = {
  blue: '#4285F4',
  green: '#34A853',
  yellow: '#FBBC04',
  red: '#EA4335',
  text: '#1F1F1F',
  textMuted: '#5F6368',
  border: '#E8EAED',
  bg: '#F8F9FA',
} as const

/* ─── Variables CSS de personnalisation (fallback = défaut template) ─── */
const V = {
  text: 'var(--wr-text, #1F1F1F)',
  textMuted: 'var(--wr-text-muted, #5F6368)',
  cardBg: 'var(--wr-card-bg, #FFFFFF)',
  star: `var(--wr-star-color, ${G.yellow})`,
  avatar: 'var(--wr-avatar-size, 40px)',
} as const

export interface TemplateProps {
  review: Review
  settings: Partial<ReviewsSettings>
}

function showBadge(settings: Partial<ReviewsSettings>): boolean {
  return settings.show_google_badge !== false
}

/* ────────────────────────────────────────────────────────────── */
/*  Atomes communs                                                */
/* ────────────────────────────────────────────────────────────── */

export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="inline-flex gap-px" aria-label={`${rating} sur 5 étoiles`}>
      {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden
          style={{ fill: n <= rating ? V.star : '#DADCE0' }}
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  )
}

const AVATAR_PALETTE: [string, string][] = [
  ['#FCE8E6', '#C5221F'],
  ['#FEF7E0', '#E37400'],
  ['#FEEFC3', '#B06000'],
  ['#E6F4EA', '#137333'],
  ['#E8F0FE', '#1967D2'],
  ['#F3E8FD', '#8430CE'],
  ['#FCE4EC', '#C2185B'],
]

function pickAvatarColor(name: string): [string, string] {
  const code = (name || '?').charCodeAt(0)
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length]
}

function Avatar({ review, size = 40 }: { review: Review; size?: number }) {
  // --wr-avatar-size (réglage global) prime sur la taille par défaut du template
  const dim = {
    width: `var(--wr-avatar-size, ${size}px)`,
    height: `var(--wr-avatar-size, ${size}px)`,
    fontSize: `calc(var(--wr-avatar-size, ${size}px) * 0.42)`,
  }
  if (review.profile_photo_url) {
    return (
      <img
        src={review.profile_photo_url}
        alt={review.author_name}
        className="rounded-full object-cover flex-shrink-0"
        style={dim}
        referrerPolicy="no-referrer"
      />
    )
  }
  const initial = (review.author_name || '?').trim().charAt(0).toUpperCase()
  const [bg, fg] = pickAvatarColor(review.author_name || '?')
  return (
    <div
      className="rounded-full flex items-center justify-center font-medium flex-shrink-0 select-none"
      style={{ ...dim, backgroundColor: bg, color: fg }}
      aria-hidden
    >
      {initial}
    </div>
  )
}

export function GoogleLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill={G.blue}   d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill={G.green}  d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill={G.yellow} d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill={G.red}    d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  )
}

function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Vérifié">
      <path
        fill={G.blue}
        d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l1.5 3.5L2 16l3.5 1L6 20.5 9.5 20 12 22.5 14.5 20 18 20.5l.5-3.5L22 16l-1.5-3.5L22 9l-3.5-1.5L18 4l-3.5.5z"
      />
      <path fill="#fff" d="m10.5 14.7-2.4-2.4 1.06-1.06 1.34 1.34 4.34-4.34L15.9 9.3z" />
    </svg>
  )
}

function PostedOnGoogle({ small = false }: { small?: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{ color: V.textMuted, fontSize: small ? 11 : 12 }}
    >
      <GoogleLogo size={small ? 12 : 14} />
      <span>Publié sur Google</span>
    </div>
  )
}

function ReviewText({
  text,
  italic = false,
  align = 'left',
}: {
  text: string
  italic?: boolean
  align?: 'left' | 'center'
}) {
  return (
    <p
      className={cn('leading-relaxed', italic && 'italic')}
      style={{
        color: V.text,
        fontSize: 14,
        lineHeight: '1.55',
        textAlign: align,
      }}
    >
      {text}
    </p>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Template 1 — Minimal                                           */
/*  Trustindex "Minimal Light" : pas de card, séparateur fin      */
/* ────────────────────────────────────────────────────────────── */

export function MinimalCard({ review, settings }: TemplateProps) {
  const badge = showBadge(settings)
  return (
    <div
      className="py-5 first:pt-0 last:pb-0 border-b last:border-0"
      style={{ borderColor: G.border }}
    >
      <div className="flex items-center gap-3 mb-2">
        {settings.show_avatar !== false && <Avatar review={review} size={36} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span style={{ color: V.text, fontSize: 14, fontWeight: 500 }}>
              {review.author_name}
            </span>
            {badge && <VerifiedBadge size={13} />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {settings.show_rating !== false && <Stars rating={review.rating} size={13} />}
            {settings.show_date !== false && review.relative_time_description && (
              <span style={{ color: V.textMuted, fontSize: 12 }}>
                · {review.relative_time_description}
              </span>
            )}
          </div>
        </div>
        {badge && <GoogleLogo size={16} />}
      </div>
      <ReviewText text={review.text} />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Template 2 — Classic                                           */
/*  Trustindex "Light Background" : le plus populaire             */
/* ────────────────────────────────────────────────────────────── */

export function ClassicCard({ review, settings }: TemplateProps) {
  const badge = showBadge(settings)
  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: V.cardBg,
        border: `1px solid ${G.border}`,
        padding: 'var(--wr-card-padding, 20px)',
        borderRadius: 'var(--wr-card-radius, 12px)',
        boxShadow: 'var(--wr-card-shadow, 0 1px 2px rgba(60, 64, 67, 0.06))',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {settings.show_avatar !== false && <Avatar review={review} size={40} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="truncate"
              style={{ color: V.text, fontSize: 14, fontWeight: 500 }}
            >
              {review.author_name}
            </span>
            {badge && <VerifiedBadge size={14} />}
          </div>
          {settings.show_date !== false && review.relative_time_description && (
            <span style={{ color: V.textMuted, fontSize: 12 }}>
              {review.relative_time_description}
            </span>
          )}
        </div>
        {badge && <GoogleLogo size={18} />}
      </div>

      {settings.show_rating !== false && (
        <div className="mb-2.5">
          <Stars rating={review.rating} size={16} />
        </div>
      )}

      <ReviewText text={review.text} />

      {badge && (
        <div
          className="mt-4 pt-3"
          style={{ borderTop: `1px solid ${G.border}` }}
        >
          <PostedOnGoogle small />
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Template 3 — Premium (Drop Shadow + Quote)                    */
/*  Trustindex "Drop Shadow" élevé                                */
/* ────────────────────────────────────────────────────────────── */

export function CardCard({ review, settings }: TemplateProps) {
  const badge = showBadge(settings)
  const showMeta = badge || (settings.show_date !== false && !!review.relative_time_description)
  return (
    <div
      className="relative h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: V.cardBg,
        padding: 'var(--wr-card-padding, 24px)',
        borderRadius: 'var(--wr-card-radius, 16px)',
        boxShadow: 'var(--wr-card-shadow, 0 4px 16px rgba(60, 64, 67, 0.08), 0 1px 4px rgba(60, 64, 67, 0.05))',
      }}
    >
      <IconQuote
        size={48}
        className="absolute -top-1 -left-1 opacity-[0.08]"
        style={{ color: G.blue }}
        aria-hidden
      />

      <div className="relative flex items-center justify-between mb-3">
        {settings.show_rating !== false && <Stars rating={review.rating} size={18} />}
        {badge && <GoogleLogo size={20} />}
      </div>

      <ReviewText text={review.text} />

      <div
        className="relative flex items-center gap-3 mt-5 pt-4"
        style={{ borderTop: `1px solid ${G.border}` }}
      >
        {settings.show_avatar !== false && <Avatar review={review} size={40} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="truncate"
              style={{ color: V.text, fontSize: 14, fontWeight: 600 }}
            >
              {review.author_name}
            </span>
            {badge && <VerifiedBadge size={14} />}
          </div>
          {showMeta && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {badge && <GoogleLogo size={11} />}
              <span style={{ color: V.textMuted, fontSize: 11 }}>
                {settings.show_date !== false && review.relative_time_description
                  ? `Avis publié ${review.relative_time_description}`
                  : 'Publié sur Google'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Template 4 — Quote (Soft)                                     */
/*  Trustindex "Soft" : pastel, gros radius, centré               */
/* ────────────────────────────────────────────────────────────── */

export function QuoteCard({ review, settings }: TemplateProps) {
  const badge = showBadge(settings)
  return (
    <div
      className="relative h-full flex flex-col items-center text-center overflow-hidden"
      style={{
        background: 'var(--wr-card-bg, linear-gradient(160deg, #F8F9FA 0%, #FFFFFF 100%))',
        border: `1px solid ${G.border}`,
        padding: 'var(--wr-card-padding, 28px)',
        borderRadius: 'var(--wr-card-radius, 24px)',
        boxShadow: 'var(--wr-card-shadow, none)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full mb-3"
        style={{
          width: 44,
          height: 44,
          backgroundColor: 'rgba(66, 133, 244, 0.08)',
        }}
      >
        <IconQuote size={22} style={{ color: G.blue }} aria-hidden />
      </div>

      <ReviewText text={`« ${review.text} »`} italic align="center" />

      <div className="flex flex-col items-center gap-2 mt-5">
        {settings.show_avatar !== false && <Avatar review={review} size={48} />}
        <div className="flex items-center gap-1.5">
          <span style={{ color: V.text, fontSize: 14, fontWeight: 600 }}>
            {review.author_name}
          </span>
          {badge && <VerifiedBadge size={13} />}
        </div>
        {settings.show_rating !== false && (
          <Stars rating={review.rating} size={15} />
        )}
        {settings.show_date !== false && review.relative_time_description && (
          <div className="inline-flex items-center gap-1" style={{ color: V.textMuted, fontSize: 11 }}>
            {badge && <GoogleLogo size={11} />}
            <span>{review.relative_time_description}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Template 5 — Google Branded                                   */
/*  Trustindex "Google Branded" : header rating + card pleine     */
/* ────────────────────────────────────────────────────────────── */

export function GoogleCard({ review, settings }: TemplateProps) {
  const badge = showBadge(settings)
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: V.cardBg,
        border: `1px solid ${G.border}`,
        borderRadius: 'var(--wr-card-radius, 12px)',
        boxShadow: 'var(--wr-card-shadow, none)',
      }}
    >
      <div
        className="flex items-center justify-between py-3"
        style={{
          backgroundColor: G.bg,
          borderBottom: `1px solid ${G.border}`,
          paddingLeft: 'var(--wr-card-padding, 20px)',
          paddingRight: 'var(--wr-card-padding, 20px)',
        }}
      >
        <div className="flex items-center gap-2">
          {badge ? (
            <>
              <GoogleLogo size={18} />
              <span style={{ color: G.text, fontSize: 13, fontWeight: 500 }}>
                Avis Google
              </span>
            </>
          ) : (
            <span style={{ color: G.text, fontSize: 13, fontWeight: 500 }}>
              Avis client
            </span>
          )}
        </div>
        {settings.show_rating !== false && <Stars rating={review.rating} size={14} />}
      </div>

      <div className="flex-1 flex flex-col" style={{ padding: 'var(--wr-card-padding, 20px)' }}>
        <div className="flex items-center gap-3 mb-3">
          {settings.show_avatar !== false && <Avatar review={review} size={42} />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="truncate"
                style={{ color: V.text, fontSize: 14, fontWeight: 500 }}
              >
                {review.author_name}
              </span>
              {badge && <VerifiedBadge size={14} />}
            </div>
            {settings.show_date !== false && review.relative_time_description && (
              <span style={{ color: V.textMuted, fontSize: 12 }}>
                {review.relative_time_description}
              </span>
            )}
          </div>
        </div>

        <ReviewText text={review.text} />

        {badge && (
          <a
            href="#"
            onClick={e => e.preventDefault()}
            className="inline-flex items-center gap-1 mt-4 self-start no-underline hover:underline"
            style={{ color: G.blue, fontSize: 12, fontWeight: 500 }}
          >
            Voir sur Google
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Registre                                                       */
/* ────────────────────────────────────────────────────────────── */

export const TEMPLATES: Record<ReviewTemplate, React.FC<TemplateProps>> = {
  minimal: MinimalCard,
  classic: ClassicCard,
  card: CardCard,
  quote: QuoteCard,
  google: GoogleCard,
}

export interface TemplateMeta {
  label: string
  description: string
  thumbnail: React.ReactNode
}

/* Vignettes miniatures fidèles à chaque template */

const ThumbStars = ({ size = 4 }: { size?: number }) => (
  <div className="flex gap-px">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={G.yellow}>
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ))}
  </div>
)

const ThumbAvatar = ({ size = 8, color = '#E8F0FE' }: { size?: number; color?: string }) => (
  <div className="rounded-full flex-shrink-0" style={{ width: size, height: size, backgroundColor: color }} />
)

const ThumbBar = ({ w = '100%' }: { w?: string }) => (
  <div className="h-[2px] rounded-full" style={{ width: w, backgroundColor: G.border }} />
)

export const TEMPLATE_META: Record<ReviewTemplate, TemplateMeta> = {
  minimal: {
    label: 'Minimal',
    description: 'Épuré, sans card',
    thumbnail: (
      <div className="w-full h-full flex flex-col justify-center gap-1.5 p-2" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center gap-1">
          <ThumbAvatar size={9} />
          <div className="flex-1 flex flex-col gap-0.5">
            <div className="h-[2px] w-2/3 rounded-full" style={{ backgroundColor: G.text }} />
            <ThumbStars />
          </div>
          <GoogleLogo size={8} />
        </div>
        <ThumbBar />
        <ThumbBar w="70%" />
        <div className="h-px w-full mt-0.5" style={{ backgroundColor: G.border }} />
      </div>
    ),
  },
  classic: {
    label: 'Classic',
    description: 'Le plus populaire',
    thumbnail: (
      <div
        className="w-full h-full flex flex-col gap-1 p-2"
        style={{
          backgroundColor: '#FFFFFF',
          border: `1px solid ${G.border}`,
          borderRadius: 4,
          boxShadow: '0 1px 2px rgba(60,64,67,.08)',
        }}
      >
        <div className="flex items-center gap-1">
          <ThumbAvatar size={9} />
          <div className="flex-1 flex flex-col gap-0.5">
            <div className="h-[2px] w-2/3 rounded-full" style={{ backgroundColor: G.text }} />
            <div className="h-[1.5px] w-1/3 rounded-full" style={{ backgroundColor: G.textMuted }} />
          </div>
          <GoogleLogo size={8} />
        </div>
        <ThumbStars />
        <ThumbBar />
        <ThumbBar w="60%" />
        <div className="mt-auto pt-1 flex items-center gap-1" style={{ borderTop: `1px solid ${G.border}` }}>
          <GoogleLogo size={6} />
          <div className="h-[2px] w-10 rounded-full" style={{ backgroundColor: G.textMuted }} />
        </div>
      </div>
    ),
  },
  card: {
    label: 'Premium',
    description: 'Ombre + guillemet',
    thumbnail: (
      <div
        className="relative w-full h-full flex flex-col gap-1 p-2 overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 6,
          boxShadow: '0 3px 8px rgba(60,64,67,.15)',
        }}
      >
        <IconQuote size={20} className="absolute -top-1 -left-1 opacity-10" style={{ color: G.blue }} />
        <div className="relative flex items-center justify-between">
          <ThumbStars />
          <GoogleLogo size={8} />
        </div>
        <ThumbBar />
        <ThumbBar w="65%" />
        <div className="mt-auto pt-1 flex items-center gap-1" style={{ borderTop: `1px solid ${G.border}` }}>
          <ThumbAvatar size={7} color="#FCE4EC" />
          <div className="h-[2px] w-1/3 rounded-full" style={{ backgroundColor: G.text }} />
        </div>
      </div>
    ),
  },
  quote: {
    label: 'Citation',
    description: 'Pastel, centré',
    thumbnail: (
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-1 p-2"
        style={{
          background: 'linear-gradient(160deg, #F8F9FA 0%, #FFFFFF 100%)',
          border: `1px solid ${G.border}`,
          borderRadius: 8,
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 14, height: 14, backgroundColor: 'rgba(66,133,244,0.1)' }}
        >
          <IconQuote size={8} style={{ color: G.blue }} />
        </div>
        <div className="h-[1.5px] w-3/4 rounded-full" style={{ backgroundColor: G.text }} />
        <div className="h-[1.5px] w-1/2 rounded-full" style={{ backgroundColor: G.textMuted }} />
        <ThumbAvatar size={7} color="#E6F4EA" />
        <ThumbStars size={3} />
      </div>
    ),
  },
  google: {
    label: 'Google',
    description: 'Bandeau + Voir sur Google',
    thumbnail: (
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          border: `1px solid ${G.border}`,
          borderRadius: 4,
        }}
      >
        <div
          className="flex items-center justify-between px-1.5 py-1"
          style={{ backgroundColor: G.bg, borderBottom: `1px solid ${G.border}` }}
        >
          <div className="flex items-center gap-0.5">
            <GoogleLogo size={8} />
            <div className="h-[2px] w-6 rounded-full" style={{ backgroundColor: G.text }} />
          </div>
          <ThumbStars />
        </div>
        <div className="flex-1 flex flex-col gap-0.5 p-1.5">
          <div className="flex items-center gap-1">
            <ThumbAvatar size={7} color="#FEF7E0" />
            <div className="h-[2px] w-1/2 rounded-full" style={{ backgroundColor: G.text }} />
          </div>
          <ThumbBar />
          <ThumbBar w="55%" />
          <div className="h-[1.5px] w-12 rounded-full mt-auto" style={{ backgroundColor: G.blue }} />
        </div>
      </div>
    ),
  },
}

