import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  ImageNormalizerService,
  SupportedImageFormat,
} from './image-normalizer.service';

const MAX_FILE_SIZE_BYTES = 40 * 1024 * 1024;
const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

type AssetProcessingErrorCode =
  | 'already-processing'
  | 'empty-upload'
  | 'file-limit-exceeded'
  | 'invalid-state'
  | 'not-found';

export class AssetProcessingError extends Error {
  constructor(
    readonly code: AssetProcessingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AssetProcessingError';
  }
}

export interface CompleteAssetResult {
  assetId: string;
  status: 'ready';
  width: number;
  height: number;
  previewUrl: string;
}

interface CreateUploadUrlInput {
  filename: string;
  contentType: string;
}

interface AssetRecord {
  id: string;
  key: string;
  contentType: string;
  status: string;
  printKey: string | null;
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
    private readonly imageNormalizer: ImageNormalizerService,
  ) {}

  async createUploadUrl(
    input: CreateUploadUrlInput,
  ): Promise<{ assetId: string; uploadUrl: string }> {
    const assetId = randomUUID();
    const key = `assets/${assetId}/original`;

    const uploadUrl = await this.storage.getPresignedUploadUrl(
      key,
      input.contentType,
    );

    await this.prisma.asset.create({
      data: {
        id: assetId,
        key,
        contentType: input.contentType,
        status: 'pending',
      },
    });

    return { assetId, uploadUrl };
  }

  async completeUpload(assetId: string): Promise<CompleteAssetResult> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new AssetProcessingError(
        'not-found',
        `Unknown asset '${assetId}'.`,
      );
    }

    if (asset.status === 'ready') {
      return this.toCompleteResult(asset);
    }

    const staleBefore = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
    const claimed = await this.prisma.asset.updateMany({
      where: {
        id: assetId,
        OR: [
          { status: { in: ['pending', 'failed'] } },
          {
            status: 'processing',
            processingStartedAt: { lt: staleBefore },
          },
        ],
      },
      data: {
        status: 'processing',
        processingStartedAt: new Date(),
        failureReason: null,
      },
    });

    if (claimed.count === 0) {
      throw new AssetProcessingError(
        'already-processing',
        `Asset '${assetId}' is already being processed.`,
      );
    }

    const printKey = `assets/${assetId}/print.jpg`;
    const previewKey = `assets/${assetId}/preview.jpg`;

    try {
      const metadata = await this.storage.getObjectMetadata(asset.key);
      this.assertFileSize(metadata.contentLength);

      const original = await this.storage.getObjectBuffer(asset.key);
      this.assertFileSize(original.length);

      const normalized = await this.imageNormalizer.normalize(original);

      await Promise.all([
        this.storage.putObject(printKey, normalized.printBuffer, 'image/jpeg'),
        this.storage.putObject(
          previewKey,
          normalized.previewBuffer,
          'image/jpeg',
        ),
      ]);

      const completedAsset = await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'ready',
          contentType: getContentType(normalized.sourceFormat),
          printKey,
          previewKey,
          width: normalized.width,
          height: normalized.height,
          fileSize: original.length,
          failureReason: null,
          processingStartedAt: null,
        },
      });

      return this.toCompleteResult(completedAsset);
    } catch (error) {
      await Promise.allSettled([
        this.storage.deleteObject(printKey),
        this.storage.deleteObject(previewKey),
      ]);

      const failureReason =
        error instanceof Error ? error.message : 'Image processing failed.';

      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'failed',
          failureReason,
          processingStartedAt: null,
        },
      });

      throw error;
    }
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
      status: asset.status,
      printKey: asset.printKey,
    };
  }

  private assertFileSize(fileSize: number): void {
    if (fileSize === 0) {
      throw new AssetProcessingError(
        'empty-upload',
        'The uploaded image is empty.',
      );
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new AssetProcessingError(
        'file-limit-exceeded',
        'Images must be 40MB or smaller.',
      );
    }
  }

  private async toCompleteResult(asset: {
    id: string;
    status: string;
    printKey: string | null;
    previewKey: string | null;
    width: number | null;
    height: number | null;
  }): Promise<CompleteAssetResult> {
    if (
      asset.status !== 'ready' ||
      !asset.printKey ||
      !asset.previewKey ||
      !asset.width ||
      !asset.height
    ) {
      throw new AssetProcessingError(
        'invalid-state',
        `Asset '${asset.id}' is missing processed output.`,
      );
    }

    return {
      assetId: asset.id,
      status: 'ready',
      width: asset.width,
      height: asset.height,
      previewUrl: await this.storage.getPresignedDownloadUrl(asset.previewKey),
    };
  }
}

function getContentType(format: SupportedImageFormat): string {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'png') return 'image/png';
  if (format === 'webp') return 'image/webp';
  return 'image/heic';
}
