import { Module } from '@nestjs/common';

import { LayoutModule } from '../layout/layout.module';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { RenderModule } from 'src/render/render.module';
import { StorageModule } from '../storage/storage.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [LayoutModule, RenderModule, DatabaseModule, StorageModule],
  providers: [AlbumsService],
  controllers: [AlbumsController],
  exports: [AlbumsService],
})
export class AlbumsModule {}
