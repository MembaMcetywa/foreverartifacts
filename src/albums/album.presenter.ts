import { Injectable } from '@nestjs/common';

import { StorageService } from '../storage/storage.service';
import { AlbumResponseDto } from './albums.dto';
import { AlbumsService } from './albums.service';

type AlbumRecord = Awaited<ReturnType<AlbumsService['getAlbum']>>;

@Injectable()
export class AlbumPresenter {
  constructor(private readonly storageService: StorageService) {}

  async toDto(album: AlbumRecord): Promise<AlbumResponseDto> {
    const assets = await Promise.all(
      album.assets.map(async (albumAsset) => ({
        assetId: albumAsset.asset.id,
        key: albumAsset.asset.key,
        contentType: albumAsset.asset.contentType,
        order: albumAsset.order,
        previewUrl: await this.storageService.getPresignedDownloadUrl(
          albumAsset.asset.key,
        ),
      })),
    );

    const spreads = await Promise.all(
      album.spreads.map(async (spread) => ({
        id: spread.id,
        templateId: spread.templateId,
        order: spread.order,
        slots: await Promise.all(
          spread.slots.map(async (slot) => ({
            id: slot.id,
            slotIndex: slot.slotIndex,
            assetId: slot.assetId,
            asset: {
              id: slot.asset.id,
              key: slot.asset.key,
              contentType: slot.asset.contentType,
              previewUrl: await this.storageService.getPresignedDownloadUrl(
                slot.asset.key,
              ),
            },
          })),
        ),
      })),
    );

    return {
      id: album.id,
      albumName: album.albumName,
      albumSpecId: album.albumSpecId,
      state: album.state,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      assets,
      spreads,
    };
  }
}
