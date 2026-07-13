import { useMutation, useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

import {
  addAlbumAssets,
  approveAlbumRender,
  createAlbum,
  deleteAlbum,
  getAlbum,
  listAlbums,
  startAlbumRender,
  updateAlbumName,
  updateAlbumWorkflow,
} from '../api/albums'
import type {
  AddAlbumAssetsInput,
  Album,
  CreateAlbumInput,
  UpdateAlbumNameInput,
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

export function useUpdateAlbumNameMutation() {
  return useMutation<Album, Error, UpdateAlbumNameInput>({
    mutationFn: updateAlbumName,
  })
}

export function useDeleteAlbumMutation() {
  return useMutation<void, Error, string>({
    mutationFn: deleteAlbum,
  })
}

export function useStartAlbumRenderMutation() {
  return useMutation<Album, Error, string>({
    mutationFn: startAlbumRender,
  })
}

export function useApproveAlbumRenderMutation() {
  return useMutation<Album, Error, string>({
    mutationFn: approveAlbumRender,
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

export function writeAlbumNameToCache(
  queryClient: QueryClient,
  albumId: string,
  albumName: string,
) {
  queryClient.setQueryData<Album>(['album', albumId], (album) =>
    album ? { ...album, albumName } : album,
  )
  queryClient.setQueryData<Album[]>(['albums'], (albums) =>
    albums?.map((album) =>
      album.id === albumId ? { ...album, albumName } : album,
    ),
  )
}

export function removeAlbumFromCache(queryClient: QueryClient, albumId: string) {
  queryClient.removeQueries({ queryKey: ['album', albumId] })
  queryClient.setQueryData<Album[]>(['albums'], (albums) =>
    albums?.filter((album) => album.id !== albumId),
  )
}


