/**
 * Albums are instances created by users.
 * They reference:
 * - an AlbumSpec
 * - LayoutTemplates
 * - uploaded Assets
 */

export type AlbumState =
  | 'draft'
  | 'ready'
  | 'rendering'
  | 'rendered';

export interface Album {
  id: string;
  albumSpecId: string;
  state: AlbumState;
  spreads: AlbumSpread[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumSpread {
  templateId: string;
  slots: AlbumSlot[];
}

export interface AlbumSlot {
  slotIndex: number;
  assetId: string;
}
