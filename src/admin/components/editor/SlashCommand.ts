import { Extension, type Editor, type Range } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import type { ReactNode } from 'react'

export interface SlashItem {
  title: string
  description: string
  icon: ReactNode
  keywords: string[]
  command: (props: { editor: Editor; range: Range }) => void
}

/**
 * Extension TipTap : tape "/" pour ouvrir un menu Notion-like de blocs.
 * Le rendu de la liste est délégué à un handler React (paramètre `render`)
 * qui reçoit position + items filtrés + sélecteur.
 */
export const SlashCommand = Extension.create<{
  suggestion: Partial<SuggestionOptions<SlashItem>>
}>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
