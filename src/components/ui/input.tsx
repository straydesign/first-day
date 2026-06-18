import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "clip-input file:text-foreground placeholder:text-white/60 selection:bg-primary selection:text-primary-foreground ring-2 ring-white/30 h-9 w-full min-w-0 rounded-none bg-black px-5 py-1 text-base text-white shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-geo",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
