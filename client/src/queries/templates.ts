import { useQuery } from '@tanstack/react-query'

import { getLayoutTemplates } from '../api/templates'
import type { LayoutTemplate } from '../api/templates'

export function useLayoutTemplatesQuery(albumSpecId: string | null) {
  return useQuery<LayoutTemplate[], Error>({
    queryKey: ['layout-templates', albumSpecId],
    queryFn: () => {
      if (!albumSpecId) {
        throw new Error('albumSpecId is required.')
      }

      return getLayoutTemplates(albumSpecId)
    },
    enabled: Boolean(albumSpecId),
  })
}
