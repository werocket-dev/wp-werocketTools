import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { SlashItem } from './SlashCommand'

interface Props {
  items: SlashItem[]
  command: (item: SlashItem) => void
  clientRect?: (() => DOMRect | null) | null
}

export interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

export const SlashMenu = forwardRef<SlashMenuHandle, Props>(function SlashMenu(
  { items, command, clientRect },
  ref,
) {
  const [selected, setSelected] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number; placement: 'bottom' | 'top' }>({
    x: 0, y: 0, placement: 'bottom',
  })

  useLayoutEffect(() => {
    if (!clientRect) return
    const rect = clientRect()
    if (!rect) return

    const menuHeight = 320
    const spaceBelow = window.innerHeight - rect.bottom
    const placement: 'bottom' | 'top' = spaceBelow < menuHeight + 16 ? 'top' : 'bottom'

    setPosition({
      x: rect.left,
      y: placement === 'bottom' ? rect.bottom + 8 : rect.top - 8,
      placement,
    })
  }, [clientRect, items.length])

  useEffect(() => {
    setSelected(0)
  }, [items])

  useEffect(() => {
    if (!containerRef.current) return
    const item = containerRef.current.querySelector<HTMLButtonElement>(`[data-index="${selected}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === 'ArrowDown') {
        setSelected(prev => (prev + 1) % items.length)
        return true
      }
      if (event.key === 'ArrowUp') {
        setSelected(prev => (prev - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        const item = items[selected]
        if (item) command(item)
        return true
      }
      if (event.key === 'Escape') {
        return true
      }
      return false
    },
  }), [items, selected, command])

  if (items.length === 0) return null

  const node = (
    <div
      ref={containerRef}
      role="listbox"
      className={cn(
        'werocket-slash-menu fixed z-[10001] w-72 max-h-80 overflow-y-auto rounded-2xl',
        'border border-border bg-popover p-1 shadow-xl ring-1 ring-foreground/5'
      )}
      style={{
        left: position.x,
        top: position.placement === 'bottom' ? position.y : undefined,
        bottom: position.placement === 'top' ? window.innerHeight - position.y : undefined,
      }}
    >
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        Insérer un bloc
      </div>
      {items.map((item, i) => (
        <button
          key={item.title}
          type="button"
          data-index={i}
          role="option"
          aria-selected={i === selected}
          onMouseDown={(e) => {
            e.preventDefault()
            command(item)
          }}
          onMouseEnter={() => setSelected(i)}
          className={cn(
            'w-full flex items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
            i === selected ? 'bg-muted' : 'hover:bg-muted/60'
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground/80">
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">{item.title}</div>
            <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  )

  return createPortal(node, document.body)
})
