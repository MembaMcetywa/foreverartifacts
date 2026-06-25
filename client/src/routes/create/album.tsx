import { createFileRoute, Link } from '@tanstack/react-router'
import type { SubmitEvent } from 'react'
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useAlbumQuery, useCreateAlbumMutation } from '../../queries/albums'
import { useCreateAlbumStore } from '../../stores/albumStore'

export const Route = createFileRoute('/create/album')({
  component: CreateAlbumPage,
})

const ALBUM_SPEC_ID = 'square_210_v1'

function CreateAlbumPage() {
  const { albumId, album, uploadedAssets, setAlbum, clearAlbum } =
    useCreateAlbumStore(
      useShallow((state) => ({
        albumId: state.albumId,
        album: state.album,
        uploadedAssets: state.uploadedAssets,
        setAlbum: state.setAlbum,
        clearAlbum: state.clearAlbum,
      })),
    )

  const albumQuery = useAlbumQuery(albumId)
  const createAlbumMutation = useCreateAlbumMutation()

  useEffect(() => {
    if (albumQuery.data) {
      setAlbum(albumQuery.data)
    }
  }, [albumQuery.data, setAlbum])

  async function handleCreateAlbum(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      albumId ||
      uploadedAssets.length === 0 ||
      createAlbumMutation.isPending
    ) {
      return
    }

    const assetIds = uploadedAssets.map((asset) => asset.assetId)

    const createdAlbum = await createAlbumMutation.mutateAsync({
      albumSpecId: ALBUM_SPEC_ID,
      assetIds,
    })

    setAlbum(createdAlbum)
  }

  const displayAssets = album?.assets ?? uploadedAssets
  const hasAlbum = Boolean(albumId)

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
            {displayAssets.map((asset) => (
              <div
                key={asset.assetId}
                className="aspect-square overflow-hidden bg-white"
              >
                <img
                  src={asset.previewUrl}
                  alt="Selected album photo"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {albumQuery.isLoading && albumId && (
          <p className="text-sm text-neutral-500">Loading album…</p>
        )}

        {albumQuery.isError && albumId && (
          <div>
            <p className="mb-6 text-sm text-neutral-500">
              This album could not be found.
            </p>

            <button
              type="button"
              onClick={clearAlbum}
              className="border border-neutral-900 px-6 py-3 text-sm tracking-wide"
            >
              Start again
            </button>
          </div>
        )}

        {!hasAlbum && (
          <form onSubmit={handleCreateAlbum}>
            <button
              type="submit"
              disabled={
                createAlbumMutation.isPending || uploadedAssets.length === 0
              }
              className="border border-neutral-900 px-6 py-3 text-sm tracking-wide disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
            >
              {createAlbumMutation.isPending ? 'Creating…' : 'Create album'}
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

        {album && (
          <div>
            <p className="mb-6 text-neutral-600">
              Album created. You can now begin building the spreads.
            </p>

            <p className="text-sm text-neutral-500">Album ID: {album.id}</p>
          </div>
        )}
      </section>
    </main>
  )
}
