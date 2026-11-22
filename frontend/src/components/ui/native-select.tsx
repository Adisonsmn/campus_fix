import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

function NativeSelect({
  className,
  wrapperClassName,
  children,
  ...props
}: React.ComponentProps<'select'> & { wrapperClassName?: string }) {
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <select
        className={cn(
          'h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-input bg-card pr-9 pl-3 text-sm text-foreground transition-colors focus-visible:border-teal focus-visible:ring-1 focus-visible:ring-teal focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-navy aria-invalid:bg-ice/35 aria-invalid:ring-1 aria-invalid:ring-navy max-md:h-11',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}

export { NativeSelect }
