import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../database/prisma.service';
import { LayoutRegistryService } from '../layout/layout.registry.service';
import { AlbumSpread, AlbumState } from './album.types';

const INTERIOR_SPREAD_COUNT = 12;

interface CreateAlbumInput {
  albumSpecId: string;
  assetIds: string[];
}

@Injectable()
export class AlbumsService {
  constructor(
    private readonly layoutRegistry: LayoutRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async createAlbum(input: CreateAlbumInput) {
    this.layoutRegistry.getAlbumSpec(input.albumSpecId);

    const albumId = randomUUID();

    return this.prisma.album.create({
      data: {
        id: albumId,
        albumName: 'Untitled',
        albumSpecId: input.albumSpecId,
        state: 'draft',
        assets: {
          create: input.assetIds.map((assetId, index) => ({
            id: randomUUID(),
            assetId,
            order: index,
          })),
        },
      },
      include: this.albumInclude(),
    });
  }

  async getAlbum(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: this.albumInclude(),
    });

    if (!album) {
      throw new NotFoundException(`Album '${albumId}' not found.`);
    }

    return album;
  }

  async addAssets(albumId: string, assetIds: string[]) {
    const album = await this.getAlbum(albumId);
    const existingAssetIds = new Set(
      album.assets.map((albumAsset) => albumAsset.assetId),
    );
    const newAssetIds = assetIds.filter(
      (assetId) => !existingAssetIds.has(assetId),
    );
    const readyAssets = await this.prisma.asset.findMany({
      where: {
        id: { in: newAssetIds },
        status: 'ready',
      },
      select: { id: true },
    });
    const readyAssetIds = new Set(readyAssets.map((asset) => asset.id));
    const missingAssetIds = newAssetIds.filter(
      (assetId) => !readyAssetIds.has(assetId),
    );

    if (missingAssetIds.length > 0) {
      throw new BadRequestException(
        `Assets are not ready or do not exist: ${missingAssetIds.join(', ')}.`,
      );
    }

    const nextOrder =
      album.assets.length > 0
        ? Math.max(...album.assets.map((albumAsset) => albumAsset.order)) + 1
        : 0;

    if (newAssetIds.length > 0) {
      await this.prisma.albumAsset.createMany({
        data: newAssetIds.map((assetId, index) => ({
          id: randomUUID(),
          albumId,
          assetId,
          order: nextOrder + index,
        })),
      });
    }

    return this.getAlbum(albumId);
  }

  async addSpread(albumId: string, spread: AlbumSpread) {
    const album = await this.getAlbum(albumId);
    this.validateSpread(album, spread);

    const usedOrders = new Set(
      album.spreads.map((albumSpread) => albumSpread.order),
    );
    const order = Array.from(
      { length: INTERIOR_SPREAD_COUNT },
      (_, index) => index,
    ).find((spreadOrder) => !usedOrders.has(spreadOrder));

    if (order === undefined) {
      throw new BadRequestException('All 12 interior spreads are complete.');
    }

    await this.prisma.albumSpread.create({
      data: {
        id: randomUUID(),
        albumId,
        templateId: spread.templateId,
        order,
        slots: {
          create: spread.slots.map((slot) => ({
            id: randomUUID(),
            slotIndex: slot.slotIndex,
            assetId: slot.assetId,
          })),
        },
      },
    });

    return this.getAlbum(albumId);
  }

  async saveSpreadAtPosition(
    albumId: string,
    position: number,
    spread: AlbumSpread,
  ) {
    const album = await this.getAlbum(albumId);
    const order = this.getOrderForPosition(position);
    const existingSpread = album.spreads.find(
      (albumSpread) => albumSpread.order === order,
    );

    this.validateSpread(album, spread);

    if (existingSpread) {
      await this.prisma.$transaction([
        this.prisma.albumSlot.deleteMany({
          where: { spreadId: existingSpread.id },
        }),
        this.prisma.albumSpread.update({
          where: { id: existingSpread.id },
          data: {
            templateId: spread.templateId,
            slots: {
              create: spread.slots.map((slot) => ({
                id: randomUUID(),
                slotIndex: slot.slotIndex,
                assetId: slot.assetId,
              })),
            },
          },
        }),
      ]);
    }

    if (!existingSpread) {
      await this.prisma.albumSpread.create({
        data: {
          id: randomUUID(),
          albumId,
          templateId: spread.templateId,
          order,
          slots: {
            create: spread.slots.map((slot) => ({
              id: randomUUID(),
              slotIndex: slot.slotIndex,
              assetId: slot.assetId,
            })),
          },
        },
      });
    }

    return this.getAlbum(albumId);
  }

  async updateSpread(albumId: string, spreadId: string, spread: AlbumSpread) {
    const album = await this.getAlbum(albumId);
    const existingSpread = album.spreads.find(
      (albumSpread) => albumSpread.id === spreadId,
    );

    if (!existingSpread) {
      throw new NotFoundException(
        `Spread '${spreadId}' was not found in album '${albumId}'.`,
      );
    }

    this.validateSpread(album, spread);

    await this.prisma.$transaction([
      this.prisma.albumSlot.deleteMany({
        where: { spreadId },
      }),
      this.prisma.albumSpread.update({
        where: { id: spreadId },
        data: {
          templateId: spread.templateId,
          slots: {
            create: spread.slots.map((slot) => ({
              id: randomUUID(),
              slotIndex: slot.slotIndex,
              assetId: slot.assetId,
            })),
          },
        },
      }),
    ]);

    return this.getAlbum(albumId);
  }

  async clearSpreads(albumId: string) {
    await this.getAlbum(albumId);

    await this.prisma.albumSpread.deleteMany({
      where: { albumId },
    });

    return this.getAlbum(albumId);
  }

  async setState(albumId: string, state: AlbumState) {
    await this.getAlbum(albumId);

    return this.prisma.album.update({
      where: { id: albumId },
      data: { state },
      include: this.albumInclude(),
    });
  }

  async listAlbums() {
    return this.prisma.album.findMany({
      include: this.albumInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  private albumInclude() {
    return {
      assets: {
        orderBy: { order: 'asc' as const },
        include: {
          asset: true,
        },
      },
      spreads: {
        orderBy: { order: 'asc' as const },
        include: {
          slots: {
            orderBy: { slotIndex: 'asc' as const },
            include: {
              asset: true,
            },
          },
        },
      },
    };
  }

  private validateSpread(
    album: Awaited<ReturnType<AlbumsService['getAlbum']>>,
    spread: AlbumSpread,
  ) {
    const library = this.layoutRegistry.getLayoutLibrary(album.albumSpecId);
    const template = library.templates.find(
      (template) => template.id === spread.templateId,
    );

    if (!template) {
      throw new BadRequestException(
        `Unknown template '${spread.templateId}' for album '${album.id}'.`,
      );
    }

    if (spread.slots.length !== template.imageSlots) {
      throw new BadRequestException(
        `Template '${template.id}' requires ${template.imageSlots} image slots.`,
      );
    }

    const expectedSlotIndices = Array.from(
      { length: template.imageSlots },
      (_, index) => index,
    );
    const slotIndices = spread.slots
      .map((slot) => slot.slotIndex)
      .sort((left, right) => left - right);
    const hasExpectedSlotIndices = expectedSlotIndices.every(
      (slotIndex, index) => slotIndices[index] === slotIndex,
    );

    if (!hasExpectedSlotIndices) {
      throw new BadRequestException(
        `Template '${template.id}' requires slot indices ${expectedSlotIndices.join(', ')}.`,
      );
    }

    const albumAssetIds = new Set(
      album.assets.map((albumAsset) => albumAsset.assetId),
    );
    const missingAssetIds = spread.slots
      .map((slot) => slot.assetId)
      .filter((assetId) => !albumAssetIds.has(assetId));

    if (missingAssetIds.length > 0) {
      throw new BadRequestException(
        `Photographs are not attached to this album: ${missingAssetIds.join(', ')}.`,
      );
    }
  }

  private getOrderForPosition(position: number) {
    if (
      !Number.isInteger(position) ||
      position < 1 ||
      position > INTERIOR_SPREAD_COUNT
    ) {
      throw new BadRequestException(
        `Spread position must be between 1 and ${INTERIOR_SPREAD_COUNT}.`,
      );
    }

    return position - 1;
  }
}
