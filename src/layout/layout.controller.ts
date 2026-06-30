import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { LayoutRegistryService } from './layout.registry.service';
import { LayoutTemplate } from './layout.templates';

@Controller('layout')
export class LayoutController {
  constructor(private readonly layoutRegistry: LayoutRegistryService) {}

  @Get(':albumSpecId/templates')
  listTemplates(
    @Param('albumSpecId') albumSpecId: string,
  ): LayoutTemplate[] {
    try {
      return this.layoutRegistry.listTemplates(albumSpecId);
    } catch {
      throw new NotFoundException(
        `No templates found for album specification '${albumSpecId}'.`,
      );
    }
  }
}
