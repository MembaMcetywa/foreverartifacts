import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { StorageService } from '../storage/storage.service';

interface CreateUploadUrlInput {
  filename: string;
  contentType: string;
}

interface AssetRecord {
  id: string;
  key: string;
  contentType: string;
}

@Injectable()
export class AssetsService {
  private readonly assets = new Map<string, AssetRecord>();

  constructor(private readonly storage: StorageService) {}

  // TODO: Persistence will be added once album drafts become durable.

  async createUploadUrl(
    input: CreateUploadUrlInput,
  ): Promise<{ assetId: string; uploadUrl: string }> {
    const assetId = randomUUID();
    const key = `assets/${assetId}`;

    const uploadUrl = await this.storage.getPresignedUploadUrl(
      key,
      input.contentType,
    );

    this.assets.set(assetId, {
      id: assetId,
      key,
      contentType: input.contentType,
    });

    return { assetId, uploadUrl };
  }

  async deleteAsset(assetId: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) return;

    // Object deletion can be added later (MVP: metadata only)
    this.assets.delete(assetId);
  }

  getAsset(assetId: string): AssetRecord {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Unknown asset '${assetId}'.`);
    }
    return asset;
  }
}
