import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../database/prisma.service';
import { LayoutRegistryService } from '../layout/layout.registry.service';
import { AlbumSpread, AlbumState } from './album.types';

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
        albumName: albumId,
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

  async addSpread(albumId: string, spread: AlbumSpread) {
    const album = await this.getAlbum(albumId);

    const library = this.layoutRegistry.getLayoutLibrary(album.albumSpecId);
    const template = library.templates.find(
      (template) => template.id === spread.templateId,
    );

    if (!template) {
      throw new Error(
        `Unknown template '${spread.templateId}' for album '${albumId}'.`,
      );
    }

    if (spread.slots.length !== template.imageSlots) {
      throw new Error(
        `Template '${template.id}' requires ${template.imageSlots} image slots.`,
      );
    }

    const order = album.spreads.length;

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
}
