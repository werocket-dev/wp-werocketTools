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

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    document.addEventListener('click', close)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('scroll', close, true)
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
    try {
      await navigator.clipboard.writeText(shortcode)
      setCopied(true)
      toast.success('Shortcode copié dans le presse-papier')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Impossible de copier')
    }
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
          className={cn(
            'fixed z-[10000] min-w-56 max-h-96 overflow-y-auto rounded-2xl border border-border bg-popover',
            'p-1 shadow-xl ring-1 ring-foreground/5'
          )}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
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
