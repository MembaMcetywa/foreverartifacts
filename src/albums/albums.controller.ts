import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { RenderService } from '../render/render.service';
import { StorageService } from '../storage/storage.service';
import { AlbumsService } from './albums.service';
import { AlbumSpread } from './album.types';

type AlbumRecord = Awaited<ReturnType<AlbumsService['getAlbum']>>;

@Controller('albums')
export class AlbumsController {
  constructor(
    private readonly albumsService: AlbumsService,
    private readonly renderService: RenderService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() body: { albumSpecId: string; assetIds: string[] }) {
    return this.albumsService.createAlbum({
      albumSpecId: body.albumSpecId,
      assetIds: body.assetIds,
    });
  }

  @Get()
  list() {
    return this.albumsService.listAlbums();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const album = await this.albumsService.getAlbum(id);

    return this.toAlbumDto(album);
  }

  @Post(':id/spreads')
  addSpread(@Param('id') id: string, @Body() spread: AlbumSpread) {
    return this.albumsService.addSpread(id, spread);
  }

  @Post(':id/render')
  async render(@Param('id') id: string) {
    const album = await this.albumsService.getAlbum(id);

    return this.renderService.renderAlbum({
      albumSpecId: album.albumSpecId,
      spreads: album.spreads.map((spread) => ({
        templateId: spread.templateId,
        slots: spread.slots.map((slot) => ({
          slotIndex: slot.slotIndex,
          assetId: slot.assetId,
        })),
      })),
    });
  }

private async toAlbumDto(album: AlbumRecord) {
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
