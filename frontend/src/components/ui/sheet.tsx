import * as React from 'react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root {...props} />
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger {...props} />
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

type SheetContentProps = React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'left' | 'right' | 'bottom'
  closeLabel?: string
  /** Omit the built-in close button when another control already toggles the sheet. */
  hideClose?: boolean
  overlayClassName?: string
}

const sides = {
  left: 'inset-y-0 left-0 h-full w-72 max-w-[85vw] border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
  right:
    'inset-y-0 right-0 h-full w-full sm:w-[480px] border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
  bottom:
    'inset-x-0 bottom-0 max-h-[90svh] rounded-t-2xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
}

function SheetContent({
  className,
  children,
  side = 'right',
  closeLabel = 'Close',
  hideClose = false,
  overlayClassName,
  ...props
}: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay className={overlayClassName} />
      <SheetPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 bg-card shadow-popover duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in',
          sides[side],
          className,
        )}
        {...props}
      >
        {side === 'bottom' ? (
          <div
            aria-hidden="true"
            className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-navy/25"
          />
        ) : null}
        {children}
        {hideClose ? null : (
          <SheetPrimitive.Close
            aria-label={closeLabel}
            className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-lg text-navy hover:bg-ice/40 max-md:size-11"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-1 px-4 pt-4 pr-16 md:px-6 md:pt-6', className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex-1 overflow-y-auto px-4 md:px-6', className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-3 border-t px-4 py-4 md:flex-row md:items-center md:justify-end md:px-6',
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn('text-lg leading-[26px] font-bold text-foreground', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn('text-[13px] text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
