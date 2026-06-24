import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UploadedAsset {
  assetId: string
  filename: string
  previewUrl: string
}

interface CreateAlbumStore {
  albumId: string | null
  uploadedAssets: UploadedAsset[]

  setAlbumId: (albumId: string) => void
  clearAlbumId: () => void

  addUploadedAsset: (asset: UploadedAsset) => void
  removeUploadedAsset: (assetId: string) => void
}

export const useCreateAlbumStore = create<CreateAlbumStore>()(
  persist(
    (set) => ({
      albumId: null,
      uploadedAssets: [],

      setAlbumId: (albumId) => {
        set({ albumId })
      },

      clearAlbumId: () => {
        set({ albumId: null })
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
    }),
    {
      name: 'forever-artifacts-create-album',
      partialize: (state) => ({
        albumId: state.albumId,
      }),
    },
  ),
)
