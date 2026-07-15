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
  Req,
} from '@nestjs/common';

import { AuthenticatedRequest } from '../auth/auth.types';
import { AlbumPresenter } from './album.presenter';
import {
  AddAlbumAssetsDto,
  AddAlbumSpreadDto,
  AlbumResponseDto,
  CreateAlbumDto,
  ReorderAlbumSpreadsDto,
  UpdateAlbumNameDto,
  UpdateAlbumSpreadDto,
  UpdateAlbumWorkflowDto,
} from './albums.dto';
import { AlbumsService } from './albums.service';

@Controller('albums')
export class AlbumsController {
  constructor(
    private readonly albumsService: AlbumsService,
    private readonly albumPresenter: AlbumPresenter,
  ) {}

  @Post()
  async create(
    @Body() body: CreateAlbumDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.createAlbum({
      ...body,
      userId: request.user.id,
    });
    return this.albumPresenter.toDto(album);
  }

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto[]> {
    const albums = await this.albumsService.listAlbums(request.user.id);
    return Promise.all(albums.map((album) => this.albumPresenter.toDto(album)));
  }

  @Get(':id')
  async get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.getAlbum(request.user.id, id);
    return this.albumPresenter.toDto(album);
  }

  @Post(':id/assets')
  async addAssets(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: AddAlbumAssetsDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.addAssets(
      request.user.id,
      id,
      body.assetIds,
    );
    return this.albumPresenter.toDto(album);
  }

  @Post(':id/spreads')
  async addSpread(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() spread: AddAlbumSpreadDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.addSpread(
      request.user.id,
      id,
      spread,
    );
    return this.albumPresenter.toDto(album);
  }

  @Put(':id/spreads/positions/:position')
  async saveSpreadAtPosition(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('position', ParseIntPipe) position: number,
    @Body() spread: UpdateAlbumSpreadDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.saveSpreadAtPosition(
      request.user.id,
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
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.updateSpread(
      request.user.id,
      id,
      spreadId,
      spread,
    );
    return this.albumPresenter.toDto(album);
  }

  @Put(':id/spreads/order')
  async reorderSpreads(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ReorderAlbumSpreadsDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.reorderSpreads(
      request.user.id,
      id,
      body.positions,
    );
    return this.albumPresenter.toDto(album);
  }

  @Patch(':id/workflow')
  async updateWorkflow(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateAlbumWorkflowDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.updateWorkflow(
      request.user.id,
      id,
      body,
    );
    return this.albumPresenter.toDto(album);
  }

  @Patch(':id/name')
  async updateName(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateAlbumNameDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.updateAlbumName(
      request.user.id,
      id,
      body,
    );
    return this.albumPresenter.toDto(album);
  }

  @Delete(':id')
  async deleteAlbum(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.albumsService.deleteAlbum(request.user.id, id);
  }

  @Delete(':id/spreads')
  async clearSpreads(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.clearSpreads(request.user.id, id);
    return this.albumPresenter.toDto(album);
  }

  @Post(':id/render/start')
  async startRender(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.startRender(request.user.id, id);
    return this.albumPresenter.toDto(album);
  }

  @Post(':id/render/approve')
  async approveRender(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<AlbumResponseDto> {
    const album = await this.albumsService.approveRender(request.user.id, id);
    return this.albumPresenter.toDto(album);
  }
}
