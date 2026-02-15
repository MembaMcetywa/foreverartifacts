import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StorageModule } from '../storage/storage.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  imports: [ConfigModule, StorageModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
