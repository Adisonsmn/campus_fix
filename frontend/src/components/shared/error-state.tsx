import { CircleAlert, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
  /** Smaller padding for use inside sheets and cards. */
  compact?: boolean
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border-2 border-navy bg-card px-6 text-center',
        compact ? 'py-6' : 'py-12',
      )}
    >
      <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-ice text-navy">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base font-bold">{title}</h2>
      <p className="max-w-md text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </section>
  )
}
