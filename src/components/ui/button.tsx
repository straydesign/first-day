import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "clip-btn-a inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-geo hover-geo",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:brightness-110 hover:saturate-150",
        vivid: "bg-[#FFD38A] text-[#0F1B3A] font-bold shadow-lg hover:brightness-110 hover:saturate-150",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-white/10 bg-transparent hover:bg-white/10 hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-white/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline !clip-path-none",
      },
      size: {
        default: "h-9 px-8 py-2 has-[>svg]:px-6",
        xs: "h-6 gap-1 clip-btn-b px-4 text-xs has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 clip-btn-b gap-1.5 px-6 has-[>svg]:px-4",
        lg: "h-10 clip-btn-a px-10 has-[>svg]:px-6",
        icon: "size-9 clip-diamond px-0",
        "icon-xs": "size-6 clip-diamond px-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 clip-diamond px-0",
        "icon-lg": "size-10 clip-diamond px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
