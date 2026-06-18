import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "clip-tile-c ring-2 ring-white/30 placeholder:text-white/60 aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-none bg-black text-white px-5 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-geo",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
