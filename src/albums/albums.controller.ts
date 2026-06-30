import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { RenderService } from '../render/render.service';
import { AlbumPresenter } from './album.presenter';
import {
  AddAlbumSpreadDto,
  AlbumResponseDto,
  CreateAlbumDto,
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

  @Post(':id/spreads')
  async addSpread(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() spread: AddAlbumSpreadDto,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.addSpread(id, spread);
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
  async render(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
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
