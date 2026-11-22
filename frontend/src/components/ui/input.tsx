import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full min-w-0 appearance-none rounded-lg border border-input bg-card px-3 text-sm text-foreground transition-colors placeholder:text-navy/60 focus-visible:border-teal focus-visible:ring-1 focus-visible:ring-teal focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-navy aria-invalid:bg-ice/35 aria-invalid:ring-1 aria-invalid:ring-navy max-md:h-11',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
