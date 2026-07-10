import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import {
  LayoutRegistryService,
  LayoutTemplatePreview,
} from './layout.registry.service';

@Controller('layout')
export class LayoutController {
  constructor(private readonly layoutRegistry: LayoutRegistryService) {}

  @Get(':albumSpecId/templates')
  listTemplates(
    @Param('albumSpecId') albumSpecId: string,
  ): LayoutTemplatePreview[] {
    try {
      return this.layoutRegistry.listTemplatePreviews(albumSpecId);
    } catch {
      throw new NotFoundException(
        `No templates found for album specification '${albumSpecId}'.`,
      );
    }
  }
}
