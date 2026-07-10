import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  ALBUM_WORKFLOW_STAGES,
  AlbumWorkflowStage,
} from './album.types';

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

export class AlbumSpreadOrderPositionDto {
  @IsInt()
  @Min(1)
  @Max(12)
  position: number;

  @IsUUID('4')
  spreadId: string;
}

export class ReorderAlbumSpreadsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AlbumSpreadOrderPositionDto)
  positions: AlbumSpreadOrderPositionDto[];
}

export class UpdateAlbumWorkflowDto {
  @IsIn(ALBUM_WORKFLOW_STAGES)
  workflowStage: AlbumWorkflowStage;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  activeSpreadPosition?: number | null;
}

export interface AlbumResponseDto {
  id: string;
  albumName: string;
  albumSpecId: string;
  state: string;
  workflowStage: AlbumWorkflowStage;
  activeSpreadPosition: number | null;
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
