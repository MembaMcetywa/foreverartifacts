import { Module } from '@nestjs/common';
import { LayoutController } from './layout.controller';
import { LayoutRegistryService } from './layout.registry.service';

@Module({
  controllers: [LayoutController],
  providers: [LayoutRegistryService],
  exports: [LayoutRegistryService],
})
export class LayoutModule {}
