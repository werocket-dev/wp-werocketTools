import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ReviewsSettings, ResponsiveValue, CardShadow } from '@/lib/types'

const SHADOW_MAP: Record<CardShadow, string> = {
  none:   'none',
  subtle: '0 1px 2px rgba(60, 64, 67, 0.06)',
  medium: '0 4px 12px rgba(60, 64, 67, 0.08), 0 1px 3px rgba(60, 64, 67, 0.05)',
  strong: '0 8px 24px rgba(60, 64, 67, 0.12), 0 2px 6px rgba(60, 64, 67, 0.06)',
}

const TABLET_BP = 768
const DESKTOP_BP = 1024

function pickResponsive<T>(rv: ResponsiveValue<T> | undefined, fallback: ResponsiveValue<T>): ResponsiveValue<T> {
  if (!rv || typeof rv !== 'object' || !('desktop' in rv)) return fallback
  return rv
}

function buildResponsiveCSS(scope: string, settings: Partial<ReviewsSettings>): string {
  const cols    = pickResponsive(settings.grid_columns,    { desktop: 3, tablet: 2, mobile: 1 })
  const gap     = pickResponsive(settings.grid_gap,        { desktop: 16, tablet: 12, mobile: 8 })
  const padding = pickResponsive(settings.card_padding,    { desktop: 24, tablet: 20, mobile: 16 })
  const slides  = pickResponsive(settings.carousel_slides, { desktop: 3, tablet: 2, mobile: 1 })

  const radius = typeof settings.card_radius === 'number' ? settings.card_radius : 12
  const shadow = SHADOW_MAP[settings.card_shadow ?? 'subtle']
  const avatarSize = typeof settings.avatar_size === 'number' && settings.avatar_size > 0 ? settings.avatar_size : 40

  /* Couleurs custom : '' = auto → la var n'est pas émise, les templates
     retombent sur leur fallback var(--wr-*, défaut). */
  const colorVars = [
    settings.card_bg_color ? `--wr-card-bg: ${settings.card_bg_color};` : '',
    settings.text_color ? `--wr-text: ${settings.text_color};` : '',
    settings.text_color ? `--wr-text-muted: color-mix(in srgb, ${settings.text_color} 62%, transparent);` : '',
    settings.star_color ? `--wr-star-color: ${settings.star_color};` : '',
  ].filter(Boolean).join('\n  ')

  const block = (cols: number, gapPx: number, paddingPx: number, slidesN: number) => `
    --wr-cols: ${cols};
    --wr-gap: ${gapPx}px;
    --wr-card-padding: ${paddingPx}px;
    --wr-slides: ${slidesN};
  `

  return `
${scope} {
  --wr-card-radius: ${radius}px;
  --wr-card-shadow: ${shadow};
  --wr-avatar-size: ${avatarSize}px;
  ${colorVars}
  ${block(cols.mobile, gap.mobile, padding.mobile, slides.mobile)}
}
@media (min-width: ${TABLET_BP}px) {
  ${scope} { ${block(cols.tablet, gap.tablet, padding.tablet, slides.tablet)} }
}
@media (min-width: ${DESKTOP_BP}px) {
  ${scope} { ${block(cols.desktop, gap.desktop, padding.desktop, slides.desktop)} }
}
`.trim()
}

interface LayoutProps {
  children: ReactNode[]
  settings: Partial<ReviewsSettings>
}

export function ReviewsLayout({ children, settings }: LayoutProps) {
  const uid = useId().replace(/[:]/g, '')
  const scope = `.wr-reviews-${uid}`
  const css = useMemo(() => buildResponsiveCSS(scope, settings), [scope, settings])

  /* Injection style tag scoped à cette instance */
  useEffect(() => {
    const id = `wr-reviews-style-${uid}`
    let el = document.getElementById(id) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = id
      document.head.appendChild(el)
    }
    el.textContent = css
    return () => {
      const node = document.getElementById(id)
      if (node) node.remove()
    }
  }, [uid, css])

  const style = settings.display_style || 'grid'
  const className = `wr-reviews-${uid}`

  if (style === 'list') {
    return (
      <div className={cn(className, 'flex flex-col')} style={{ gap: 'var(--wr-gap)' }}>
        {children}
      </div>
    )
  }

  if (style === 'carousel') {
    return <Carousel className={className} settings={settings}>{children}</Carousel>
  }

  return (
    <div
      className={cn(className, 'grid')}
      style={{
        gridTemplateColumns: 'repeat(var(--wr-cols), minmax(0, 1fr))',
        gap: 'var(--wr-gap)',
      }}
    >
      {children}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Carousel                                                       */
/* ────────────────────────────────────────────────────────────── */

function Carousel({
  children,
  settings,
  className,
}: {
  children: ReactNode[]
  settings: Partial<ReviewsSettings>
  className: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [maxIndex, setMaxIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const autoplay = !!settings.carousel_autoplay
  const speed = Math.max(2, Math.min(30, Number(settings.carousel_autoplay_speed ?? 5)))
  const loop = settings.carousel_loop !== false
  const showArrows = settings.carousel_show_arrows !== false
  const showDots = settings.carousel_show_dots !== false
  const count = children.length

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const update = () => {
      const card = el.querySelector<HTMLElement>('[data-carousel-slide]')
      if (!card) return
      const gapPx = parseFloat(getComputedStyle(el).columnGap || '16')
      const cardWidth = card.offsetWidth + gapPx
      const visible = Math.max(1, Math.floor(el.clientWidth / cardWidth))
      setMaxIndex(Math.max(0, count - visible))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [count])

  function scrollTo(i: number) {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-carousel-slide]')
    if (!card) return
    const gapPx = parseFloat(getComputedStyle(el).columnGap || '16')
    const cardWidth = card.offsetWidth + gapPx
    el.scrollTo({ left: i * cardWidth, behavior: 'smooth' })
    setIndex(i)
  }

  function go(delta: number) {
    let next = index + delta
    if (next > maxIndex) next = loop ? 0 : maxIndex
    if (next < 0) next = loop ? maxIndex : 0
    scrollTo(next)
  }

  useEffect(() => {
    if (!autoplay || paused || count <= 1) return
    const id = setInterval(() => go(1), speed * 1000)
    return () => clearInterval(id)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [autoplay, paused, speed, index, maxIndex, loop, count])

  function handleScroll() {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-carousel-slide]')
    if (!card) return
    const gapPx = parseFloat(getComputedStyle(el).columnGap || '16')
    const cardWidth = card.offsetWidth + gapPx
    const i = Math.round(el.scrollLeft / cardWidth)
    if (i !== index) setIndex(i)
  }

  return (
    <div
      className={cn(className, 'relative')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ gap: 'var(--wr-gap)' }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            data-carousel-slide
            className="flex-none [scroll-snap-align:start]"
            style={{
              width: 'calc((100% - (var(--wr-slides) - 1) * var(--wr-gap)) / var(--wr-slides))',
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {showArrows && count > 1 && (
        <>
          <ArrowButton direction="prev" onClick={() => go(-1)} disabled={!loop && index === 0} />
          <ArrowButton direction="next" onClick={() => go(1)} disabled={!loop && index >= maxIndex} />
        </>
      )}

      {showDots && maxIndex > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Aller à la diapositive ${i + 1}`}
              className={cn(
                'transition-all rounded-full',
                i === index
                  ? 'w-6 h-2 bg-foreground/70'
                  : 'w-2 h-2 bg-foreground/20 hover:bg-foreground/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Précédent' : 'Suivant'}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background shadow-md ring-1 ring-foreground/10 flex items-center justify-center transition-all',
        'hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100',
        direction === 'prev' ? '-left-2 sm:-left-4' : '-right-2 sm:-right-4'
      )}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-foreground/70">
        {direction === 'prev'
          ? <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </button>
  )
}
