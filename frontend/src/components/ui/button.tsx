import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border-border-strong bg-secondary text-secondary-foreground hover:bg-ice/40',
        ice: 'bg-ice text-navy hover:bg-ice/80',
        ghost: 'bg-transparent text-navy hover:bg-ice/40',
        link: 'h-auto p-0 text-teal hover:underline',
      },
      size: {
        default: 'h-10 px-4 max-md:h-11',
        sm: 'h-8 px-3 text-[13px] max-md:h-11 max-md:px-4 max-md:text-sm',
        icon: 'size-10 max-md:size-11',
        'icon-sm': 'size-8 max-md:size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- shadcn convention: variants are shared with other components
export { Button, buttonVariants }
