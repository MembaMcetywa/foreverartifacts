import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link } from '@tanstack/react-router'

import type { AlbumSpreadPosition } from '../api/albums'
import {
  getPreviewSlotStyle,
  getSpreadPositionId
} from '../utils/review-spreads'
import type {PreviewSlot} from '../utils/review-spreads';

interface ReviewSpreadProps {
  albumId: string
  index: number
  previewSlots: PreviewSlot[]
  spreadPosition: AlbumSpreadPosition
}

export function ReviewSpread({
  albumId,
  index,
  previewSlots,
  spreadPosition,
}: ReviewSpreadProps) {
  const sortable = useSortable({
    id: getSpreadPositionId(spreadPosition),
    disabled: !spreadPosition.spread,
  })
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  }

  return (
    <article
      ref={sortable.setNodeRef}
      className="review-spread"
      data-dragging={sortable.isDragging || undefined}
      style={style}
      {...sortable.attributes}
      {...sortable.listeners}
    >
      <header className="review-spread__header">
        <p className="review-spread__number">
          Spread {String(index + 1).padStart(2, '0')}
        </p>
        {spreadPosition.spread && (
          <Link
            to="/albums/$albumId/arrange"
            params={{ albumId }}
            search={{
              spread: index + 1,
              returnTo: 'review',
            }}
            aria-label={`Edit spread ${index + 1}`}
          >
            <span>Edit</span>
          </Link>
        )}
      </header>

      <div className="review-spread__surface">
        <div className="review-spread__page" />
        <div className="review-spread__page" />

        {spreadPosition.spread && (
          <div
            className="review-spread__slots"
            data-layout={spreadPosition.spread.templateId}
          >
            {spreadPosition.spread.slots.map((slot) => (
              <div
                key={slot.id}
                className="review-spread__slot"
                data-slot={slot.slotIndex}
                style={getPreviewSlotStyle(previewSlots, slot.slotIndex)}
              >
                <img
                  src={slot.asset.previewUrl}
                  alt={`Photograph in spread ${index + 1}, slot ${slot.slotIndex + 1}`}
                />
              </div>
            ))}
          </div>
        )}

        {!spreadPosition.spread && (
          <p className="review-spread__empty">Empty spread</p>
        )}
      </div>

      {spreadPosition.spread && (
        <p className="review-spread__meta">
          {spreadPosition.spread.templateId.replaceAll('_', ' ')}
        </p>
      )}
    </article>
  )
}
