import { apiFetch } from './client'

export interface CreateUploadUrlInput {
  filename: string
  contentType: string
}

export interface CreateUploadUrlResponse {
  assetId: string
  uploadUrl: string
}

export interface CompleteAssetResponse {
  assetId: string
  status: 'ready'
  width: number
  height: number
  previewUrl: string
}

export async function createUploadUrl(
  input: CreateUploadUrlInput,
): Promise<CreateUploadUrlResponse> {
  const response = await apiFetch('/assets/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('Failed to create an upload URL.')
  }

  return (await response.json()) as CreateUploadUrlResponse
}

export async function createUploadUrlsBatch(
  files: CreateUploadUrlInput[],
): Promise<CreateUploadUrlResponse[]> {
  const response = await apiFetch('/assets/upload-urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  })

  if (!response.ok) {
    throw new Error('Failed to create upload URLs.')
  }

  return (await response.json()) as CreateUploadUrlResponse[]
}

export async function uploadAsset(
  uploadUrl: string,
  file: File,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error('Failed to upload the image.')
  }
}

export async function completeAssetUpload(
  assetId: string,
): Promise<CompleteAssetResponse> {
  const response = await apiFetch(`/assets/${assetId}/complete`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to process the uploaded image.')
  }

  return (await response.json()) as CompleteAssetResponse
}
