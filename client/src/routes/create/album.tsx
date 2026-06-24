import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

import { useCreateAlbumStore } from '../../stores/albumStore'

export const Route = createFileRoute('/create/album')({
  component: CreateAlbumPage,
})

interface CreateAlbumResponse {
  id: string
  albumSpecId: string
  state: string
}

const API_BASE_URL = 'http://localhost:3000'
const ALBUM_SPEC_ID = 'square_210_v1'

function CreateAlbumPage() {
  const [isCreating, setIsCreating] = useState(false)

  const albumId = useCreateAlbumStore((state) => state.albumId)
  const setAlbumId = useCreateAlbumStore((state) => state.setAlbumId)
  const uploadedAssets = useCreateAlbumStore((state) => state.uploadedAssets)

  async function handleCreateAlbum(event: { preventDefault: () => void }) {
    event.preventDefault()

    if (isCreating || albumId) return

    setIsCreating(true)

    try {
      const response = await fetch(`${API_BASE_URL}/albums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          albumSpecId: ALBUM_SPEC_ID,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create album.')
      }

      const album = (await response.json()) as CreateAlbumResponse

      setAlbumId(album.id)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111111]">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
        <div className="mb-14 max-w-xl">
          <p className="mb-6 text-sm uppercase tracking-[0.24em] text-neutral-500">
            ForeverArtifacts
          </p>

          <h1 className="mb-6 text-5xl font-normal tracking-[-0.04em]">
            Create your album
          </h1>

          <p className="text-lg leading-8 text-neutral-600">
            Your photos are ready. Create the album space where they will be
            arranged.
          </p>
        </div>

        <div className="mb-12">
          <p className="mb-4 text-sm text-neutral-500">
            Photos selected for this album
          </p>

          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {uploadedAssets.map((asset) => (
              <div
                key={asset.assetId}
                className="aspect-square overflow-hidden bg-white"
              >
                <img
                  src={asset.previewUrl}
                  alt={asset.filename}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {albumId ? (
          <div>
            <p className="mb-6 text-neutral-600">
              Album created. You can now begin building the spreads.
            </p>

            <p className="text-sm text-neutral-500">Album ID: {albumId}</p>
          </div>
        ) : (
          <form onSubmit={handleCreateAlbum}>
            <button
              type="submit"
              disabled={isCreating || uploadedAssets.length === 0}
              className="border border-neutral-900 px-6 py-3 text-sm tracking-wide disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
            >
              {isCreating ? 'Creating…' : 'Create album'}
            </button>

            {uploadedAssets.length === 0 && (
              <p className="mt-6 text-sm text-neutral-500">
                Add photos before creating an album.{' '}
                <Link to="/create" className="underline">
                  Return to photo selection
                </Link>
              </p>
            )}
          </form>
        )}
      </section>
    </main>
  )
}
