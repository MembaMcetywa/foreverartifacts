export interface CreateAlbumInput {
  albumSpecId: string
  assetIds: string[]
}

export interface AddAlbumAssetsInput {
  albumId: string
  assetIds: string[]
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

export interface Album {
  id: string
  albumName: string
  albumSpecId: string
  state: string
  assets: AlbumAsset[]
  spreads: AlbumSpread[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/albums`, {
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
  const response = await fetch(`${API_BASE_URL}/albums/${albumId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch album.')
  }

  return (await response.json()) as Album
}

export async function addAlbumAssets(
  input: AddAlbumAssetsInput,
): Promise<Album> {
  const response = await fetch(
    `${API_BASE_URL}/albums/${input.albumId}/assets`,
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

export async function listAlbums(): Promise<Album[]> {
  const response = await fetch(`${API_BASE_URL}/albums`)

  if (!response.ok) {
    throw new Error('Failed to fetch albums.')
  }

  return (await response.json()) as Album[]
}
