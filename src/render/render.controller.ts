import { Controller, Get, Query } from '@nestjs/common';

import { StorageService } from '../storage/storage.service';

@Controller('render')
export class RenderController {
  constructor(private readonly storage: StorageService) {}

  @Get('download-url')
  async getDownloadUrl(
    @Query('key') key: string,
  ): Promise<{ downloadUrl: string }> {
    const downloadUrl = await this.storage.getPresignedDownloadUrl(key);

    return { downloadUrl };
  }
}
