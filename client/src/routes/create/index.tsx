import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ChangeEvent, SubmitEvent } from 'react'
import { useState } from 'react'
import { useAlbumsQuery } from '../../queries/albums'
import { useUploadAssetMutation } from '../../queries/assets'
import { useCreateAlbumStore } from '../../stores/albumStore'
import {
  getImageContentType,
  IMAGE_INPUT_ACCEPT,
  selectImageFiles,
} from '../../utils/image-upload-policy'

export const Route = createFileRoute('/create/')({
  component: CreatePage,
})

function CreatePage() {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const addUploadedAsset = useCreateAlbumStore(
    (state) => state.addUploadedAsset,
  )
  const clearAlbum = useCreateAlbumStore((state) => state.clearAlbum)
  const clearUploadedAssets = useCreateAlbumStore(
    (state) => state.clearUploadedAssets,
  )
  const setAlbumId = useCreateAlbumStore((state) => state.setAlbumId)

  const navigate = useNavigate()
  const albumsQuery = useAlbumsQuery()
  const uploadAssetMutation = useUploadAssetMutation()

  function handleOpenAlbum(albumId: string) {
    setAlbumId(albumId)
    navigate({ to: '/create/album' })
  }

  function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    setSelectedImages((currentImages) => {
      const { accepted } = selectImageFiles(currentImages, files)

      return [...currentImages, ...accepted]
    })

    event.target.value = ''
  }

  async function handleContinue(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (selectedImages.length === 0 || isUploading) return

    clearAlbum()
    clearUploadedAssets()
    setIsUploading(true)

    try {
      for (const image of selectedImages) {
        const contentType = getImageContentType(image)

        if (!contentType) {
          throw new Error(`${image.name} is not a supported image format.`)
        }

        const uploadedAsset = await uploadAssetMutation.mutateAsync({
          file: image,
          contentType,
        })

        addUploadedAsset({
          assetId: uploadedAsset.assetId,
          filename: uploadedAsset.filename,
          previewUrl: uploadedAsset.previewUrl,
        })
      }

      navigate({ to: '/create/album' })

    }

    catch {
      throw new Error('Failed to upload images.')
    }

    finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111111]">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
        <h1 className="mb-6 text-5xl font-normal tracking-[-0.04em]">
          Add your photos
        </h1>

        <section className="mb-12">
          <h2 className="mb-4 text-sm text-neutral-500">Existing albums</h2>

          {albumsQuery.isLoading && (
            <p className="text-sm text-neutral-500">Loading albums...</p>
          )}

          {albumsQuery.isError && (
            <p className="text-sm text-neutral-500">
              Albums could not be loaded.
            </p>
          )}

          {albumsQuery.data?.length === 0 && (
            <p className="text-sm text-neutral-500">No albums created yet.</p>
          )}

          {albumsQuery.data && albumsQuery.data.length > 0 && (
            <div className="grid gap-2">
              {albumsQuery.data.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => handleOpenAlbum(album.id)}
                  className="border border-neutral-300 bg-white px-4 py-3 text-left text-sm"
                >
                  {album.id}
                </button>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleContinue}>
          <label className="mb-8 flex h-56 cursor-pointer items-center justify-center border border-neutral-300 bg-white">
            <input
              type="file"
              accept={IMAGE_INPUT_ACCEPT}
              multiple
              className="hidden"
              onChange={handleImageSelection}
            />

            <span className="text-sm tracking-wide">
              {selectedImages.length > 0
                ? `${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected`
                : 'Choose images'}
            </span>
          </label>

          {selectedImages.length > 0 && (
            <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {selectedImages.map((image, index) => (
                <img
                  key={`${image.name}-${image.lastModified}-${index}`}
                  src={URL.createObjectURL(image)}
                  alt={image.name}
                  className="aspect-square w-full object-cover"
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={selectedImages.length === 0 || isUploading}
            className="border border-neutral-900 px-6 py-3 text-sm tracking-wide disabled:border-neutral-300 disabled:text-neutral-400"
          >
            {isUploading ? 'Uploading…' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  )
}
