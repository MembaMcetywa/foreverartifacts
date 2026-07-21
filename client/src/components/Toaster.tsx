import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      closeButton
      duration={4500}
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: 'fa-toast',
          title: 'fa-toast__title',
          description: 'fa-toast__description',
          closeButton: 'fa-toast__close',
          actionButton: 'fa-toast__action',
          cancelButton: 'fa-toast__cancel',
        },
      }}
    />
  )
}
