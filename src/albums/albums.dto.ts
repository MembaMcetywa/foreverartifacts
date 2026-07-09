import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  albumSpecId: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assetIds: string[];
}

export class AddAlbumAssetsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assetIds: string[];
}

export class AlbumSpreadSlotDto {
  @IsInt()
  @Min(0)
  slotIndex: number;

  @IsUUID('4')
  assetId: string;
}

export class AddAlbumSpreadDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AlbumSpreadSlotDto)
  slots: AlbumSpreadSlotDto[];
}

export class UpdateAlbumSpreadDto extends AddAlbumSpreadDto {}

export interface AlbumResponseDto {
  id: string;
  albumName: string;
  albumSpecId: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  assets: {
    assetId: string;
    key: string;
    sourceContentType: string;
    order: number;
    previewUrl: string;
  }[];
  spreads: {
    id: string;
    templateId: string;
    order: number;
    slots: {
      id: string;
      slotIndex: number;
      assetId: string;
      asset: {
        id: string;
        key: string;
        sourceContentType: string;
        previewUrl: string;
      };
    }[];
  }[];
  spreadPositions: {
    position: number;
    status: 'complete' | 'empty';
    spread: {
      id: string;
      templateId: string;
      order: number;
      slots: {
        id: string;
        slotIndex: number;
        assetId: string;
        asset: {
          id: string;
          key: string;
          sourceContentType: string;
          previewUrl: string;
        };
      }[];
    } | null;
  }[];
}
