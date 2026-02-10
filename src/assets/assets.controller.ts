import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { AssetsService } from './assets.service';

interface CreateUploadUrlDto {
  filename: string;
  contentType: string;
}

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload-url')
  createUploadUrl(
    @Body() dto: CreateUploadUrlDto,
  ): Promise<{ assetId: string; uploadUrl: string }> {
    return this.assetsService.createUploadUrl(dto);
  }

  @Delete(':assetId')
  deleteAsset(@Param('assetId') assetId: string): Promise<void> {
    return this.assetsService.deleteAsset(assetId);
  }
}
