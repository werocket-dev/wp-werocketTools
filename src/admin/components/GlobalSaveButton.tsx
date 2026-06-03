import { Button } from '@/components/ui/button'
import { IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react'
import { useSaveContext } from '../context/SaveContext'

export function GlobalSaveButton() {
  const { formId, saving } = useSaveContext()

  if (!formId) return null

  return (
    <Button
      type="submit"
      form={formId}
      size="lg"
      disabled={saving}
      className="h-11 gap-2 text-[15px] px-5 shadow-md"
    >
      {saving
        ? <IconLoader2 className="size-[18px] animate-spin" />
        : <IconDeviceFloppy className="size-[18px]" />}
      {saving ? 'Enregistrement...' : 'Enregistrer'}
    </Button>
  )
}
