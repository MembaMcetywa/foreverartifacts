import { useQuery } from '@tanstack/react-query'

import { getLayoutTemplates } from '../api/templates'
import type { LayoutTemplate } from '../api/templates'

export function useLayoutTemplatesQuery(albumSpecId: string) {
  return useQuery<LayoutTemplate[], Error>({
    queryKey: ['layout-templates', albumSpecId],
    queryFn: () => getLayoutTemplates(albumSpecId),
  })
}
