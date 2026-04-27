import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { RenderService } from '../render/render.service';
import { AlbumsService } from './albums.service';
import { AlbumSpread } from './album.types';

@Controller('albums')
export class AlbumsController {
  constructor(
    private readonly albumsService: AlbumsService,
    private readonly renderService: RenderService,
  ) {}

  @Post()
  create(@Body() body: { albumSpecId: string }) {
    return this.albumsService.createAlbum(body.albumSpecId);
  }

  @Get()
  list() {
    return this.albumsService.listAlbums();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.albumsService.getAlbum(id);
  }

  @Post(':id/spreads')
  addSpread(@Param('id') id: string, @Body() spread: AlbumSpread) {
    return this.albumsService.addSpread(id, spread);
  }

  @Post(':id/render')
  async render(@Param('id') id: string) {
    const album = this.albumsService.getAlbum(id);

    return this.renderService.renderAlbum({
      albumSpecId: album.albumSpecId,
      spreads: album.spreads,
    });
  }
}
