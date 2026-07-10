import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';

import { RenderService } from '../render/render.service';
import { AlbumPresenter } from './album.presenter';
import {
  AddAlbumAssetsDto,
  AddAlbumSpreadDto,
  AlbumResponseDto,
  CreateAlbumDto,
  ReorderAlbumSpreadsDto,
  UpdateAlbumSpreadDto,
  UpdateAlbumWorkflowDto,
} from './albums.dto';
import { AlbumsService } from './albums.service';

@Controller('albums')
export class AlbumsController {
  constructor(
    private readonly albumsService: AlbumsService,
    private readonly renderService: RenderService,
    private readonly albumPresenter: AlbumPresenter,
  ) {}

  @Post()
  async create(@Body() body: CreateAlbumDto): Promise<AlbumResponseDto> {
    const album = await this.albumsService.createAlbum(body);
    return this.albumPresenter.toDto(album);
  }

  @Get()
  async list(): Promise<AlbumResponseDto[]> {
    const albums = await this.albumsService.listAlbums();
    return Promise.all(albums.map((album) => this.albumPresenter.toDto(album)));
  }

  @Get(':id')
  async get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.getAlbum(id);
    return this.albumPresenter.toDto(album);
  }

  @Post(':id/assets')
  async addAssets(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: AddAlbumAssetsDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.addAssets(id, body.assetIds);
    return this.albumPresenter.toDto(album);
  }

  @Post(':id/spreads')
  async addSpread(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() spread: AddAlbumSpreadDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.addSpread(id, spread);
    return this.albumPresenter.toDto(album);
  }

  @Put(':id/spreads/positions/:position')
  async saveSpreadAtPosition(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('position', ParseIntPipe) position: number,
    @Body() spread: UpdateAlbumSpreadDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.saveSpreadAtPosition(
      id,
      position,
      spread,
    );
    return this.albumPresenter.toDto(album);
  }

  @Patch(':id/spreads/:spreadId')
  async updateSpread(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('spreadId', new ParseUUIDPipe({ version: '4' })) spreadId: string,
    @Body() spread: UpdateAlbumSpreadDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.updateSpread(id, spreadId, spread);
    return this.albumPresenter.toDto(album);
  }

  @Put(':id/spreads/order')
  async reorderSpreads(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ReorderAlbumSpreadsDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.reorderSpreads(id, body.positions);
    return this.albumPresenter.toDto(album);
  }

  @Patch(':id/workflow')
  async updateWorkflow(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateAlbumWorkflowDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.updateWorkflow(id, body);
    return this.albumPresenter.toDto(album);
  }

  @Delete(':id/spreads')
  async clearSpreads(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.clearSpreads(id);
    return this.albumPresenter.toDto(album);
  }

  @Post(':id/render')
  async render(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
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
}
