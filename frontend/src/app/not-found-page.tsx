import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[1264px] items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The page you are looking for does not exist."
          actions={
            <Button asChild>
              <Link to="/">Go to role selection</Link>
            </Button>
          }
        />
      </div>
    </main>
  )
}
