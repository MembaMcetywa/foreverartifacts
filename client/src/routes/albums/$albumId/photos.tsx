import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '../../../components/Button'
import { requireAuth } from '../../../auth/requireAuth'
import { CreationShell } from '../../../components/CreationShell'
import { SelectedPhotograph } from '../../../components/SelectedPhotograph'
import { Spinner } from '../../../components/Spinner'
import { useAlbumNameEditor } from '../../../hooks/useAlbumNameEditor'
import {
  useAddAlbumAssetsMutation,
  useAlbumQuery,
  useUpdateAlbumWorkflowMutation,
  writeAlbumToCache,
} from '../../../queries/albums'
import { useUploadAssetMutation } from '../../../queries/assets'
import {
  getFileIdentity,
  getImageContentType,
  IMAGE_INPUT_ACCEPT,
  selectImageFiles,
} from '../../../utils/image-upload-policy'

export const Route = createFileRoute('/albums/$albumId/photos')({
  beforeLoad: ({ location }) => requireAuth(location.href),
  validateSearch: (search: Record<string, unknown>) => {
    const spread = Number(search.spread)

    return {
      spread:
        Number.isInteger(spread) && spread >= 1 && spread <= 12
          ? spread
          : undefined,
      returnTo: search.returnTo === 'review' ? 'review' : undefined,
    }
  },
  component: PhotographsPage,
})

interface SelectedPhoto {
  file: File
  previewUrl: string
  status: 'failed' | 'selected' | 'uploaded' | 'uploading'
}

function PhotographsPage() {
  const { albumId } = Route.useParams()
  const { returnTo, spread } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const albumQuery = useAlbumQuery(albumId)
  const { saveAlbumName, savingAlbumName } = useAlbumNameEditor(albumId)
  const addAlbumAssetsMutation = useAddAlbumAssetsMutation()
  const updateWorkflowMutation = useUpdateAlbumWorkflowMutation()
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

  useEffect(() => {
    if (returnTo === 'review') {
      return
    }

    updateWorkflowMutation.mutate(
      {
        albumId,
        workflowStage: 'collect_photos',
        activeSpreadPosition: null,
      },
      {
        onSuccess: (album) => writeAlbumToCache(queryClient, album),
      },
    )
  }, [albumId, queryClient, returnTo])

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
    let attemptedUpload = false
    let uploadFailed = false
    const uploadedAssetIds: string[] = []

    for (const photo of selectedPhotos) {
      if (photo.status !== 'selected' && photo.status !== 'failed') {
        continue
      }

      const identity = getFileIdentity(photo.file)
      const contentType = getImageContentType(photo.file)

      if (!contentType) {
        uploadFailed = true
        continue
      }

      attemptedUpload = true

      setSelectedPhotos((currentPhotos) =>
        currentPhotos.map((currentPhoto) =>
          getFileIdentity(currentPhoto.file) === identity
            ? { ...currentPhoto, status: 'uploading' }
            : currentPhoto,
        ),
      )

      try {
        const uploadedAsset = await uploadAssetMutation.mutateAsync({
          file: photo.file,
          contentType,
        })
        uploadedAssetIds.push(uploadedAsset.assetId)

        setSelectedPhotos((currentPhotos) =>
          currentPhotos.map((currentPhoto) =>
            getFileIdentity(currentPhoto.file) === identity
              ? { ...currentPhoto, status: 'uploaded' }
              : currentPhoto,
          ),
        )
      } catch {
        uploadFailed = true
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

    if (attemptedUpload && !uploadFailed) {
      try {
        await addAlbumAssetsMutation.mutateAsync({
          albumId,
          assetIds: uploadedAssetIds,
        })
        await queryClient.invalidateQueries({ queryKey: ['album', albumId] })

        if (returnTo === 'review' && spread) {
          navigate({
            to: '/albums/$albumId/arrange',
            params: { albumId },
            search: { spread, returnTo },
          })
          return
        }

        navigate({
          to: '/albums/$albumId/arrange',
          params: { albumId },
        })
      } catch {
        setSelectionErrors([
          'Uploaded photographs could not be added to this book. Try uploading again.',
        ])
      }
    }
  }

  return (
    <>
      {albumQuery.isLoading && (
        <main className="photos-route-state">
          <Spinner size="lg" label="Loading your book" />
        </main>
      )}

      {albumQuery.isError && (
        <main className="photos-route-state">
          <p role="alert">Your book could not be loaded.</p>
        </main>
      )}

      {albumQuery.data && (
        <CreationShell
          stage="Photographs — 1 of 5"
          title={albumTitle}
          titleSaving={savingAlbumName}
          onTitleSave={saveAlbumName}
        >
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
                  Upload photographs
                </Button>
              </footer>
            )}
          </section>
        </CreationShell>
      )}
    </>
  )
}
