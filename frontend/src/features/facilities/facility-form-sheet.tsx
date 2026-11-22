import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
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
import { Textarea } from '@/components/ui/textarea'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ApiError } from '@/lib/api-client'
import { useCreateFacility, useUpdateFacility } from '@/features/facilities/hooks'
import {
  FACILITY_FIELD_LABELS,
  facilityFormSchema,
  toFacilityPayload,
  type FacilityFormValues,
} from '@/features/facilities/schema'
import { FACILITY_TYPES, type Facility } from '@/features/facilities/types'

const DESCRIPTION_LIMIT = 500

type FacilityFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `null` creates a new facility. */
  facility: Facility | null
}

export function FacilityFormSheet({ open, onOpenChange, facility }: FacilityFormSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close form"
      >
        <FacilityForm
          key={facility?.id ?? 'new'}
          facility={facility}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}

function FacilityForm({ facility, onDone }: { facility: Facility | null; onDone: () => void }) {
  const isEdit = facility !== null
  const createFacility = useCreateFacility()
  const updateFacility = useUpdateFacility()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      name: facility?.name ?? '',
      building: facility?.building ?? '',
      floor: facility?.floor ?? '',
      type: facility?.type ?? '',
      description: facility?.description ?? '',
    },
  })

  const typeOptions: string[] =
    facility && !FACILITY_TYPES.some((type) => type === facility.type)
      ? [facility.type, ...FACILITY_TYPES]
      : [...FACILITY_TYPES]
  const descriptionLength = useWatch({ control, name: 'description' }).length
  const invalidFields = Object.keys(errors) as (keyof FacilityFormValues)[]

  async function onSubmit(values: FacilityFormValues) {
    setServerError(null)
    const payload = toFacilityPayload(values)
    try {
      const saved = facility
        ? await updateFacility.mutateAsync({ id: facility.id, payload })
        : await createFacility.mutateAsync(payload)
      toast.success(isEdit ? 'Facility updated' : 'Facility created', {
        description: saved.name,
      })
      onDone()
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field in FACILITY_FIELD_LABELS) {
          setError(field as keyof FacilityFormValues, {
            type: 'server',
            message,
          })
        }
      }
      setServerError(error.message)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>{isEdit ? 'Edit facility' : 'New facility'}</SheetTitle>
        <SheetDescription>Fields marked * are required.</SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-5 py-4">
        {serverError ? (
          <FormErrorSummary title="Could not save the facility" message={serverError} />
        ) : submitCount > 0 && invalidFields.length > 0 ? (
          <FormErrorSummary
            title={`${invalidFields.length} ${invalidFields.length === 1 ? 'field needs' : 'fields need'} your attention`}
            message={`${invalidFields.map((field) => FACILITY_FIELD_LABELS[field]).join(', ')} must be corrected.`}
          />
        ) : null}

        <FormField id="facility-name" label="Name" required error={errors.name?.message}>
          <Input placeholder="e.g. Lab B103" autoComplete="off" {...register('name')} />
        </FormField>

        <FormField
          id="facility-building"
          label="Building"
          required
          error={errors.building?.message}
        >
          <Input
            placeholder="e.g. Faculty of Engineering"
            autoComplete="off"
            {...register('building')}
          />
        </FormField>

        <FormField
          id="facility-floor"
          label="Floor"
          hint="Optional location detail, such as Floor 2."
          error={errors.floor?.message}
        >
          <Input autoComplete="off" {...register('floor')} />
        </FormField>

        <FormField id="facility-type" label="Type" required error={errors.type?.message}>
          <NativeSelect {...register('type')}>
            <option value="">Select a type</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          id="facility-description"
          label="Description"
          error={errors.description?.message}
          aside={`${descriptionLength} / ${DESCRIPTION_LIMIT}`}
        >
          <Textarea rows={4} {...register('description')} />
        </FormField>
      </SheetBody>

      <SheetFooter>
        <SheetClose asChild>
          <Button variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create facility'}
        </Button>
      </SheetFooter>
    </form>
  )
}
