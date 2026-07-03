import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import appCss from '../styles.css?url'

const queryClient = new QueryClient()
const siteUrl = 'https://foreverartifacts.co.za'
const socialPreviewUrl = `${siteUrl}/brand/social-preview.png`
const siteDescription =
  'Turn the photographs that matter into a carefully designed and hand crafted book you can hold, revisit and keep.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Forever Artifacts',
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:site_name',
        content: 'Forever Artifacts',
      },
      {
        property: 'og:title',
        content: 'Forever Artifacts',
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: siteUrl,
      },
      {
        property: 'og:image',
        content: socialPreviewUrl,
      },
      {
        property: 'og:image:type',
        content: 'image/png',
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        property: 'og:image:alt',
        content: 'Forever Artifacts book mark',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Forever Artifacts',
      },
      {
        name: 'twitter:description',
        content: siteDescription,
      },
      {
        name: 'twitter:image',
        content: socialPreviewUrl,
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/brand/fa-favicon.svg',
        sizes: 'any',
      },
      {
        rel: 'apple-touch-icon',
        href: '/brand/apple-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'canonical',
        href: siteUrl,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
