import type { Album } from '#/api/albums'
import type { LayoutTemplate } from '#/api/templates'
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
  templates: LayoutTemplate[]

  setAlbumId: (albumId: string) => void
  setAlbum: (album: Album) => void
  clearAlbum: () => void

  addUploadedAsset: (asset: UploadedAsset) => void
  removeUploadedAsset: (assetId: string) => void
  clearUploadedAssets: () => void
  setTemplates: (templates: LayoutTemplate[]) => void
}

export const useCreateAlbumStore = create<CreateAlbumStore>()(
  persist(
    (set) => ({
      albumId: null,
      album: null,
      uploadedAssets: [],
      templates: [],

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

      setTemplates: (templates) => {
        set({ templates })
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
