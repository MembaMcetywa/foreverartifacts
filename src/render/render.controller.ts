import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';

import { AuthenticatedRequest } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';

@Controller('render')
export class RenderController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('albums/:albumId/download-url')
  async getDownloadUrl(
    @Param('albumId', new ParseUUIDPipe({ version: '4' })) albumId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ downloadUrl: string }> {
    const album = await this.prisma.album.findFirst({
      where: {
        id: albumId,
        userId: request.user.id,
      },
      select: {
        renderArtifactKey: true,
        renderStatus: true,
      },
    });

    if (!album) {
      throw new NotFoundException(`Album '${albumId}' not found.`);
    }

    if (!album.renderArtifactKey) {
      throw new BadRequestException('The rendered PDF is missing.');
    }

    const downloadUrl = await this.storage.getPresignedDownloadUrl(
      album.renderArtifactKey,
    );

    return { downloadUrl };
  }
}
