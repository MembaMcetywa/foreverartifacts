import { useMutation } from '@tanstack/react-query'

import {
  completeAssetUpload,
  createUploadUrl,
  uploadAsset,
} from '../api/assets'
import type { CompleteAssetResponse } from '../api/assets'

export interface UploadAssetInput {
  file: File
  contentType: string
}

export interface UploadedAssetResult extends CompleteAssetResponse {
  filename: string
}

export function useUploadAssetMutation() {
  return useMutation<UploadedAssetResult, Error, UploadAssetInput>({
    mutationFn: async ({ file, contentType }) => {
      const { assetId, uploadUrl } = await createUploadUrl({
        filename: file.name,
        contentType,
      })

      await uploadAsset(uploadUrl, file, contentType)

      const completedAsset = await completeAssetUpload(assetId)

      return {
        ...completedAsset,
        filename: file.name,
      }
    },
  })
}
