import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../database/prisma.service';
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
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async createUploadUrl(
    input: CreateUploadUrlInput,
  ): Promise<{ assetId: string; uploadUrl: string }> {
    const assetId = randomUUID();
    const key = `assets/${assetId}`;

    const uploadUrl = await this.storage.getPresignedUploadUrl(
      key,
      input.contentType,
    );

    await this.prisma.asset.create({
      data: {
        id: assetId,
        key,
        contentType: input.contentType,
      },
    });

    return { assetId, uploadUrl };
  }

  async deleteAsset(assetId: string): Promise<void> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) return;

    await this.prisma.asset.delete({
      where: { id: assetId },
    });
  }

  async getAsset(assetId: string): Promise<AssetRecord> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new Error(`Unknown asset '${assetId}'.`);
    }

    return {
      id: asset.id,
      key: asset.key,
      contentType: asset.contentType,
    };
  }
}
