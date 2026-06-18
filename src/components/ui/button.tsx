import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/30",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-white/90",
        vivid: "bg-white text-black font-semibold hover:bg-white/90",
        destructive: "bg-rose-500/90 text-white hover:bg-rose-500",
        outline: "border border-white/15 bg-transparent text-white hover:bg-white/5",
        secondary: "bg-white/10 text-white hover:bg-white/15",
        ghost: "bg-transparent text-white hover:bg-white/5",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-6 py-2 has-[>svg]:px-5",
        xs: "h-6 gap-1 px-3 text-xs has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-11 px-8 has-[>svg]:px-6",
        icon: "size-9 px-0",
        "icon-xs": "size-6 px-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 px-0",
        "icon-lg": "size-10 px-0",
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
