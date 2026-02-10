import { Module } from '@nestjs/common';
import { LayoutRegistryService } from './layout.registry.service';

@Module({
  providers: [LayoutRegistryService],
  exports: [LayoutRegistryService],
})
export class LayoutModule {}
