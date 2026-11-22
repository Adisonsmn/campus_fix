import { Toaster as Sonner, type ToasterProps } from 'sonner'

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            '!bg-navy !text-white !border-0 !rounded-[10px] !shadow-popover !font-sans !font-semibold',
          description: '!text-white/80 !font-normal',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
