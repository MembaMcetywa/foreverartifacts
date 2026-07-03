import { Injectable } from '@nestjs/common';
import heicConvert from 'heic-convert';
import { imageSize } from 'image-size';
import sharp from 'sharp';

const MAX_IMAGE_PIXELS = 100_000_000;

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp' | 'heic';

export type ImageNormalizationErrorCode =
  | 'invalid-image'
  | 'pixel-limit-exceeded'
  | 'unsupported-format';

export class ImageNormalizationError extends Error {
  constructor(
    readonly code: ImageNormalizationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ImageNormalizationError';
  }
}

export interface NormalizedImage {
  sourceFormat: SupportedImageFormat;
  width: number;
  height: number;
  printBuffer: Buffer;
  previewBuffer: Buffer;
}

@Injectable()
export class ImageNormalizerService {
  async normalize(input: Buffer): Promise<NormalizedImage> {
    const sourceFormat = detectImageFormat(input);
    assertPixelLimit(input);

    try {
      const decodedInput =
        sourceFormat === 'heic'
          ? Buffer.from(
              await heicConvert({
                buffer: input,
                format: 'PNG',
              }),
            )
          : input;

      const printBuffer = await sharp(decodedInput, {
        failOn: 'error',
        limitInputPixels: MAX_IMAGE_PIXELS,
      })
        .rotate()
        .flatten({ background: '#ffffff' })
        .toColourspace('srgb')
        .withIccProfile('srgb')
        .jpeg({
          quality: 95,
          chromaSubsampling: '4:4:4',
        })
        .toBuffer();

      const metadata = await sharp(printBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Normalized image dimensions are unavailable.');
      }

      const previewBuffer = await sharp(printBuffer)
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 82 })
        .toBuffer();

      return {
        sourceFormat,
        width: metadata.width,
        height: metadata.height,
        printBuffer,
        previewBuffer,
      };
    } catch (error) {
      if (error instanceof ImageNormalizationError) throw error;

      throw new ImageNormalizationError(
        'invalid-image',
        'The image could not be decoded or normalized.',
      );
    }
  }
}

export function detectImageFormat(input: Buffer): SupportedImageFormat {
  if (
    input.length >= 3 &&
    input[0] === 0xff &&
    input[1] === 0xd8 &&
    input[2] === 0xff
  ) {
    return 'jpeg';
  }

  if (
    input.length >= 8 &&
    input.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return 'png';
  }

  if (
    input.length >= 12 &&
    input.toString('ascii', 0, 4) === 'RIFF' &&
    input.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  if (isHeic(input)) return 'heic';

  throw new ImageNormalizationError(
    'unsupported-format',
    'Supported image formats are JPEG, PNG, WebP, HEIC and HEIF.',
  );
}

function assertPixelLimit(input: Buffer): void {
  let dimensions: ReturnType<typeof imageSize>;

  try {
    dimensions = imageSize(input);
  } catch {
    throw new ImageNormalizationError(
      'invalid-image',
      'The image dimensions could not be read.',
    );
  }

  if (!dimensions.width || !dimensions.height) {
    throw new ImageNormalizationError(
      'invalid-image',
      'The image dimensions could not be read.',
    );
  }

  if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
    throw new ImageNormalizationError(
      'pixel-limit-exceeded',
      'Images must not exceed 100 megapixels.',
    );
  }
}

function isHeic(input: Buffer): boolean {
  if (input.length < 16 || input.toString('ascii', 4, 8) !== 'ftyp') {
    return false;
  }

  const brands = input.toString('ascii', 8, Math.min(input.length, 64));
  const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'];

  if (heicBrands.some((brand) => brands.includes(brand))) return true;

  return brands.includes('mif1') && !brands.includes('avif');
}
