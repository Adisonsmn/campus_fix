import { useState, type FormEvent } from 'react'
import { ArrowRight, ClipboardCheck, Info, ShieldCheck, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Brand } from '@/components/layout/brand'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ROLE_LIST, ROLES, type Role } from '@/features/roles/roles'

const ROLE_ICONS = {
  student: UserRound,
  admin: ShieldCheck,
  technician: ClipboardCheck,
} as const

// Page 01 has no design reference: built from design tokens (provisional, unverified).
export function RoleSelectionPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Role>('student')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    navigate(ROLES[selected].basePath)
  }

  return (
    <main className="mx-auto grid min-h-svh w-full max-w-[1264px] items-center gap-8 p-4 md:p-6 lg:grid-cols-2 lg:gap-16 lg:p-8">
      <section className="flex flex-col gap-4">
        <Brand />
        <h1 className="text-[28px] leading-9 font-extrabold tracking-tight md:text-4xl md:leading-[44px]">
          Campus facility maintenance, in one place
        </h1>
        <p className="max-w-md text-base leading-6 text-muted-foreground">
          Students and staff report broken facilities, administrators assign technicians, and
          technicians record repair progress.
        </p>
      </section>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-xl border bg-card p-4 shadow-card md:p-6"
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-base font-bold">Choose a demo role</legend>
          {ROLE_LIST.map((config) => {
            const Icon = ROLE_ICONS[config.role]
            const checked = selected === config.role
            return (
              <label
                key={config.role}
                className={cn(
                  'relative flex min-h-[72px] cursor-pointer items-center gap-4 rounded-[10px] border p-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                  checked
                    ? 'border-2 border-teal bg-ice p-[13px]'
                    : 'border-border-strong bg-card hover:bg-ice/40',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={config.role}
                  checked={checked}
                  onChange={() => setSelected(config.role)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-[10px]',
                    checked ? 'bg-card' : 'bg-ice',
                  )}
                >
                  <Icon className="size-[22px]" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-bold">{config.label}</span>
                  <span className="text-[13px] leading-[18px] text-muted-foreground">
                    {config.description}
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <div className="flex items-start gap-3 rounded-[10px] bg-ice px-4 py-3.5">
          <Info className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
          <p className="text-[13px] leading-[18px]">
            <strong>Demo access only.</strong> Choosing a role does not sign you in and is not
            authentication. All data is fictional and resets when the server restarts.
          </p>
        </div>

        <Button type="submit" className="w-full md:w-auto md:self-end">
          Continue
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </Button>
      </form>
    </main>
  )
}
