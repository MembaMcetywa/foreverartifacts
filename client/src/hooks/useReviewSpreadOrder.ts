import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import type { AlbumSpreadPosition } from '../api/albums'
import { useReorderSpreadsMutation } from '../queries/spreads'
import {
  getSpreadPositionId,
  toSpreadOrderPositions,
} from '../utils/review-spreads'

export function useReviewSpreadOrder(
  albumId: string,
  spreadPositions: AlbumSpreadPosition[] | undefined,
) {
  const queryClient = useQueryClient()
  const reorderSpreadsMutation = useReorderSpreadsMutation()
  const reorderSaveTimeoutRef = useRef<number | null>(null)
  const [orderedSpreadPositions, setOrderedSpreadPositions] = useState<
    AlbumSpreadPosition[]
  >([])

  useEffect(() => {
    setOrderedSpreadPositions(spreadPositions ?? [])
  }, [spreadPositions])

  useEffect(
    () => () => {
      if (reorderSaveTimeoutRef.current) {
        window.clearTimeout(reorderSaveTimeoutRef.current)
      }
    },
    [],
  )

  function scheduleReorderSave(nextSpreadPositions: AlbumSpreadPosition[]) {
    if (reorderSaveTimeoutRef.current) {
      window.clearTimeout(reorderSaveTimeoutRef.current)
    }

    reorderSaveTimeoutRef.current = window.setTimeout(() => {
      void reorderSpreadsMutation.mutateAsync(
        {
          albumId,
          positions: toSpreadOrderPositions(nextSpreadPositions),
        },
        {
          onSuccess: (album) => {
            queryClient.setQueryData(['album', albumId], album)
          },
        },
      )
    }, 750)
  }

  function reorderSpread(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setOrderedSpreadPositions((currentSpreadPositions) => {
      const oldIndex = currentSpreadPositions.findIndex(
        (spreadPosition) => getSpreadPositionId(spreadPosition) === active.id,
      )
      const newIndex = currentSpreadPositions.findIndex(
        (spreadPosition) => getSpreadPositionId(spreadPosition) === over.id,
      )

      if (oldIndex < 0 || newIndex < 0) {
        return currentSpreadPositions
      }

      const nextSpreadPositions = arrayMove(
        currentSpreadPositions,
        oldIndex,
        newIndex,
      )

      scheduleReorderSave(nextSpreadPositions)

      return nextSpreadPositions
    })
  }

  return {
    orderedSpreadPositions,
    reorderSpread,
  }
}
