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

export const ALBUM_WORKFLOW_STAGES = [
  'collect_photos',
  'compose_spreads',
  'review_album',
  'render_album',
  'ready_to_order',
] as const;

export type AlbumWorkflowStage = (typeof ALBUM_WORKFLOW_STAGES)[number];

export const ALBUM_RENDER_STATUSES = [
  'not_started',
  'rendering',
  'ready',
  'failed',
  'stale',
  'approved',
] as const;

export type AlbumRenderStatus = (typeof ALBUM_RENDER_STATUSES)[number];

export interface Album {
  id: string;
  albumSpecId: string;
  state: AlbumState;
  workflowStage: AlbumWorkflowStage;
  activeSpreadPosition: number | null;
  renderStatus: AlbumRenderStatus;
  renderId: string | null;
  renderArtifactKey: string | null;
  renderCompletedAt: Date | null;
  renderApprovedAt: Date | null;
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
