import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { IconCopy, IconCheck, IconBraces } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/clipboard'
import type { CompanyVariable } from '@/lib/types'
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor'

interface Props {
  title: string
  description: string
  shortcode: string
  value: string
  onChange: (next: string) => void
  variables: CompanyVariable[]
  placeholder?: string
}

export function LegalPageEditor({
  title,
  description,
  shortcode,
  value,
  onChange,
  variables,
  placeholder,
}: Props) {
  const editorRef = useRef<RichTextEditorHandle>(null)
  const [copied, setCopied] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [variablesOpen, setVariablesOpen] = useState(false)

  // Fermer le menu contextuel au clic OU à la touche Escape — pas au scroll
  // (sinon scroller dans le menu lui-même le fait disparaître).
  useEffect(() => {
    if (!contextMenu) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      // Si le clic est à l'intérieur du menu, on ignore (laisse le button onClick agir)
      if (target?.closest('[data-werocket-context-menu]')) return
      setContextMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [contextMenu])

  function handleInsertVariable(key: string) {
    editorRef.current?.insertContent(`{${key}}`)
    setVariablesOpen(false)
    setContextMenu(null)
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  async function copyShortcode() {
    if (!(await copyToClipboard(shortcode))) {
      toast.error('Impossible de copier')
      return
    }
    setCopied(true)
    toast.success('Shortcode copié dans le presse-papier')
    setTimeout(() => setCopied(false), 1500)
  }

  const groupedVariables = variables.reduce<Record<string, CompanyVariable[]>>((acc, v) => {
    (acc[v.group] ??= []).push(v)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyShortcode}
            type="button"
            className="font-mono text-xs"
          >
            {copied ? <IconCheck className="size-4 text-primary" /> : <IconCopy className="size-4" />}
            {shortcode}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Astuce : <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">clic-droit</kbd> dans l'éditeur pour insérer une variable.
          </p>
          <Popover open={variablesOpen} onOpenChange={setVariablesOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" type="button">
                <IconBraces className="size-4" />
                Insérer une variable
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-2">
              <VariableList grouped={groupedVariables} onPick={handleInsertVariable} />
            </PopoverContent>
          </Popover>
        </div>

        <RichTextEditor
          ref={editorRef}
          value={value}
          onChange={onChange}
          onContextMenu={handleContextMenu}
          placeholder={placeholder}
        />
      </CardContent>

      {contextMenu && (
        <div
          role="menu"
          data-werocket-context-menu
          className={cn(
            'fixed z-[10000] w-64 max-h-[420px] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover',
            'p-1 shadow-xl ring-1 ring-foreground/5'
          )}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0 bg-popover">
            Insérer une variable
          </div>
          <VariableList grouped={groupedVariables} onPick={handleInsertVariable} compact />
        </div>
      )}
    </Card>
  )
}

function VariableList({
  grouped,
  onPick,
  compact = false,
}: {
  grouped: Record<string, CompanyVariable[]>
  onPick: (key: string) => void
  compact?: boolean
}) {
  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          {!compact && (
            <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              {group}
            </div>
          )}
          <div className="flex flex-col">
            {items.map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => onPick(v.key)}
                className="text-left rounded-xl px-2 py-1.5 hover:bg-muted text-sm flex items-center justify-between gap-2"
              >
                <span>{v.label}</span>
                <code className="text-[10px] text-muted-foreground font-mono">{`{${v.key}}`}</code>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
