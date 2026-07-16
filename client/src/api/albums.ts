import { apiFetch } from './client'

export interface CreateAlbumInput {
  albumSpecId: string
  assetIds: string[]
}

export interface AddAlbumAssetsInput {
  albumId: string
  assetIds: string[]
}

export type AlbumWorkflowStage =
  | 'collect_photos'
  | 'compose_spreads'
  | 'review_album'
  | 'render_album'
  | 'ready_to_order'

export type AlbumRenderStatus =
  | 'not_started'
  | 'rendering'
  | 'ready'
  | 'failed'
  | 'stale'
  | 'approved'

export interface UpdateAlbumWorkflowInput {
  albumId: string
  workflowStage: AlbumWorkflowStage
  activeSpreadPosition?: number | null
}

export interface UpdateAlbumNameInput {
  albumId: string
  albumName: string
}

export interface AlbumAsset {
  assetId: string
  key: string
  sourceContentType: string
  order: number
  previewUrl: string
}

export interface AlbumSpreadSlotAsset {
  id: string
  key: string
  sourceContentType: string
  previewUrl: string
}

export interface AlbumSpreadSlot {
  id: string
  slotIndex: number
  assetId: string
  asset: AlbumSpreadSlotAsset
}

export interface AlbumSpread {
  id: string
  templateId: string
  order: number
  slots: AlbumSpreadSlot[]
}

export interface AlbumSpreadPosition {
  position: number
  status: 'complete' | 'empty'
  spread: AlbumSpread | null
}

export interface Album {
  id: string
  albumName: string
  albumSpecId: string
  state: string
  workflowStage: AlbumWorkflowStage
  activeSpreadPosition: number | null
  renderStatus: AlbumRenderStatus
  renderCompletedAt: string | null
  renderApprovedAt: string | null
  assets: AlbumAsset[]
  spreads: AlbumSpread[]
  spreadPositions: AlbumSpreadPosition[]
}

export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  const response = await apiFetch('/albums', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('Failed to create album.')
  }

  return (await response.json()) as Album
}

export async function getAlbum(albumId: string): Promise<Album> {
  const response = await apiFetch(`/albums/${albumId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch album.')
  }

  return (await response.json()) as Album
}

export async function addAlbumAssets(
  input: AddAlbumAssetsInput,
): Promise<Album> {
  const response = await apiFetch(
    `/albums/${input.albumId}/assets`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetIds: input.assetIds }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to add photographs to the album.')
  }

  return (await response.json()) as Album
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const response = await apiFetch(`/albums/${albumId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete album.')
  }
}

export async function updateAlbumWorkflow(
  input: UpdateAlbumWorkflowInput,
): Promise<Album> {
  const response = await apiFetch(`/albums/${input.albumId}/workflow`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflowStage: input.workflowStage,
      activeSpreadPosition: input.activeSpreadPosition ?? null,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update album workflow.')
  }

  return (await response.json()) as Album
}

export async function updateAlbumName(
  input: UpdateAlbumNameInput,
): Promise<Album> {
  const response = await apiFetch(`/albums/${input.albumId}/name`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ albumName: input.albumName }),
  })

  if (!response.ok) {
    throw new Error('Failed to update album name.')
  }

  return (await response.json()) as Album
}

export async function startAlbumRender(albumId: string): Promise<Album> {
  const response = await apiFetch(`/albums/${albumId}/render/start`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to render the book PDF.')
  }

  return (await response.json()) as Album
}

export async function approveAlbumRender(albumId: string): Promise<Album> {
  const response = await apiFetch(`/albums/${albumId}/render/approve`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to continue to order.')
  }

  return (await response.json()) as Album
}

export async function listAlbums(): Promise<Album[]> {
  const response = await apiFetch('/albums')

  if (!response.ok) {
    throw new Error('Failed to fetch albums.')
  }

  return (await response.json()) as Album[]
}


