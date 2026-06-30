export interface LayoutTemplate {
  id: string
  name: string
  description: string
  imageSlots: number
}

const API_BASE_URL = import.meta.env.API_BASE_URL ?? 'http://localhost:3000'

export async function getLayoutTemplates(
  albumSpecId: string,
): Promise<LayoutTemplate[]> {
  const response = await fetch(
    `${API_BASE_URL}/layout/${albumSpecId}/templates`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch layout templates.')
  }

  return (await response.json()) as LayoutTemplate[]
}
