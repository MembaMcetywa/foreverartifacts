import { useMutation } from '@tanstack/react-query'

import type { AddSpreadInput} from '../api/spreads';
import { addSpread } from '../api/spreads'

export function useAddSpreadMutation() {
  return useMutation<void, Error, AddSpreadInput>({
    mutationFn: addSpread,
  })
}
