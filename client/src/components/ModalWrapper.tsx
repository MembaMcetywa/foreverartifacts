import { CircleX } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'

export interface ModalWrapperProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function ModalWrapper({
  open,
  title,
  onClose,
  children,
}: ModalWrapperProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && open && !dialog.open) {
      dialog.showModal()
    }

    if (dialog && !open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function closeOnBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-wrapper"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
      onClick={closeOnBackdropClick}
    >
      <div className="modal-wrapper__header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          autoFocus
          aria-label={`Close ${title}`}
          onClick={onClose}
        >
          <CircleX aria-hidden="true" size={24} strokeWidth={1.75} />
        </button>
      </div>
      <div className="modal-wrapper__body">{children}</div>
    </dialog>
  )
}
