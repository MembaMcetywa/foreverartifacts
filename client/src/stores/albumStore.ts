import type { Album } from '#/api/albums'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UploadedAsset {
  assetId: string
  filename: string
  previewUrl: string
}


interface CreateAlbumStore {
  albumId: string | null
  album: Album | null
  uploadedAssets: UploadedAsset[]

  setAlbumId: (albumId: string) => void
  setAlbum: (album: Album) => void
  clearAlbum: () => void

  addUploadedAsset: (asset: UploadedAsset) => void
  removeUploadedAsset: (assetId: string) => void
  clearUploadedAssets: () => void
}

export const useCreateAlbumStore = create<CreateAlbumStore>()(
  persist(
    (set) => ({
      albumId: null,
      album: null,
      uploadedAssets: [],

      setAlbumId: (albumId) => {
        set({ albumId })
      },

      setAlbum: (album) => {
        set({
          album,
          albumId: album.id,
        })
      },

      clearAlbum: () => {
        set({
          albumId: null,
          album: null,
        })
      },

      addUploadedAsset: (asset) => {
        set((state) => ({
          uploadedAssets: [...state.uploadedAssets, asset],
        }))
      },

      removeUploadedAsset: (assetId) => {
        set((state) => ({
          uploadedAssets: state.uploadedAssets.filter(
            (asset) => asset.assetId !== assetId,
          ),
        }))
      },

      clearUploadedAssets: () => {
        set({ uploadedAssets: [] })
      },
    }),
    {
      name: 'forever-artifacts-create-album',
      partialize: (state) => ({
        albumId: state.albumId,
      }),
    },
  ),
)
