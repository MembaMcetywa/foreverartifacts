import { apiFetch } from './client'

export interface LayoutTemplate {
  id: string
  name: string
  description: string
  imageSlots: number
  preview: {
    widthRatio: number
    heightRatio: number
    slots: {
      slotIndex: number
      rect: {
        left: number
        top: number
        width: number
        height: number
      }
    }[]
  }
}

export async function getLayoutTemplates(
  albumSpecId: string,
): Promise<LayoutTemplate[]> {
  const response = await apiFetch(`/layout/${albumSpecId}/templates`)

  if (!response.ok) {
    throw new Error('Failed to fetch layout templates.')
  }

  return (await response.json()) as LayoutTemplate[]
}
