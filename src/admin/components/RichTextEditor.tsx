import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import {
  IconBold, IconItalic, IconUnderline, IconStrikethrough,
  IconH1, IconH2, IconH3,
  IconList, IconListNumbers, IconQuote, IconCode, IconSeparator,
  IconLink, IconLinkOff, IconArrowBackUp, IconArrowForwardUp,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (next: string) => void
  onContextMenu?: (e: React.MouseEvent) => void
  placeholder?: string
  className?: string
}

export interface RichTextEditorHandle {
  insertContent: (content: string) => void
  focus: () => void
  editor: Editor | null
}

/**
 * Éditeur riche style Notion (TipTap). Output HTML compatible avec
 * wp_kses_post() côté PHP. Conserve les variables {company.x} comme
 * texte brut — elles sont résolues à l'affichage par VariableResolver.
 */
export const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RichTextEditor({
  value, onChange, onContextMenu, placeholder, className,
}, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
      }),
      Underline,
      Typography,
      Placeholder.configure({
        placeholder: placeholder ?? 'Tape "/" pour les blocs ou écris directement…',
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: cn(
          'tiptap-content min-h-[400px] max-w-none p-5 outline-none',
          'prose prose-sm prose-neutral max-w-none',
        ),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  })

  // Sync externe → éditeur (insertion variable depuis le menu contextuel parent)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current && value !== undefined) {
      // Évite la boucle infinie : ne pas re-set si le contenu vient déjà de l'éditeur
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  useImperativeHandle(ref, () => ({
    insertContent: (content: string) => {
      editor?.chain().focus().insertContent(content).run()
    },
    focus: () => editor?.chain().focus().run(),
    editor,
  }), [editor])

  if (!editor) {
    return (
      <div className="rounded-2xl border border-border min-h-[400px] flex items-center justify-center text-muted-foreground text-sm">
        Chargement de l'éditeur…
      </div>
    )
  }

  return (
    <div className={cn('rounded-2xl border border-border bg-background overflow-hidden', className)}>
      <Toolbar editor={editor} />
      <div onContextMenu={onContextMenu}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})

function Toolbar({ editor }: { editor: Editor }) {
  function toggleLink() {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien (laisse vide pour supprimer)', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
      <Group>
        <Btn label="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <IconBold className="size-4" />
        </Btn>
        <Btn label="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <IconItalic className="size-4" />
        </Btn>
        <Btn label="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <IconUnderline className="size-4" />
        </Btn>
        <Btn label="Barré" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <IconStrikethrough className="size-4" />
        </Btn>
      </Group>

      <Sep />

      <Group>
        <Btn label="Titre 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <IconH1 className="size-4" />
        </Btn>
        <Btn label="Titre 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <IconH2 className="size-4" />
        </Btn>
        <Btn label="Titre 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <IconH3 className="size-4" />
        </Btn>
      </Group>

      <Sep />

      <Group>
        <Btn label="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <IconList className="size-4" />
        </Btn>
        <Btn label="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <IconListNumbers className="size-4" />
        </Btn>
        <Btn label="Citation" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <IconQuote className="size-4" />
        </Btn>
        <Btn label="Code" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <IconCode className="size-4" />
        </Btn>
        <Btn label="Séparateur" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <IconSeparator className="size-4" />
        </Btn>
      </Group>

      <Sep />

      <Group>
        <Btn label="Lien" active={editor.isActive('link')} onClick={toggleLink}>
          <IconLink className="size-4" />
        </Btn>
        <Btn
          label="Retirer le lien"
          disabled={!editor.isActive('link')}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <IconLinkOff className="size-4" />
        </Btn>
      </Group>

      <Sep />

      <Group>
        <Btn label="Annuler" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <IconArrowBackUp className="size-4" />
        </Btn>
        <Btn label="Rétablir" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <IconArrowForwardUp className="size-4" />
        </Btn>
      </Group>
    </div>
  )
}

function Btn({
  children, onClick, active, disabled, label,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center size-8 rounded-lg transition-colors',
        'text-foreground/80 hover:bg-muted hover:text-foreground',
        'disabled:opacity-40 disabled:pointer-events-none',
        active && 'bg-primary/15 text-primary hover:bg-primary/20',
      )}
    >
      {children}
    </button>
  )
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>
}

function Sep() {
  return <div className="w-px h-6 bg-border mx-1" aria-hidden />
}
