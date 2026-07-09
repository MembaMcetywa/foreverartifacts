import { useMutation } from '@tanstack/react-query'

import type { Album } from '../api/albums'
import type { AddSpreadInput } from '../api/spreads'
import { addSpread } from '../api/spreads'

export function useAddSpreadMutation() {
  return useMutation<Album, Error, AddSpreadInput>({
    mutationFn: addSpread,
  })
}
