import { cloneElement, type ReactElement } from 'react'
import { CircleAlert } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type ControlProps = {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  'aria-required'?: boolean
}

type FormFieldProps = {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  /** Right-aligned helper such as a character counter. */
  aside?: string
  className?: string
  children: ReactElement<ControlProps>
}

/** The one form field system: label, required marker, control, hint and inline error. */
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  aside,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1">
            *
          </span>
        ) : null}
      </Label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
        'aria-required': required ? true : undefined,
      })}
      {error || hint || aside ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {error ? (
              <p id={errorId} className="flex items-start gap-1.5 text-[13px] font-semibold">
                <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}
            {hint ? (
              <p id={hintId} className="text-[13px] text-muted-foreground">
                {hint}
              </p>
            ) : null}
          </div>
          {aside ? <span className="text-[13px] text-muted-foreground">{aside}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
