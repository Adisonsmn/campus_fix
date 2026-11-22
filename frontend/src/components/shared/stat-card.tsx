import type { LucideIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: number
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card md:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-ice text-navy">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[28px] leading-8 font-extrabold">{value}</p>
        <p className="text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function StatCardSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <Skeleton key={index} className="h-[90px] rounded-xl" />
  ))
}
