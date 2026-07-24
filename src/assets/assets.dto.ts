import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const SUPPORTED_UPLOAD_CONTENT_TYPES = [
  'application/octet-stream',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export class CreateUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename: string;

  @IsString()
  @IsIn(SUPPORTED_UPLOAD_CONTENT_TYPES)
  contentType: string;
}

export class CreateUploadUrlsBatchDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateUploadUrlDto)
  files: CreateUploadUrlDto[];
}

export class CompleteAssetResponseDto {
  assetId: string;
  status: 'ready';
  width: number;
  height: number;
  previewUrl: string;
}
