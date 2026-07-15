import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';

import { AuthenticatedRequest } from '../auth/auth.types';
import { CompleteAssetResponseDto, CreateUploadUrlDto } from './assets.dto';
import { AssetProcessingError, AssetsService } from './assets.service';
import { ImageNormalizationError } from './image-normalizer.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload-url')
  createUploadUrl(
    @Body() dto: CreateUploadUrlDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ assetId: string; uploadUrl: string }> {
    return this.assetsService.createUploadUrl({
      ...dto,
      userId: request.user.id,
    });
  }

  @Post(':assetId/complete')
  async completeUpload(
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<CompleteAssetResponseDto> {
    try {
      return await this.assetsService.completeUpload(request.user.id, assetId);
    } catch (error) {
      if (error instanceof ImageNormalizationError) {
        throw new BadRequestException(error.message);
      }

      if (error instanceof AssetProcessingError) {
        if (error.code === 'not-found') {
          throw new NotFoundException(error.message);
        }

        if (
          error.code === 'already-processing' ||
          error.code === 'invalid-state'
        ) {
          throw new ConflictException(error.message);
        }

        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  @Delete(':assetId')
  deleteAsset(
    @Param('assetId') assetId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    return this.assetsService.deleteAsset(request.user.id, assetId);
  }
}
