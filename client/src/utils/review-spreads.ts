import type { CSSProperties } from 'react'

import type { AlbumSpreadPosition } from '../api/albums'
import type { LayoutTemplate } from '../api/templates'

export type PreviewSlot = LayoutTemplate['preview']['slots'][number]

export function getAlbumTitle(albumName: string | undefined, albumId: string) {
  return albumName && albumName !== albumId ? albumName : 'Untitled'
}

export function countCompletedSpreads(
  spreadPositions: AlbumSpreadPosition[] | undefined,
) {
  return (
    spreadPositions?.filter(
      (spreadPosition) => spreadPosition.status === 'complete',
    ).length ?? 0
  )
}

export function getFirstEmptyPosition(
  spreadPositions: AlbumSpreadPosition[] | undefined,
) {
  return spreadPositions?.find(
    (spreadPosition) => spreadPosition.status === 'empty',
  )?.position
}

export function getSpreadPositionId(spreadPosition: AlbumSpreadPosition) {
  return spreadPosition.spread?.id ?? `empty-${spreadPosition.position}`
}

export function getPreviewSlotsForSpread(
  templates: LayoutTemplate[] | undefined,
  spreadPosition: AlbumSpreadPosition,
) {
  return (
    templates?.find(
      (template) => template.id === spreadPosition.spread?.templateId,
    )?.preview.slots ?? []
  )
}

export function getPreviewSlotStyle(
  previewSlots: PreviewSlot[],
  slotIndex: number,
): CSSProperties | undefined {
  const previewSlot = previewSlots.find((slot) => slot.slotIndex === slotIndex)

  if (!previewSlot) {
    return undefined
  }

  return {
    left: `${previewSlot.rect.left}%`,
    top: `${previewSlot.rect.top}%`,
    width: `${previewSlot.rect.width}%`,
    height: `${previewSlot.rect.height}%`,
  }
}

export function toSpreadOrderPositions(
  spreadPositions: AlbumSpreadPosition[],
) {
  return spreadPositions.flatMap((spreadPosition, index) =>
    spreadPosition.spread
      ? [
          {
            position: index + 1,
            spreadId: spreadPosition.spread.id,
          },
        ]
      : [],
  )
}
