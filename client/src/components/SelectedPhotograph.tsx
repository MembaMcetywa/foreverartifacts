import { Trash2 } from 'lucide-react'

import { Button } from './Button'

interface SelectedPhotographProps {
  name: string
  previewUrl: string
  status: 'failed' | 'selected' | 'uploaded' | 'uploading'
  onRemove: () => void
}

export function SelectedPhotograph({
  name,
  previewUrl,
  status,
  onRemove,
}: SelectedPhotographProps) {
  const statusLabel = {
    failed: 'Could not upload',
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
        <span>{statusLabel}</span>
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
      </div>
    </article>
  )
}
