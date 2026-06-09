"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-2 rounded-xl text-base font-semibold whitespace-nowrap transition-all outline-none hover:bg-brand-canvas-soft/80 hover:text-brand-ink focus-visible:border-brand-primary focus-visible:ring-3 focus-visible:ring-brand-primary/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-brand-negative aria-invalid:ring-brand-negative/20 aria-pressed:bg-brand-primary aria-pressed:text-brand-on-primary data-[state=on]:bg-brand-primary data-[state=on]:text-brand-on-primary aria-pressed:hover:bg-brand-primary-active aria-pressed:hover:text-brand-on-primary data-[state=on]:hover:bg-brand-primary-active data-[state=on]:hover:text-brand-on-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-brand-canvas text-brand-ink border border-brand-canvas-soft hover:bg-brand-canvas-soft",
        outline: "border border-brand-canvas-soft bg-transparent hover:bg-brand-canvas-soft",
      },
      size: {
        default:
          "h-12 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        sm: "h-9 rounded-lg px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 rounded-2xl px-8 text-lg has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
