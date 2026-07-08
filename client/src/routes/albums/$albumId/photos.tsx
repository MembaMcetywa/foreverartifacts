import { createFileRoute } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '../../../components/Button'
import { CreationShell } from '../../../components/CreationShell'
import { SelectedPhotograph } from '../../../components/SelectedPhotograph'
import { useAlbumQuery } from '../../../queries/albums'
import { useUploadAssetMutation } from '../../../queries/assets'
import {
  getFileIdentity,
  getImageContentType,
  IMAGE_INPUT_ACCEPT,
  selectImageFiles,
} from '../../../utils/image-upload-policy'

export const Route = createFileRoute('/albums/$albumId/photos')({
  component: PhotographsPage,
})

interface SelectedPhoto {
  file: File
  previewUrl: string
  status: 'failed' | 'selected' | 'uploaded' | 'uploading'
}

function PhotographsPage() {
  const { albumId } = Route.useParams()
  const albumQuery = useAlbumQuery(albumId)
  const uploadAssetMutation = useUploadAssetMutation()
  const previewUrls = useRef(new Set<string>())
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([])
  const [selectionErrors, setSelectionErrors] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const albumTitle =
    albumQuery.data?.albumName && albumQuery.data.albumName !== albumId
      ? albumQuery.data.albumName
      : 'Untitled'
  const canUpload = selectedPhotos.some(
    (photo) => photo.status === 'selected' || photo.status === 'failed',
  )

  useEffect(() => {
    const urls = previewUrls.current

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const currentFiles = selectedPhotos.map((photo) => photo.file)
    const { accepted, rejected } = selectImageFiles(currentFiles, files)
    const newPhotos = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)

      return { file, previewUrl, status: 'selected' as const }
    })

    setSelectedPhotos((currentPhotos) => [...currentPhotos, ...newPhotos])
    setSelectionErrors(rejected.map((rejection) => rejection.message))
    event.target.value = ''
  }

  function removePhoto(file: File) {
    const identity = getFileIdentity(file)

    setSelectedPhotos((currentPhotos) =>
      currentPhotos.filter((photo) => {
        if (getFileIdentity(photo.file) !== identity) {
          return true
        }

        URL.revokeObjectURL(photo.previewUrl)
        previewUrls.current.delete(photo.previewUrl)
        return false
      }),
    )
  }

  async function uploadPhotographs() {
    if (!canUpload || isUploading) {
      return
    }

    setIsUploading(true)

    for (const photo of selectedPhotos) {
      if (photo.status !== 'selected' && photo.status !== 'failed') {
        continue
      }

      const identity = getFileIdentity(photo.file)
      const contentType = getImageContentType(photo.file)

      if (!contentType) {
        continue
      }

      setSelectedPhotos((currentPhotos) =>
        currentPhotos.map((currentPhoto) =>
          getFileIdentity(currentPhoto.file) === identity
            ? { ...currentPhoto, status: 'uploading' }
            : currentPhoto,
        ),
      )

      try {
        await uploadAssetMutation.mutateAsync({
          file: photo.file,
          contentType,
        })

        setSelectedPhotos((currentPhotos) =>
          currentPhotos.map((currentPhoto) =>
            getFileIdentity(currentPhoto.file) === identity
              ? { ...currentPhoto, status: 'uploaded' }
              : currentPhoto,
          ),
        )
      } catch {
        setSelectedPhotos((currentPhotos) =>
          currentPhotos.map((currentPhoto) =>
            getFileIdentity(currentPhoto.file) === identity
              ? { ...currentPhoto, status: 'failed' }
              : currentPhoto,
          ),
        )
      }
    }

    setIsUploading(false)
  }

  return (
    <>
      {albumQuery.isLoading && (
        <main className="photos-route-state">
          <p>Loading your book...</p>
        </main>
      )}

      {albumQuery.isError && (
        <main className="photos-route-state">
          <p role="alert">Your book could not be loaded.</p>
        </main>
      )}

      {albumQuery.data && (
        <CreationShell stage="Photographs · 1 of 5" title={albumTitle}>
          <section className="photographs-workspace">
            <header className="photographs-workspace__header">
              <div>
                <h1>Photographs</h1>
                <p>Choose the photographs for this book.</p>
              </div>

              <label className="photographs-workspace__picker">
                <span>
                  {selectedPhotos.length === 0
                    ? 'Choose photographs'
                    : 'Add photographs'}
                </span>
                <input
                  className="photographs-workspace__input"
                  type="file"
                  accept={IMAGE_INPUT_ACCEPT}
                  multiple
                  onChange={handleSelection}
                />
              </label>
            </header>

            {selectionErrors.length > 0 && (
              <div className="photographs-workspace__errors" role="alert">
                {selectionErrors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}

            {selectedPhotos.length === 0 && (
              <div className="photographs-workspace__empty">
                <p>Select one photograph or an entire collection.</p>
                <p>
                  JPEG, PNG, WebP, HEIC, or HEIF · 40 MB maximum · 100
                  megapixels maximum · Normalised to sRGB JPEG
                </p>
              </div>
            )}

            {selectedPhotos.length > 0 && (
              <div className="photographs-workspace__grid">
                {selectedPhotos.map((photo) => (
                  <SelectedPhotograph
                    key={getFileIdentity(photo.file)}
                    name={photo.file.name}
                    previewUrl={photo.previewUrl}
                    status={photo.status}
                    onRemove={() => removePhoto(photo.file)}
                  />
                ))}
              </div>
            )}

            {selectedPhotos.length > 0 && (
              <footer className="photographs-workspace__actions">
                <p>
                  {selectedPhotos.length}{' '}
                  {selectedPhotos.length === 1 ? 'photograph' : 'photographs'}{' '}
                  selected
                </p>
                <Button
                  type="button"
                  loading={isUploading}
                  disabled={!canUpload}
                  onClick={uploadPhotographs}
                >
                  {isUploading
                    ? 'Uploading photographs...'
                    : 'Upload photographs'}
                </Button>
              </footer>
            )}
          </section>
        </CreationShell>
      )}
    </>
  )
}
