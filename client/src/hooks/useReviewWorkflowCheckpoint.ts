import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import {
  useUpdateAlbumWorkflowMutation,
  writeAlbumToCache,
} from '../queries/albums'

export function useReviewWorkflowCheckpoint(albumId: string) {
  const queryClient = useQueryClient()
  const updateWorkflowMutation = useUpdateAlbumWorkflowMutation()

  useEffect(() => {
    updateWorkflowMutation.mutate(
      {
        albumId,
        workflowStage: 'review_album',
        activeSpreadPosition: null,
      },
      {
        onSuccess: (album) => writeAlbumToCache(queryClient, album),
      },
    )
  }, [albumId, queryClient])
}
