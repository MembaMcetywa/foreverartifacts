import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LayoutModule } from './layout/layout.module';
import { AssetsModule } from './assets/assets.module';
import { AlbumsModule } from './albums/albums.module';
import { RenderModule } from './render/render.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [LayoutModule, AssetsModule, AlbumsModule, RenderModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
