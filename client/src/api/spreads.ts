export interface AlbumSpreadSlotInput {
  slotIndex: number;
  assetId: string;
}

export interface AddSpreadInput {
  albumId: string;
  templateId: string;
  slots: AlbumSpreadSlotInput[];
}

const API_BASE_URL = process.env.API_BASE_URL;

export async function addSpread(input: AddSpreadInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/albums/${input.albumId}/spreads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templateId: input.templateId,
      slots: input.slots,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to add spread.');
  }
}