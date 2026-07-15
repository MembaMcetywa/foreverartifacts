import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../database/prisma.service';
import { LayoutRegistryService } from '../layout/layout.registry.service';
import { RenderService } from '../render/render.service';
import { AlbumSpread, AlbumState, AlbumWorkflowStage } from './album.types';

const INTERIOR_SPREAD_COUNT = 12;

interface CreateAlbumInput {
  albumSpecId: string;
  assetIds: string[];
}

interface ReorderSpreadPositionInput {
  position: number;
  spreadId: string;
}

interface UpdateWorkflowInput {
  workflowStage: AlbumWorkflowStage;
  activeSpreadPosition?: number | null;
}

interface UpdateAlbumNameInput {
  albumName: string;
}

@Injectable()
export class AlbumsService {
  constructor(
    private readonly layoutRegistry: LayoutRegistryService,
    private readonly prisma: PrismaService,
    private readonly renderService: RenderService,
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
        workflowStage: 'collect_photos',
        renderStatus: 'not_started',
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

  async deleteAlbum(albumId: string) {
    await this.getAlbum(albumId);

    await this.prisma.album.delete({
      where: { id: albumId },
    });
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
      await this.markRenderStale(albumId);
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
    await this.markRenderStale(albumId);

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

    await this.markRenderStale(albumId);

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
    await this.markRenderStale(albumId);

    return this.getAlbum(albumId);
  }

  async reorderSpreads(
    albumId: string,
    positions: ReorderSpreadPositionInput[],
  ) {
    const album = await this.getAlbum(albumId);
    const requestedSpreadIds = positions.map((position) => position.spreadId);
    const requestedOrders = positions.map((position) =>
      this.getOrderForPosition(position.position),
    );

    if (new Set(requestedSpreadIds).size !== requestedSpreadIds.length) {
      throw new BadRequestException('Spread ids must be unique.');
    }

    if (new Set(requestedOrders).size !== requestedOrders.length) {
      throw new BadRequestException('Spread positions must be unique.');
    }

    const albumSpreadIds = new Set(album.spreads.map((spread) => spread.id));
    const missingSpreadIds = requestedSpreadIds.filter(
      (spreadId) => !albumSpreadIds.has(spreadId),
    );
    const omittedSpreadIds = album.spreads
      .map((spread) => spread.id)
      .filter((spreadId) => !requestedSpreadIds.includes(spreadId));

    if (missingSpreadIds.length > 0) {
      throw new BadRequestException(
        `Spreads are not part of this album: ${missingSpreadIds.join(', ')}.`,
      );
    }

    if (omittedSpreadIds.length > 0) {
      throw new BadRequestException(
        `Every existing spread must be included in the reorder request.`,
      );
    }

    await this.prisma.$transaction([
      ...positions.map((position, index) =>
        this.prisma.albumSpread.update({
          where: { id: position.spreadId },
          data: { order: -index - 1 },
        }),
      ),
      ...positions.map((position) =>
        this.prisma.albumSpread.update({
          where: { id: position.spreadId },
          data: { order: this.getOrderForPosition(position.position) },
        }),
      ),
    ]);
    await this.markRenderStale(albumId);

    return this.getAlbum(albumId);
  }

  async clearSpreads(albumId: string) {
    await this.getAlbum(albumId);

    await this.prisma.albumSpread.deleteMany({
      where: { albumId },
    });
    await this.markRenderStale(albumId);

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

  async updateWorkflow(albumId: string, input: UpdateWorkflowInput) {
    await this.getAlbum(albumId);

    if (
      input.activeSpreadPosition !== undefined &&
      input.activeSpreadPosition !== null
    ) {
      this.getOrderForPosition(input.activeSpreadPosition);
    }

    return this.prisma.album.update({
      where: { id: albumId },
      data: {
        workflowStage: input.workflowStage,
        activeSpreadPosition: input.activeSpreadPosition ?? null,
      },
      include: this.albumInclude(),
    });
  }

  async updateAlbumName(albumId: string, input: UpdateAlbumNameInput) {
    await this.getAlbum(albumId);
    const albumName = input.albumName.trim();

    if (!albumName) {
      throw new BadRequestException('Album name is required.');
    }

    return this.prisma.album.update({
      where: { id: albumId },
      data: { albumName },
      include: this.albumInclude(),
    });
  }

  async startRender(albumId: string) {
    const album = await this.getAlbum(albumId);
    this.assertReadyForRender(album);

    await this.prisma.album.update({
      where: { id: albumId },
      data: {
        workflowStage: 'render_album',
        activeSpreadPosition: null,
        renderStatus: 'rendering',
        renderApprovedAt: null,
      },
    });

    try {
      const render = await this.renderService.renderAlbum({
        albumSpecId: album.albumSpecId,
        spreads: album.spreads.map((spread) => ({
          templateId: spread.templateId,
          slots: spread.slots.map((slot) => ({
            slotIndex: slot.slotIndex,
            assetId: slot.assetId,
          })),
        })),
      });

      return this.prisma.album.update({
        where: { id: albumId },
        data: {
          workflowStage: 'render_album',
          renderStatus: 'ready',
          renderId: render.renderId,
          renderArtifactKey: render.pdfKey,
          renderCompletedAt: new Date(),
          renderApprovedAt: null,
        },
        include: this.albumInclude(),
      });
    } catch (error) {
      await this.prisma.album.update({
        where: { id: albumId },
        data: {
          renderStatus: 'failed',
        },
      });

      throw error;
    }
  }

  async approveRender(albumId: string) {
    const album = await this.getAlbum(albumId);

    if (album.renderStatus !== 'ready') {
      throw new BadRequestException(
        'The book PDF must be rendered before continuing to order.',
      );
    }

    if (!album.renderArtifactKey || !album.renderId) {
      throw new BadRequestException('The rendered PDF is missing.');
    }

    return this.prisma.album.update({
      where: { id: albumId },
      data: {
        workflowStage: 'ready_to_order',
        activeSpreadPosition: null,
        renderStatus: 'approved',
        renderApprovedAt: new Date(),
      },
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

  private assertReadyForRender(
    album: Awaited<ReturnType<AlbumsService['getAlbum']>>,
  ) {
    if (album.spreads.length !== INTERIOR_SPREAD_COUNT) {
      throw new BadRequestException(
        `All ${INTERIOR_SPREAD_COUNT} spreads must be complete before continuing.`,
      );
    }
  }

  private async markRenderStale(albumId: string) {
    await this.prisma.album.updateMany({
      where: {
        id: albumId,
        renderStatus: {
          in: ['ready', 'approved'],
        },
      },
      data: {
        renderStatus: 'stale',
        renderApprovedAt: null,
      },
    });
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


