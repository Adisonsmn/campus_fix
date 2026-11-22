import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { FormErrorSummary } from '@/components/shared/form-error-summary'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ApiError } from '@/lib/api-client'
import { useCreateTechnician, useUpdateTechnician } from '@/features/technicians/hooks'
import {
  TECHNICIAN_FIELD_LABELS,
  technicianFormSchema,
  toTechnicianPayload,
  type TechnicianFormValues,
} from '@/features/technicians/schema'
import {
  AVAILABILITY_STATUSES,
  SPECIALIZATION_SUGGESTIONS,
  type Technician,
} from '@/features/technicians/types'

type TechnicianFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` creates a new technician. */
  technician: Technician | null
}

export function TechnicianFormSheet({ open, onOpenChange, technician }: TechnicianFormSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close form"
      >
        <TechnicianForm
          key={technician?.id ?? 'new'}
          technician={technician}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

function TechnicianForm({
  technician,
  onDone,
}: {
  technician: Technician | null
  onDone: () => void
}) {
  const isEdit = technician !== null
  const createTechnician = useCreateTechnician()
  const updateTechnician = useUpdateTechnician()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<TechnicianFormValues>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: {
      name: technician?.name ?? '',
      specialization: technician?.specialization ?? '',
      email: technician?.email ?? '',
      phone: technician?.phone ?? '',
      availability_status: technician?.availability_status ?? 'Available',
    },
  })

  const invalidFields = Object.keys(errors) as (keyof TechnicianFormValues)[]

  async function onSubmit(values: TechnicianFormValues) {
    setServerError(null)
    const payload = toTechnicianPayload(values)
    try {
      const saved = technician
        ? await updateTechnician.mutateAsync({ id: technician.id, payload })
        : await createTechnician.mutateAsync(payload)
      toast.success(isEdit ? 'Technician updated' : 'Technician created', {
        description: saved.name,
      })
      onDone()
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field in TECHNICIAN_FIELD_LABELS) {
          setError(field as keyof TechnicianFormValues, { type: 'server', message })
        }
      }
      setServerError(error.message)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>{isEdit ? 'Edit technician' : 'New technician'}</SheetTitle>
        <SheetDescription>Fields marked * are required.</SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-5 py-4">
        {serverError ? (
          <FormErrorSummary title="Could not save the technician" message={serverError} />
        ) : submitCount > 0 && invalidFields.length > 0 ? (
          <FormErrorSummary
            title={`${invalidFields.length} ${invalidFields.length === 1 ? 'field needs' : 'fields need'} your attention`}
            message={`${invalidFields.map((field) => TECHNICIAN_FIELD_LABELS[field]).join(', ')} must be corrected.`}
          />
        ) : null}

        <FormField id="technician-name" label="Name" required error={errors.name?.message}>
          <Input placeholder="e.g. Dewi Lestari" autoComplete="off" {...register('name')} />
        </FormField>

        <FormField
          id="technician-specialization"
          label="Specialization"
          required
          hint="Pick a suggestion or type your own."
          error={errors.specialization?.message}
        >
          <Input
            list="technician-specialization-options"
            placeholder="e.g. Electrical"
            autoComplete="off"
            {...register('specialization')}
          />
        </FormField>
        <datalist id="technician-specialization-options">
          {SPECIALIZATION_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>

        <FormField id="technician-email" label="Email" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="name@example.com"
            autoComplete="off"
            {...register('email')}
          />
        </FormField>

        <FormField id="technician-phone" label="Phone" error={errors.phone?.message}>
          <Input
            type="tel"
            placeholder="+62 812-0000-0000"
            autoComplete="off"
            {...register('phone')}
          />
        </FormField>

        <FormField
          id="technician-availability"
          label="Availability"
          required
          hint="Only available technicians can receive new assignments."
          error={errors.availability_status?.message}
        >
          <NativeSelect {...register('availability_status')}>
            {AVAILABILITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </SheetBody>

      <SheetFooter>
        <SheetClose asChild>
          <Button variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create technician'}
        </Button>
      </SheetFooter>
    </form>
  )
}
