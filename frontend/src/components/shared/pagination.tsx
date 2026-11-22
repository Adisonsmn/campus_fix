import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="max-sm:sr-only">Previous</span>
      </Button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <Button
          key={number}
          variant={number === page ? 'default' : 'secondary'}
          size="sm"
          aria-label={`Page ${number}`}
          aria-current={number === page ? 'page' : undefined}
          className={cn('min-w-9 px-0', number === page && 'pointer-events-none')}
          onClick={() => onPageChange(number)}
        >
          {number}
        </Button>
      ))}
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <span className="max-sm:sr-only">Next</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  )
}
