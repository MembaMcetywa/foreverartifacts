import { useMutation, useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import {
  addAlbumAssets,
  createAlbum,
  getAlbum,
  listAlbums,
  updateAlbumWorkflow,
} from '../api/albums'
import type {
  AddAlbumAssetsInput,
  Album,
  CreateAlbumInput,
  UpdateAlbumWorkflowInput,
} from '../api/albums'

export function useCreateAlbumMutation() {
  return useMutation<Album, Error, CreateAlbumInput>({
    mutationFn: createAlbum,
  })
}

export function useAddAlbumAssetsMutation() {
  return useMutation<Album, Error, AddAlbumAssetsInput>({
    mutationFn: addAlbumAssets,
  })
}

export function useUpdateAlbumWorkflowMutation() {
  return useMutation<Album, Error, UpdateAlbumWorkflowInput>({
    mutationFn: updateAlbumWorkflow,
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

export function writeAlbumToCache(queryClient: QueryClient, album: Album) {
  queryClient.setQueryData(['album', album.id], album)
  queryClient.setQueryData<Album[]>(['albums'], (albums) =>
    albums?.map((cachedAlbum) =>
      cachedAlbum.id === album.id ? album : cachedAlbum,
    ),
  )
}
