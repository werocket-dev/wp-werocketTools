import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'
import { copyToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/utils'

/** Texte en police mono copiable d'un clic (shortcodes). */
export function CopyChip({ text, size = 'md', className }: {
  text: string
  /** sm : colonne de navigation ; md : en-têtes de carte */
  size?: 'sm' | 'md'
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!(await copyToClipboard(text))) {
      toast.error(`Copie impossible : ${text}`)
      return
    }
    setCopied(true)
    toast.success('Shortcode copié')
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copier ${text}`}
      className={cn(
        'inline-flex min-w-0 items-center gap-2 font-mono text-foreground ring-1 ring-border transition-colors hover:bg-muted',
        size === 'sm' ? 'h-7 w-full rounded-[6px] bg-card pr-2 pl-2 text-[10.5px] tracking-tight' : 'h-[30px] rounded-[7px] bg-muted px-2.5 text-xs',
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate text-left">{text}</span>
      {copied
        ? <Check className="size-3 shrink-0 text-primary" />
        : <Copy className={cn('shrink-0 text-subtle-foreground', size === 'sm' ? 'size-3' : 'size-[13px]')} />}
    </button>
  )
}
