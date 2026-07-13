import { useQueryClient } from '@tanstack/react-query'

import {
  useUpdateAlbumNameMutation,
  writeAlbumNameToCache,
  writeAlbumToCache,
} from '../queries/albums'
import type { Album } from '../api/albums'

export function useAlbumNameEditor(albumId: string) {
  const queryClient = useQueryClient()
  const updateAlbumNameMutation = useUpdateAlbumNameMutation()

  async function saveAlbumName(albumName: string) {
    const previousAlbum = queryClient.getQueryData<Album>(['album', albumId])
    const previousAlbums = queryClient.getQueryData<Album[]>(['albums'])

    await Promise.all([
      queryClient.cancelQueries({ queryKey: ['album', albumId] }),
      queryClient.cancelQueries({ queryKey: ['albums'] }),
    ])
    writeAlbumNameToCache(queryClient, albumId, albumName)

    updateAlbumNameMutation.mutate(
      {
        albumId,
        albumName,
      },
      {
        onError: () => {
          queryClient.setQueryData(['album', albumId], previousAlbum)
          queryClient.setQueryData(['albums'], previousAlbums)
        },
        onSuccess: (album) => writeAlbumToCache(queryClient, album),
      },
    )
  }

  return {
    saveAlbumName,
    savingAlbumName: updateAlbumNameMutation.isPending,
  }
}
