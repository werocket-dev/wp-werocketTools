import * as React from "react"
import { cn } from "@/lib/utils"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-[18px] shrink-0 rounded-full border-[1.5px] border-input bg-card outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-checked:border-[5px] data-checked:border-primary",
        className
      )}
      {...props}
    >
      {/* État coché rendu par la bordure épaisse : pas de point intérieur. */}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
