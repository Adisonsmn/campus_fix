import { cn } from '@/lib/utils'

type BrandProps = {
  /** Hide the wordmark below the desktop breakpoint (icon rail). */
  collapsible?: boolean
  className?: string
}

export function Brand({ collapsible = false, className }: BrandProps) {
  return (
    <div className={cn('flex items-center gap-3 font-extrabold tracking-tight', className)}>
      <img src="/brand/emblem.png" alt="" className="h-8 w-auto shrink-0 lg:h-9" />
      <span className={cn('text-lg', collapsible && 'max-lg:sr-only')}>CampusFix</span>
    </div>
  )
}
