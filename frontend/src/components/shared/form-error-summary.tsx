import { CircleAlert } from 'lucide-react'

export function FormErrorSummary({ title, message }: { title: string; message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[10px] border-[1.5px] border-navy bg-card px-4 py-3.5"
    >
      <CircleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
      <div className="text-[13px] leading-[18px]">
        <p className="font-bold">{title}</p>
        <p>{message}</p>
      </div>
    </div>
  )
}
