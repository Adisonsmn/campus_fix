import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type SectionCardProps = {
  title: string
  /** Optional "View all" style link shown beside the title. */
  link?: { to: string; label: string }
  children: ReactNode
}

/** White card with a heading row, used for dashboard sections. */
export function SectionCard({ title, link, children }: SectionCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-card md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold md:text-lg">{title}</h2>
        {link ? (
          <Link
            to={link.to}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-teal hover:underline md:text-sm"
          >
            {link.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}
