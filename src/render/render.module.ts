import { Module } from '@nestjs/common';

import { LayoutModule } from '../layout/layout.module';
import { AssetsModule } from '../assets/assets.module';
import { StorageModule } from '../storage/storage.module';

import { RenderService } from './render.service';
import { RenderController } from './render.controller';

@Module({
  imports: [LayoutModule, AssetsModule, StorageModule],
  providers: [RenderService],
  controllers: [RenderController],
  exports: [RenderService],
})
export class RenderModule {}
