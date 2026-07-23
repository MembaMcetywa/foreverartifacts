import { Trash2 } from 'lucide-react'

import { Button } from './Button'
import { Spinner } from './Spinner'

interface SelectedPhotographProps {
  name: string
  errorMessage?: string
  previewUrl: string
  status: 'failed' | 'processing' | 'selected' | 'uploaded' | 'uploading'
  onRemove: () => void
}

export function SelectedPhotograph({
  name,
  errorMessage,
  previewUrl,
  status,
  onRemove,
}: SelectedPhotographProps) {
  const statusLabel = {
    failed: 'Could not upload',
    processing: 'Processing',
    selected: 'Ready to upload',
    uploaded: 'Uploaded',
    uploading: 'Uploading',
  }[status]

  return (
    <article className="selected-photograph">
      <img src={previewUrl} alt={name} />
      <p className="selected-photograph__name" title={name}>
        {name}
      </p>
      <div className="selected-photograph__meta">
        <div className="selected-photograph__state">
          {status === 'failed' && errorMessage ? (
            <p className="selected-photograph__error">{errorMessage}</p>
          ) : (
            <span className="selected-photograph__status">
              {(status === 'processing' || status === 'uploading') && (
                <Spinner size="sm" />
              )}
              {statusLabel}
            </span>
          )}
        </div>
        <div className="selected-photograph__action">
          {(status === 'selected' || status === 'failed') && (
            <Button
              type="button"
              variant="secondary"
              aria-label={`Remove ${name}`}
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" size={20} strokeWidth={1.75} />
            </Button>
          )}
          {(status === 'processing' || status === 'uploading') && (
            <span className="selected-photograph__action-spacer" />
          )}
        </div>
      </div>
    </article>
  )
}
