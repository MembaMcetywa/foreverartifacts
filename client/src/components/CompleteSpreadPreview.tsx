import type { AlbumSpreadPosition } from '../api/albums'
import {
  getPreviewSlotStyle
} from '../utils/review-spreads'
import type {PreviewSlot} from '../utils/review-spreads';

interface CompleteSpreadPreviewProps {
  previewSlots: PreviewSlot[]
  spreadPosition: AlbumSpreadPosition
}

export function CompleteSpreadPreview({
  previewSlots,
  spreadPosition,
}: CompleteSpreadPreviewProps) {
  return (
    <div className="complete-spread-preview">
      <div className="complete-spread-preview__page" />
      <div className="complete-spread-preview__page" />

      {spreadPosition.spread && (
        <div
          className="complete-spread-preview__slots"
          data-layout={spreadPosition.spread.templateId}
        >
          {spreadPosition.spread.slots.map((slot) => (
            <div
              key={slot.id}
              className="complete-spread-preview__slot"
              style={getPreviewSlotStyle(previewSlots, slot.slotIndex)}
            >
              <img
                src={slot.asset.previewUrl}
                alt={`Photograph in spread ${spreadPosition.position}, slot ${slot.slotIndex + 1}`}
              />
            </div>
          ))}
        </div>
      )}

      {!spreadPosition.spread && (
        <p className="complete-spread-preview__empty">Empty spread</p>
      )}
    </div>
  )
}
