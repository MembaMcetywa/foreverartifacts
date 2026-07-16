import type { Album } from './albums'
import { apiFetch } from './client'

export interface AlbumSpreadSlotInput {
  slotIndex: number
  assetId: string
}

export interface AddSpreadInput {
  albumId: string
  templateId: string
  slots: AlbumSpreadSlotInput[]
}

export interface SaveSpreadAtPositionInput extends AddSpreadInput {
  position: number
}

export interface ReorderSpreadPositionInput {
  position: number
  spreadId: string
}

export interface ReorderSpreadsInput {
  albumId: string
  positions: ReorderSpreadPositionInput[]
}

export async function addSpread(input: AddSpreadInput): Promise<Album> {
  const response = await apiFetch(
    `/albums/${input.albumId}/spreads`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: input.templateId,
        slots: input.slots,
      }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to add spread.')
  }

  return (await response.json()) as Album
}

export async function reorderSpreads(
  input: ReorderSpreadsInput,
): Promise<Album> {
  const response = await apiFetch(
    `/albums/${input.albumId}/spreads/order`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        positions: input.positions,
      }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to reorder spreads.')
  }

  return (await response.json()) as Album
}

export async function saveSpreadAtPosition(
  input: SaveSpreadAtPositionInput,
): Promise<Album> {
  const response = await apiFetch(
    `/albums/${input.albumId}/spreads/positions/${input.position}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: input.templateId,
        slots: input.slots,
      }),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to save spread.')
  }

  return (await response.json()) as Album
}
