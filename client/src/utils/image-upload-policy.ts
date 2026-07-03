export const MAX_IMAGE_COUNT = 50
export const MAX_IMAGE_SIZE_BYTES = 40 * 1024 * 1024

export const IMAGE_INPUT_ACCEPT = [
  '.heic',
  '.heif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
].join(',')

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const SUPPORTED_CONTENT_TYPES = new Set(Object.values(CONTENT_TYPE_BY_EXTENSION))

export type ImageSelectionErrorCode =
  | 'duplicate'
  | 'file-too-large'
  | 'selection-limit'
  | 'unsupported-format'

export interface RejectedImage {
  file: File
  code: ImageSelectionErrorCode
  message: string
}

export interface ImageSelectionResult {
  accepted: File[]
  rejected: RejectedImage[]
}

export function selectImageFiles(
  currentFiles: File[],
  incomingFiles: File[],
): ImageSelectionResult {
  const accepted: File[] = []
  const rejected: RejectedImage[] = []
  const fileIdentities = new Set(currentFiles.map(getFileIdentity))

  for (const file of incomingFiles) {
    const identity = getFileIdentity(file)

    if (fileIdentities.has(identity)) {
      rejected.push({
        file,
        code: 'duplicate',
        message: `${file.name} has already been selected.`,
      })
      continue
    }

    if (!getImageContentType(file)) {
      rejected.push({
        file,
        code: 'unsupported-format',
        message: `${file.name} is not a supported image format.`,
      })
      continue
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      rejected.push({
        file,
        code: 'file-too-large',
        message: `${file.name} is larger than 40MB.`,
      })
      continue
    }

    if (currentFiles.length + accepted.length >= MAX_IMAGE_COUNT) {
      rejected.push({
        file,
        code: 'selection-limit',
        message: `You can select up to ${MAX_IMAGE_COUNT} photographs.`,
      })
      continue
    }

    accepted.push(file)
    fileIdentities.add(identity)
  }

  return { accepted, rejected }
}

export function getImageContentType(file: File): string | null {
  if (SUPPORTED_CONTENT_TYPES.has(file.type)) return file.type

  return CONTENT_TYPE_BY_EXTENSION[getFileExtension(file.name)] ?? null
}

export function getFileIdentity(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}
