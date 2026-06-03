import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface SaveContextValue {
  formId: string | null
  saving: boolean
  registerForm: (id: string) => void
  unregisterForm: (id: string) => void
  setSaving: (b: boolean) => void
}

const SaveContext = createContext<SaveContextValue | null>(null)

export function SaveProvider({ children }: { children: ReactNode }) {
  const [formId, setFormId] = useState<string | null>(null)
  const [saving, setSavingState] = useState(false)

  const registerForm = useCallback((id: string) => {
    setFormId(id)
    setSavingState(false)
  }, [])

  const unregisterForm = useCallback((id: string) => {
    setFormId(prev => (prev === id ? null : prev))
  }, [])

  const setSaving = useCallback((b: boolean) => setSavingState(b), [])

  return (
    <SaveContext.Provider value={{ formId, saving, registerForm, unregisterForm, setSaving }}>
      {children}
    </SaveContext.Provider>
  )
}

export function useSaveContext(): SaveContextValue {
  const ctx = useContext(SaveContext)
  if (!ctx) {
    throw new Error('useSaveContext doit être utilisé à l\'intérieur d\'un <SaveProvider>')
  }
  return ctx
}

/**
 * Hook utilitaire à monter dans chaque page de réglages. Enregistre le formId
 * tant que la page est montée, et fournit un setter saving pré-câblé.
 */
export function useRegisterSaveForm(formId: string): {
  saving: boolean
  setSaving: (b: boolean) => void
} {
  const { registerForm, unregisterForm, saving, setSaving } = useSaveContext()

  useEffect(() => {
    registerForm(formId)
    return () => unregisterForm(formId)
  }, [formId, registerForm, unregisterForm])

  return { saving, setSaving }
}
