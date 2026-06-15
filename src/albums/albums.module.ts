import { Module } from '@nestjs/common';

import { LayoutModule } from '../layout/layout.module';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { RenderModule } from 'src/render/render.module';

@Module({
  imports: [LayoutModule, RenderModule],
  providers: [AlbumsService],
  controllers: [AlbumsController],
  exports: [AlbumsService],
})
export class AlbumsModule {}
