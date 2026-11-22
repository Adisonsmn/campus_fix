import { Flag } from 'lucide-react'
import { useWatch, type UseFormReturn } from 'react-hook-form'

import { FormErrorSummary } from '@/components/shared/form-error-summary'
import { FormField } from '@/components/shared/form-field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Facility } from '@/features/facilities/types'
import {
  DESCRIPTION_LIMIT,
  REPORT_FIELD_LABELS,
  type ReportFormValues,
} from '@/features/reports/schema'
import { PRIORITIES, type Priority } from '@/features/reports/types'

const PRIORITY_HINTS: Record<Priority, string> = {
  Low: 'Can wait a few days.',
  Medium: 'Affects how the space is used.',
  High: 'Safety risk or blocks a class.',
}

type ReportFormFieldsProps = {
  form: UseFormReturn<ReportFormValues>
  facilities: Facility[]
  serverError: string | null
  invalidFields: (keyof ReportFormValues)[]
  /** Prefix that keeps element ids unique when several forms exist. */
  idPrefix: string
  reporterHint?: string
}

export function ReportFormFields({
  form,
  facilities,
  serverError,
  invalidFields,
  idPrefix,
  reporterHint,
}: ReportFormFieldsProps) {
  const {
    register,
    control,
    formState: { errors, submitCount },
  } = form
  const descriptionLength = useWatch({ control, name: 'description' }).length
  const priority = useWatch({ control, name: 'priority' })

  return (
    <>
      {serverError ? (
        <FormErrorSummary title="Could not save the report" message={serverError} />
      ) : submitCount > 0 && invalidFields.length > 0 ? (
        <FormErrorSummary
          title={`${invalidFields.length} ${invalidFields.length === 1 ? 'field needs' : 'fields need'} your attention`}
          message={`${invalidFields.map((field) => REPORT_FIELD_LABELS[field]).join(', ')} must be corrected.`}
        />
      ) : null}

      <FormField
        id={`${idPrefix}-title`}
        label="Issue title"
        required
        error={errors.title?.message}
      >
        <Input placeholder="e.g. AC not cooling" autoComplete="off" {...register('title')} />
      </FormField>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField
          id={`${idPrefix}-facility`}
          label="Facility"
          required
          error={errors.facility_id?.message}
        >
          <NativeSelect {...register('facility_id')}>
            <option value="">Select a facility</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} — {facility.building}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          id={`${idPrefix}-reporter`}
          label="Reporter name"
          required
          hint={reporterHint}
          error={errors.reporter_name?.message}
        >
          <Input autoComplete="off" {...register('reporter_name')} />
        </FormField>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">Priority</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {PRIORITIES.map((option) => (
            <label
              key={option}
              className={cn(
                'flex min-h-14 cursor-pointer flex-col gap-0.5 rounded-lg border bg-card p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal',
                priority === option && 'border-teal bg-ice/45 ring-1 ring-teal',
              )}
            >
              <input type="radio" value={option} className="sr-only" {...register('priority')} />
              <span className="flex items-center gap-2 font-semibold">
                <Flag
                  className={cn('size-4', option === 'High' && 'fill-current')}
                  aria-hidden="true"
                />
                {option}
              </span>
              <span className="text-[13px] text-muted-foreground">{PRIORITY_HINTS[option]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormField
        id={`${idPrefix}-description`}
        label="Issue description"
        required
        error={errors.description?.message}
        aside={`${descriptionLength} / ${DESCRIPTION_LIMIT}`}
      >
        <Textarea rows={5} {...register('description')} />
      </FormField>
    </>
  )
}
