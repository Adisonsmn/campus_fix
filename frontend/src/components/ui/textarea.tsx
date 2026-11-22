import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm leading-5 text-foreground transition-colors placeholder:text-navy/60 focus-visible:border-teal focus-visible:ring-1 focus-visible:ring-teal focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-navy aria-invalid:bg-ice/35 aria-invalid:ring-1 aria-invalid:ring-navy',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
