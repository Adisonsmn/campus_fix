import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { FormErrorSummary } from '@/components/shared/form-error-summary'
import { FormField } from '@/components/shared/form-field'
import { Button } from '@/components/ui/button'
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
import { formatReportId } from '@/lib/format'
import {
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
} from '@/features/assignments/hooks'
import {
  ASSIGNMENT_FIELD_LABELS,
  INSTRUCTIONS_LIMIT,
  assignmentDefaults,
  assignmentFormSchema,
  type AssignmentFormValues,
} from '@/features/assignments/schema'
import type { Assignment, AssignmentUpdatePayload } from '@/features/assignments/types'
import { useReports } from '@/features/reports/hooks'
import { useTechnicians } from '@/features/technicians/hooks'

/** What the sheet is doing. `assignment` null creates; `presetReportId` pre-selects a report. */
export type AssignmentFormTarget = {
  assignment: Assignment | null
  presetReportId: number | null
}

type AssignmentFormSheetProps = {
  target: AssignmentFormTarget | null
  onOpenChange: (open: boolean) => void
}

export function AssignmentFormSheet({ target, onOpenChange }: AssignmentFormSheetProps) {
  const isTabletUp = useMediaQuery('(min-width: 48rem)')

  return (
    <Sheet open={target !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTabletUp ? 'right' : 'bottom'}
        className="gap-0"
        closeLabel="Close form"
      >
        {target ? (
          <AssignmentForm
            key={`${target.assignment?.id ?? 'new'}-${target.presetReportId ?? 'none'}`}
            target={target}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function AssignmentForm({ target, onDone }: { target: AssignmentFormTarget; onDone: () => void }) {
  const { assignment, presetReportId } = target
  const isEdit = assignment !== null
  const reportLocked = isEdit || presetReportId !== null

  const reportsQuery = useReports()
  const techniciansQuery = useTechnicians()
  const assignmentsQuery = useAssignments()
  const createAssignment = useCreateAssignment()
  const updateAssignment = useUpdateAssignment()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: assignmentDefaults(assignment, presetReportId),
  })
  const reportId = useWatch({ control, name: 'report_id' })
  const instructionsLength = useWatch({ control, name: 'instructions' }).length
  const invalidFields = Object.keys(errors) as (keyof AssignmentFormValues)[]

  const assignableReports = useMemo(() => {
    const assigned = new Set((assignmentsQuery.data ?? []).map((item) => item.report_id))
    return (reportsQuery.data ?? []).filter(
      (report) => report.status === 'Open' && !assigned.has(report.id),
    )
  }, [reportsQuery.data, assignmentsQuery.data])

  const technicianOptions = useMemo(
    () =>
      (techniciansQuery.data ?? []).filter(
        (technician) =>
          technician.availability_status === 'Available' ||
          technician.id === assignment?.technician_id,
      ),
    [techniciansQuery.data, assignment?.technician_id],
  )

  const lockedReport = reportsQuery.data?.find((report) => report.id === Number(reportId))
  const loading = reportsQuery.isPending || techniciansQuery.isPending || assignmentsQuery.isPending
  const loadError = reportsQuery.error ?? techniciansQuery.error ?? assignmentsQuery.error
  const noTechnicians = !loading && !loadError && technicianOptions.length === 0

  async function onSubmit(values: AssignmentFormValues) {
    setServerError(null)
    const technicianId = Number(values.technician_id)
    const instructions = values.instructions || null

    try {
      let saved: Assignment
      if (assignment) {
        const payload: AssignmentUpdatePayload = {}
        if (technicianId !== assignment.technician_id) payload.technician_id = technicianId
        if (instructions !== assignment.instructions) payload.instructions = instructions
        if (Object.keys(payload).length === 0) {
          toast.info('No changes to save')
          onDone()
          return
        }
        saved = await updateAssignment.mutateAsync({ id: assignment.id, payload })
      } else {
        saved = await createAssignment.mutateAsync({
          report_id: Number(values.report_id),
          technician_id: technicianId,
          instructions,
        })
      }
      toast.success(isEdit ? 'Assignment updated' : 'Technician assigned', {
        description: formatReportId(saved.report_id),
      })
      onDone()
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field in ASSIGNMENT_FIELD_LABELS) {
          setError(field as keyof AssignmentFormValues, { type: 'server', message })
        }
      }
      setServerError(error.message)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>
          {isEdit
            ? `Edit assignment #${assignment.id}`
            : presetReportId
              ? 'Assign technician'
              : 'New assignment'}
        </SheetTitle>
        <SheetDescription>
          {isEdit
            ? 'The technician and instructions can change only while the work is Assigned.'
            : 'Only Open reports and Available technicians can be assigned. Fields marked * are required.'}
        </SheetDescription>
      </SheetHeader>

      <SheetBody className="flex flex-col gap-5 py-4">
        {loadError ? (
          <FormErrorSummary title="Could not load the form data" message={loadError.message} />
        ) : serverError ? (
          <FormErrorSummary title="Could not save the assignment" message={serverError} />
        ) : submitCount > 0 && invalidFields.length > 0 ? (
          <FormErrorSummary
            title={`${invalidFields.length} ${invalidFields.length === 1 ? 'field needs' : 'fields need'} your attention`}
            message={`${invalidFields.map((field) => ASSIGNMENT_FIELD_LABELS[field]).join(', ')} must be corrected.`}
          />
        ) : null}

        {reportLocked ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold">Report</p>
            <p className="rounded-lg border bg-canvas p-3">
              <span className="font-semibold">{lockedReport?.title ?? '…'}</span>
              <span className="block text-[13px] text-muted-foreground">
                {formatReportId(Number(reportId))}
              </span>
            </p>
          </div>
        ) : (
          <FormField
            id="assignment-report"
            label="Report"
            required
            hint={
              !loading && assignableReports.length === 0
                ? 'There are no Open, unassigned reports.'
                : undefined
            }
            error={errors.report_id?.message}
          >
            <NativeSelect {...register('report_id')} disabled={loading}>
              <option value="">Select an open report</option>
              {assignableReports.map((report) => (
                <option key={report.id} value={report.id}>
                  {formatReportId(report.id)} — {report.title}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        )}

        <FormField
          id="assignment-technician"
          label="Technician"
          required
          hint={
            noTechnicians
              ? 'No technician is Available. Set one to Available on the Technicians page.'
              : 'Only Available technicians are listed.'
          }
          error={errors.technician_id?.message}
        >
          <NativeSelect {...register('technician_id')} disabled={loading}>
            <option value="">Select a technician</option>
            {technicianOptions.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name} — {technician.specialization}
                {technician.availability_status === 'Unavailable' ? ' (unavailable)' : ''}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          id="assignment-instructions"
          label="Instructions"
          error={errors.instructions?.message}
          aside={`${instructionsLength} / ${INSTRUCTIONS_LIMIT}`}
        >
          <Textarea
            rows={4}
            placeholder="Optional guidance for the technician"
            {...register('instructions')}
          />
        </FormField>
      </SheetBody>

      <SheetFooter>
        <SheetClose asChild>
          <Button variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
        </SheetClose>
        <Button
          type="submit"
          disabled={isSubmitting || loading || Boolean(loadError) || noTechnicians}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Assign technician'}
        </Button>
      </SheetFooter>
    </form>
  )
}
