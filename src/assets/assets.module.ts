import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StorageModule } from '../storage/storage.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { ImageNormalizerService } from './image-normalizer.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [ConfigModule, StorageModule, DatabaseModule],
  controllers: [AssetsController],
  providers: [AssetsService, ImageNormalizerService],
  exports: [AssetsService],
})
export class AssetsModule {}
