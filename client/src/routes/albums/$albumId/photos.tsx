import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../../../components/Button'
import { requireAuth } from '../../../auth/requireAuth'
import { CreationShell } from '../../../components/CreationShell'
import { SelectedPhotograph } from '../../../components/SelectedPhotograph'
import { Spinner } from '../../../components/Spinner'
import { useAlbumNameEditor } from '../../../hooks/useAlbumNameEditor'
import {
  completeAssetUpload,
  createUploadUrlsBatch,
  uploadAsset,
} from '../../../api/assets'
import {
  useAddAlbumAssetsMutation,
  useAlbumQuery,
  useUpdateAlbumWorkflowMutation,
  writeAlbumToCache,
} from '../../../queries/albums'
import {
  getFileIdentity,
  getImageContentType,
  IMAGE_INPUT_ACCEPT,
  selectImageFiles,
} from '../../../utils/image-upload-policy'

const UPLOAD_CONCURRENCY = 3

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
  assetId?: string
  error?: UploadPhotoError
  file: File
  previewUrl: string
  status: 'failed' | 'processing' | 'selected' | 'uploaded' | 'uploading'
}

type UploadFailureStage =
  | 'album-link'
  | 'presign'
  | 'processing'
  | 's3-upload'
  | 'validation'

interface UploadPhotoError {
  message: string
  retryable: boolean
  stage: UploadFailureStage
}

interface UploadCandidate {
  contentType: string
  identity: string
  photo: SelectedPhoto
}

interface UploadPhotoResult {
  assetId?: string
  error?: UploadPhotoError
  identity: string
  status: 'failed' | 'uploaded'
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
    if (rejected.length > 0) {
      toast.error(
        rejected.length === 1
          ? rejected[0].message
          : `${rejected.length} photographs could not be selected.`,
      )
    }
    event.target.value = ''
  }

  function updatePhoto(identity: string, update: Partial<SelectedPhoto>) {
    setSelectedPhotos((currentPhotos) =>
      currentPhotos.map((currentPhoto) =>
        getFileIdentity(currentPhoto.file) === identity
          ? { ...currentPhoto, ...update }
          : currentPhoto,
      ),
    )
  }

  function failPhoto(identity: string, error: UploadPhotoError) {
    updatePhoto(identity, { error, status: 'failed' })
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
    const candidates: UploadCandidate[] = []

    for (const photo of selectedPhotos) {
      if (photo.status !== 'selected' && photo.status !== 'failed') {
        continue
      }

      const identity = getFileIdentity(photo.file)
      const contentType = getImageContentType(photo.file)

      if (!contentType) {
        failPhoto(identity, {
          message: `${photo.file.name} is not a supported image type.`,
          retryable: false,
          stage: 'validation',
        })
        continue
      }

      candidates.push({ contentType, identity, photo })
    }

    if (candidates.length === 0) {
      setIsUploading(false)
      return
    }

    candidates.forEach((candidate) =>
      updatePhoto(candidate.identity, {
        assetId: undefined,
        error: undefined,
        status: 'uploading',
      }),
    )

    let uploadUrls: Awaited<ReturnType<typeof createUploadUrlsBatch>>

    try {
      uploadUrls = await createUploadUrlsBatch(
        candidates.map((candidate) => ({
          filename: candidate.photo.file.name,
          contentType: candidate.contentType,
        })),
      )
    } catch {
      candidates.forEach((candidate) =>
        failPhoto(candidate.identity, {
          message: `${candidate.photo.file.name} could not be prepared for upload.`,
          retryable: true,
          stage: 'presign',
        }),
      )
      toast.error('Upload URLs could not be created. Try again.')
      setIsUploading(false)
      return
    }

    const uploadResults = await uploadPreparedPhotos(
      candidates,
      uploadUrls,
      (identity, status) => updatePhoto(identity, { status }),
    )

    const uploadedAssetIds = uploadResults.flatMap((result) =>
      result.status === 'uploaded' && result.assetId ? [result.assetId] : [],
    )
    const failedResults = uploadResults.filter(
      (result) => result.status === 'failed',
    )

    uploadResults.forEach((result) => {
      if (result.status === 'uploaded' && result.assetId) {
        updatePhoto(result.identity, {
          assetId: result.assetId,
          error: undefined,
          status: 'uploaded',
        })
        return
      }

      if (result.error) {
        failPhoto(result.identity, result.error)
      }
    })

    if (failedResults.length > 0) {
      toast.error(
        failedResults.length === 1
          ? '1 photograph could not be uploaded.'
          : `${failedResults.length} photographs could not be uploaded.`,
      )
    }

    if (uploadedAssetIds.length > 0) {
      try {
        await addAlbumAssetsMutation.mutateAsync({
          albumId,
          assetIds: uploadedAssetIds,
        })
        await queryClient.invalidateQueries({ queryKey: ['album', albumId] })
        toast.success(
          uploadedAssetIds.length === 1
            ? 'Photograph uploaded.'
            : `${uploadedAssetIds.length} photographs uploaded.`,
        )

        if (failedResults.length === 0 && returnTo === 'review' && spread) {
          navigate({
            to: '/albums/$albumId/arrange',
            params: { albumId },
            search: { spread, returnTo },
          })
          return
        }

        if (failedResults.length === 0) {
          navigate({
            to: '/albums/$albumId/arrange',
            params: { albumId },
          })
        }
      } catch {
        uploadedAssetIds.forEach((assetId) => {
          const result = uploadResults.find(
            (uploadResult) => uploadResult.assetId === assetId,
          )

          if (result) {
            failPhoto(result.identity, {
              message:
                'This photograph uploaded, but could not be added to this book.',
              retryable: true,
              stage: 'album-link',
            })
          }
        })
        toast.error(
          'Uploaded photographs could not be added to this book. Try uploading again.',
        )
        setSelectionErrors([
          'Uploaded photographs could not be added to this book. Try uploading again.',
        ])
      }
    }

    setIsUploading(false)
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
                    errorMessage={photo.error?.message}
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

async function uploadPreparedPhotos(
  candidates: UploadCandidate[],
  uploadUrls: { assetId: string; uploadUrl: string }[],
  updateStatus: (
    identity: string,
    status: SelectedPhoto['status'],
  ) => void,
): Promise<UploadPhotoResult[]> {
  const results: UploadPhotoResult[] = []
  let nextIndex = 0

  async function uploadNextPhoto() {
    const index = nextIndex
    nextIndex += 1

    if (index >= candidates.length) {
      return
    }

    results[index] = await uploadPreparedPhoto(
      candidates[index],
      uploadUrls[index],
      updateStatus,
    )
    await uploadNextPhoto()
  }

  const workerCount = Math.min(UPLOAD_CONCURRENCY, candidates.length)
  await Promise.all(
    Array.from({ length: workerCount }, () => uploadNextPhoto()),
  )

  return results
}

async function uploadPreparedPhoto(
  candidate: UploadCandidate,
  uploadUrl: { assetId: string; uploadUrl: string } | undefined,
  updateStatus: (
    identity: string,
    status: SelectedPhoto['status'],
  ) => void,
): Promise<UploadPhotoResult> {
  if (!uploadUrl) {
    return {
      identity: candidate.identity,
      status: 'failed',
      error: {
        message: `${candidate.photo.file.name} could not be prepared for upload.`,
        retryable: true,
        stage: 'presign',
      },
    }
  }

  try {
    await uploadAsset(
      uploadUrl.uploadUrl,
      candidate.photo.file,
      candidate.contentType,
    )
  } catch {
    return {
      identity: candidate.identity,
      status: 'failed',
      error: {
        message: `${candidate.photo.file.name} could not be uploaded.`,
        retryable: true,
        stage: 's3-upload',
      },
    }
  }

  updateStatus(candidate.identity, 'processing')

  try {
    const completedAsset = await completeAssetUpload(uploadUrl.assetId)

    return {
      assetId: completedAsset.assetId,
      identity: candidate.identity,
      status: 'uploaded',
    }
  } catch {
    return {
      identity: candidate.identity,
      status: 'failed',
      error: {
        message: `${candidate.photo.file.name} could not be processed.`,
        retryable: true,
        stage: 'processing',
      },
    }
  }
}
