import {
  IconH1, IconH2, IconH3, IconList, IconListNumbers, IconQuote,
  IconCode, IconSeparator, IconLetterT, IconCheck,
} from '@tabler/icons-react'
import type { SlashItem } from './SlashCommand'

/**
 * Liste des blocs insérables via "/" — chacun supprime la séquence "/query"
 * tapée par l'utilisateur (range) avant d'appliquer la commande shadcn.
 */
export const SLASH_ITEMS: SlashItem[] = [
  {
    title: 'Texte',
    description: 'Paragraphe simple',
    icon: <IconLetterT className="size-4" />,
    keywords: ['texte', 'paragraphe', 'p', 'text'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('paragraph').run(),
  },
  {
    title: 'Titre 1',
    description: 'Grand titre de section',
    icon: <IconH1 className="size-4" />,
    keywords: ['titre1', 'h1', 'heading', 'titre'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Titre 2',
    description: 'Sous-titre de section',
    icon: <IconH2 className="size-4" />,
    keywords: ['titre2', 'h2', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Titre 3',
    description: 'Petit titre',
    icon: <IconH3 className="size-4" />,
    keywords: ['titre3', 'h3', 'heading'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Liste à puces',
    description: 'Liste non ordonnée',
    icon: <IconList className="size-4" />,
    keywords: ['liste', 'puces', 'bullet', 'ul'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Liste numérotée',
    description: 'Liste ordonnée (1, 2, 3…)',
    icon: <IconListNumbers className="size-4" />,
    keywords: ['liste', 'numerotee', 'ordered', 'ol'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Liste de tâches',
    description: 'Cases à cocher',
    icon: <IconCheck className="size-4" />,
    keywords: ['todo', 'tache', 'task', 'check'],
    command: ({ editor, range }) => {
      // Le starter-kit n'inclut pas TaskList ; fallback sur bullet list
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Citation',
    description: 'Bloc de citation',
    icon: <IconQuote className="size-4" />,
    keywords: ['citation', 'quote', 'blockquote'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code',
    description: 'Bloc de code monospace',
    icon: <IconCode className="size-4" />,
    keywords: ['code', 'pre', 'snippet'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Séparateur',
    description: 'Trait horizontal',
    icon: <IconSeparator className="size-4" />,
    keywords: ['separateur', 'hr', 'divider', 'trait'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
]

export function filterSlashItems(query: string): SlashItem[] {
  if (!query) return SLASH_ITEMS
  const q = query.toLowerCase().trim()
  return SLASH_ITEMS.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.keywords.some(k => k.toLowerCase().includes(q))
  )
}
