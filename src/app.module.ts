import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LayoutModule } from './layout/layout.module';
import { AssetsModule } from './assets/assets.module';
import { AlbumsModule } from './albums/albums.module';
import { RenderModule } from './render/render.module';
import { StorageModule } from './storage/storage.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LayoutModule,
    AssetsModule,
    AlbumsModule,
    RenderModule,
    StorageModule,
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
