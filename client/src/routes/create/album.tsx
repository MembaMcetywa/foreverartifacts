import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { SubmitEvent } from 'react'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useAlbumQuery, useCreateAlbumMutation } from '../../queries/albums'
import { useAddSpreadMutation } from '../../queries/spreads'
import { useCreateAlbumStore } from '../../stores/albumStore'

export const Route = createFileRoute('/create/album')({
  component: CreateAlbumPage,
})

const ALBUM_SPEC_ID = 'square_210_v1'

type TemplateId = 'single_page_image' | 'balanced_pair' | 'full_spread_image'

interface SpreadTemplateOption {
  id: TemplateId
  name: string
  imageSlots: number
}

const TEMPLATE_OPTIONS_BY_ID: Record<TemplateId, SpreadTemplateOption> = {
  single_page_image: {
    id: 'single_page_image',
    name: 'Single page image',
    imageSlots: 1,
  },
  balanced_pair: {
    id: 'balanced_pair',
    name: 'Balanced pair',
    imageSlots: 2,
  },
  full_spread_image: {
    id: 'full_spread_image',
    name: 'Full spread image',
    imageSlots: 1,
  },
}

const TEMPLATE_OPTIONS = Object.values(TEMPLATE_OPTIONS_BY_ID)

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

  const queryClient = useQueryClient()
  const addSpreadMutation = useAddSpreadMutation()

  const albumQuery = useAlbumQuery(albumId)
  const createAlbumMutation = useCreateAlbumMutation()

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<TemplateId>('single_page_image')

  const [selectedSlotAssetIds, setSelectedSlotAssetIds] = useState<
    Record<number, string>
  >({})

 const selectedTemplate = TEMPLATE_OPTIONS_BY_ID[selectedTemplateId]

 const selectedSlotCount = Object.keys(selectedSlotAssetIds).length

 const canAddSpread =
   Boolean(albumId) &&
   selectedSlotCount === selectedTemplate.imageSlots &&
   !addSpreadMutation.isPending


    const displayAssets = album?.assets ?? uploadedAssets
    const hasAlbum = Boolean(albumId)


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

  async function handleAddSpread(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!albumId || !canAddSpread) return

    const slots = Array.from(
      { length: selectedTemplate.imageSlots },
      (_, slotIndex) => ({
        slotIndex,
        assetId: selectedSlotAssetIds[slotIndex],
      }),
    )

    await addSpreadMutation.mutateAsync({
      albumId,
      templateId: selectedTemplate.id,
      slots,
    })

    setSelectedSlotAssetIds({})

    await queryClient.invalidateQueries({
      queryKey: ['album', albumId],
    })
  }

    useEffect(() => {
      if (albumQuery.data) {
        setAlbum(albumQuery.data)
      }
    }, [albumQuery.data, setAlbum])



  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111111]">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
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
            <div className="mb-12">
              <p className="mb-6 text-neutral-600">
                Album created. You can now begin building the spreads.
              </p>

              <p className="text-sm text-neutral-500">Album ID: {album.id}</p>
            </div>

            <form onSubmit={handleAddSpread}>
              <div className="mb-12">
                <p className="mb-4 text-sm text-neutral-500">Choose a layout</p>

                <div className="grid gap-3 md:grid-cols-3">
                  {TEMPLATE_OPTIONS.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(template.id)
                        setSelectedSlotAssetIds({})
                      }}
                      className={`border px-5 py-4 text-left text-sm tracking-wide ${
                        selectedTemplateId === template.id
                          ? 'border-neutral-900 bg-white'
                          : 'border-neutral-300 text-neutral-500'
                      }`}
                    >
                      <span className="block">{template.name}</span>

                      <span className="mt-2 block text-xs text-neutral-400">
                        {template.imageSlots} photo
                        {template.imageSlots === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-12">
                <p className="mb-4 text-sm text-neutral-500">
                  Choose photos for this spread
                </p>

                <div className="grid gap-8 md:grid-cols-2">
                  {Array.from(
                    { length: selectedTemplate.imageSlots },
                    (_, slotIndex) => {
                      const selectedAssetId = selectedSlotAssetIds[slotIndex]

                      return (
                        <div key={slotIndex}>
                          <p className="mb-3 text-sm text-neutral-500">
                            Slot {slotIndex + 1}
                          </p>

                          <div className="grid grid-cols-4 gap-3">
                            {displayAssets.map((asset) => (
                              <button
                                key={asset.assetId}
                                type="button"
                                onClick={() => {
                                  setSelectedSlotAssetIds((currentSlots) => ({
                                    ...currentSlots,
                                    [slotIndex]: asset.assetId,
                                  }))
                                }}
                                className={`aspect-square overflow-hidden border bg-white ${
                                  selectedAssetId === asset.assetId
                                    ? 'border-neutral-900'
                                    : 'border-transparent'
                                }`}
                              >
                                <img
                                  src={asset.previewUrl}
                                  alt="Album asset"
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    },
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!canAddSpread}
                className="border border-neutral-900 px-6 py-3 text-sm tracking-wide disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
              >
                {addSpreadMutation.isPending ? 'Adding spread…' : 'Add spread'}
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  )
}
