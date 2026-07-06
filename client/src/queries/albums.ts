import { useMutation, useQuery } from '@tanstack/react-query'

import { createAlbum, getAlbum, listAlbums } from '../api/albums'
import type {Album, CreateAlbumInput} from '../api/albums';

export function useCreateAlbumMutation() {
  return useMutation<Album, Error, CreateAlbumInput>({
    mutationFn: createAlbum,
  })
}

export function useAlbumQuery(albumId: string | null) {
  return useQuery<Album, Error>({
    queryKey: ['album', albumId],
    queryFn: () => {
      if (!albumId) {
        //  TODO: Should trigger toast
        throw new Error('albumId is required.')
      }

      return getAlbum(albumId)
    },
    enabled: Boolean(albumId),
  })
}

export function useAlbumsQuery() {
  return useQuery<Album[], Error>({
    queryKey: ['albums'],
    queryFn: listAlbums,
  })
}
