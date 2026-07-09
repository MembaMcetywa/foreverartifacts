import { useMutation } from '@tanstack/react-query'

import type { Album } from '../api/albums'
import type { AddSpreadInput, SaveSpreadAtPositionInput } from '../api/spreads'
import { addSpread, saveSpreadAtPosition } from '../api/spreads'

export function useAddSpreadMutation() {
  return useMutation<Album, Error, AddSpreadInput>({
    mutationFn: addSpread,
  })
}

export function useSaveSpreadAtPositionMutation() {
  return useMutation<Album, Error, SaveSpreadAtPositionInput>({
    mutationFn: saveSpreadAtPosition,
  })
}
