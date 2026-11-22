import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CircleCheck, Lock, Play, Save } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Breadcrumb } from '@/components/shared/breadcrumb'
import { ErrorState } from '@/components/shared/error-state'
import { FormErrorSummary } from '@/components/shared/form-error-summary'
import { FormField } from '@/components/shared/form-field'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api-client'
import { formatDate, formatReportId, parseRouteId } from '@/lib/format'
import { AssignmentStatusBadge } from '@/features/assignments/assignment-status-badge'
import { useAssignment, useUpdateAssignment } from '@/features/assignments/hooks'
import {
  COMPLETION_NOTES_MESSAGE,
  REPAIR_NOTES_LIMIT,
  repairNotesFormSchema,
  type RepairNotesFormValues,
} from '@/features/assignments/schema'
import type { Assignment, AssignmentUpdatePayload } from '@/features/assignments/types'
import { useFacilities } from '@/features/facilities/hooks'
import { PriorityLabel } from '@/features/reports/priority-label'
import { useReport } from '@/features/reports/hooks'
import { facilityLocation } from '@/features/reports/schema'
import { DEMO_TECHNICIAN_ID } from '@/features/roles/roles'

const TASKS_PATH = '/technician/assignments'

export function TechnicianAssignmentDetailPage() {
  const { id } = useParams()
  const assignmentId = parseRouteId(id)
  const assignmentQuery = useAssignment(assignmentId)
  const reportQuery = useReport(assignmentQuery.data?.report_id ?? null)
  const facilitiesQuery = useFacilities()

  if (assignmentId === null) return <NotFound message="This task link is not valid." />
  if (assignmentQuery.isError) return <NotFound message={assignmentQuery.error.message} />
  if (assignmentQuery.isPending || reportQuery.isPending) {
    if (reportQuery.isError) return <NotFound message={reportQuery.error.message} />
    return (
      <div role="status" aria-label="Loading task" className="flex flex-col gap-4">
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    )
  }
  if (reportQuery.isError) return <NotFound message={reportQuery.error.message} />

  const assignment = assignmentQuery.data
  if (assignment.technician_id !== DEMO_TECHNICIAN_ID) {
    return <NotFound message="This task is assigned to another technician." />
  }

  const report = reportQuery.data
  const facility = facilitiesQuery.data?.find((item) => item.id === report.facility_id)
  const finished = assignment.status === 'Completed'

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <Breadcrumb
            parents={[{ label: 'My Assignments', to: TASKS_PATH }]}
            current={formatReportId(report.id)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] leading-7 font-extrabold tracking-tight break-words md:text-2xl md:leading-8">
              {report.title}
            </h1>
            <AssignmentStatusBadge status={assignment.status} />
          </div>
          <p className="text-muted-foreground">
            {formatReportId(report.id)} · Assigned {formatDate(assignment.assigned_at)}
          </p>
        </div>
        <Button asChild variant="secondary" className="max-md:hidden">
          <Link to={TASKS_PATH}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to My Assignments
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Issue">
            <p className="break-words whitespace-pre-line">{report.description}</p>
          </Card>

          <Card title="Instructions">
            {assignment.instructions ? (
              <p className="break-words whitespace-pre-line">{assignment.instructions}</p>
            ) : (
              <p className="text-muted-foreground">No instructions were given for this task.</p>
            )}
          </Card>

          <Card title="Progress and repair notes">
            <ProgressForm key={`${assignment.id}-${assignment.status}`} assignment={assignment} />
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Task details">
            <dl className="grid grid-cols-[96px_1fr] items-start gap-x-3 gap-y-3">
              <dt className="text-[13px] text-muted-foreground">Task status</dt>
              <dd className="m-0">
                <AssignmentStatusBadge status={assignment.status} />
              </dd>
              <dt className="text-[13px] text-muted-foreground">Report</dt>
              <dd className="m-0">
                <StatusBadge status={report.status} />
              </dd>
              <dt className="text-[13px] text-muted-foreground">Facility</dt>
              <dd className="m-0 font-semibold break-words">
                {facility ? `${facility.name}, ${facilityLocation(facility)}` : '—'}
              </dd>
              <dt className="text-[13px] text-muted-foreground">Priority</dt>
              <dd className="m-0">
                <PriorityLabel priority={report.priority} />
              </dd>
              <dt className="text-[13px] text-muted-foreground">Reported by</dt>
              <dd className="m-0 font-semibold break-words">{report.reporter_name}</dd>
              <dt className="text-[13px] text-muted-foreground">Submitted</dt>
              <dd className="m-0 font-semibold">{formatDate(report.created_at)}</dd>
              <dt className="text-[13px] text-muted-foreground">Updated</dt>
              <dd className="m-0 font-semibold">{formatDate(assignment.updated_at)}</dd>
            </dl>
          </Card>

          {finished ? (
            <p className="flex items-start gap-3 rounded-xl border-[1.5px] border-navy bg-card p-4">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              This task is completed and can no longer be changed.
            </p>
          ) : null}

          <Button asChild variant="secondary" className="w-full md:hidden">
            <Link to={TASKS_PATH}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to My Assignments
            </Link>
          </Button>
        </div>
      </div>
    </>
  )
}

function ProgressForm({ assignment }: { assignment: Assignment }) {
  const updateAssignment = useUpdateAssignment()
  const [serverError, setServerError] = useState<string | null>(null)
  const finished = assignment.status === 'Completed'
  const savedNotes = assignment.repair_notes ?? ''

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RepairNotesFormValues>({
    resolver: zodResolver(repairNotesFormSchema),
    defaultValues: { repair_notes: savedNotes },
  })
  const notes = useWatch({ control, name: 'repair_notes' })

  async function send(payload: AssignmentUpdatePayload, success: string) {
    setServerError(null)
    try {
      await updateAssignment.mutateAsync({ id: assignment.id, payload })
      toast.success(success, { description: formatReportId(assignment.report_id) })
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      const notesError = error.fieldErrors.repair_notes
      if (notesError) setError('repair_notes', { type: 'server', message: notesError })
      setServerError(error.message)
    }
  }

  // Only changed notes are sent; a status change is always the next lifecycle step.
  const notesPayload = (values: RepairNotesFormValues): AssignmentUpdatePayload =>
    values.repair_notes === savedNotes ? {} : { repair_notes: values.repair_notes || null }

  const saveNotes = handleSubmit((values) => send(notesPayload(values), 'Notes saved'))
  const startWork = handleSubmit((values) =>
    send({ ...notesPayload(values), status: 'In Progress' }, 'Work started'),
  )
  const completeWork = handleSubmit(async (values) => {
    if (!values.repair_notes) {
      setError('repair_notes', { type: 'required', message: COMPLETION_NOTES_MESSAGE })
      return
    }
    await send({ ...notesPayload(values), status: 'Completed' }, 'Work completed')
  })

  const dirty = notes.trim() !== savedNotes

  return (
    <form noValidate onSubmit={(event) => void saveNotes(event)} className="flex flex-col gap-4">
      {serverError ? (
        <FormErrorSummary title="Could not update the task" message={serverError} />
      ) : null}

      <FormField
        id="repair-notes"
        label="Repair notes"
        hint={
          finished
            ? undefined
            : assignment.status === 'Assigned'
              ? 'Optional now. Notes are required to complete the work.'
              : 'Describe what was done. Required to complete the work.'
        }
        error={errors.repair_notes?.message}
        aside={finished ? undefined : `${notes.length} / ${REPAIR_NOTES_LIMIT}`}
      >
        <Textarea
          rows={6}
          readOnly={finished}
          placeholder={finished ? 'No repair notes were recorded.' : 'What did you check or fix?'}
          {...register('repair_notes')}
        />
      </FormField>

      {finished ? null : (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="submit" variant="secondary" disabled={isSubmitting || !dirty}>
            <Save className="size-4" aria-hidden="true" />
            Save notes
          </Button>
          {assignment.status === 'Assigned' ? (
            <Button type="button" disabled={isSubmitting} onClick={() => void startWork()}>
              <Play className="size-4" aria-hidden="true" />
              {isSubmitting ? 'Saving…' : 'Start work'}
            </Button>
          ) : (
            <Button type="button" disabled={isSubmitting} onClick={() => void completeWork()}>
              <CircleCheck className="size-4" aria-hidden="true" />
              {isSubmitting ? 'Saving…' : 'Complete work'}
            </Button>
          )}
        </div>
      )}
      {finished ? null : (
        <p className="text-[13px] text-muted-foreground">
          {assignment.status === 'Assigned'
            ? 'Starting work moves the report to In Progress.'
            : 'Completing the work resolves the report and makes this task read-only.'}
        </p>
      )}
    </form>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card md:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </section>
  )
}

function NotFound({ message }: { message: string }) {
  return (
    <>
      <ErrorState title="Task not found" message={message} />
      <Button asChild variant="secondary" className="self-start">
        <Link to={TASKS_PATH}>Back to My Assignments</Link>
      </Button>
    </>
  )
}
