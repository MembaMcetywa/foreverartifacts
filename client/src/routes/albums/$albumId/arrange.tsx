import { useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../../../components/Button'
import { CreationShell } from '../../../components/CreationShell'
import { ModalWrapper } from '../../../components/ModalWrapper'
import { useAlbumQuery } from '../../../queries/albums'
import { useAddSpreadMutation } from '../../../queries/spreads'
import { useLayoutTemplatesQuery } from '../../../queries/templates'

export const Route = createFileRoute('/albums/$albumId/arrange')({
  component: ArrangePage,
})

function ArrangePage() {
  const { albumId } = Route.useParams()
  const queryClient = useQueryClient()
  const albumQuery = useAlbumQuery(albumId)
  const addSpreadMutation = useAddSpreadMutation()
  const templatesQuery = useLayoutTemplatesQuery(
    albumQuery.data?.albumSpecId ?? null,
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  )
  const [layoutModalOpen, setLayoutModalOpen] = useState(false)
  const [activeSlotIndex, setActiveSlotIndex] = useState(0)
  const [slotAssignments, setSlotAssignments] = useState<
    Record<number, string>
  >({})
  const albumTitle =
    albumQuery.data?.albumName && albumQuery.data.albumName !== albumId
      ? albumQuery.data.albumName
      : 'Untitled'
  const completedSpreads = albumQuery.data?.spreads.length ?? 0
  const activeSpread = Math.min(completedSpreads + 1, 12)
  const selectedTemplate = templatesQuery.data?.find(
    (template) => template.id === selectedTemplateId,
  )
  const spreadSlots = Array.from(
    { length: selectedTemplate?.imageSlots ?? 0 },
    (_, slotIndex) => slotIndex,
  )
  const spreadSlotItems = spreadSlots.map((slotIndex) => ({
    slotIndex,
    assignedAsset: albumQuery.data?.assets.find(
      (asset) => asset.assetId === slotAssignments[slotIndex],
    ),
  }))
  const canAddSpread =
    Boolean(selectedTemplate) &&
    spreadSlots.length > 0 &&
    spreadSlots.every((slotIndex) => slotAssignments[slotIndex]) &&
    completedSpreads < 12 &&
    !addSpreadMutation.isPending

  useEffect(() => {
    const firstTemplate = templatesQuery.data?.[0]

    if (firstTemplate && !selectedTemplateId) {
      setSelectedTemplateId(firstTemplate.id)
    }
  }, [selectedTemplateId, templatesQuery.data])

  useEffect(() => {
    if (selectedTemplate) {
      setActiveSlotIndex(0)
      setSlotAssignments((currentAssignments) =>
        Object.fromEntries(
          Object.entries(currentAssignments).filter(
            ([slotIndex]) => Number(slotIndex) < selectedTemplate.imageSlots,
          ),
        ),
      )
    }
  }, [selectedTemplate])

  function placePhotograph(assetId: string) {
    const firstEmptySlot = spreadSlots.find(
      (slotIndex) => !slotAssignments[slotIndex],
    )
    const targetSlotIndex =
      activeSlotIndex < spreadSlots.length
        ? activeSlotIndex
        : (firstEmptySlot ?? 0)

    if (spreadSlots.length > 0) {
      setSlotAssignments((currentAssignments) => ({
        ...currentAssignments,
        [targetSlotIndex]: assetId,
      }))
      setActiveSlotIndex(
        spreadSlots.find(
          (slotIndex) =>
            slotIndex !== targetSlotIndex && !slotAssignments[slotIndex],
        ) ?? targetSlotIndex,
      )
    }
  }

  async function addCurrentSpread() {
    if (!selectedTemplate || !canAddSpread) {
      return
    }

    const slots = spreadSlots.flatMap((slotIndex) => {
      const assetId = slotAssignments[slotIndex]

      return assetId ? [{ slotIndex, assetId }] : []
    })

    if (slots.length !== spreadSlots.length) {
      return
    }

    await addSpreadMutation.mutateAsync({
      albumId,
      templateId: selectedTemplate.id,
      slots,
    })
    await queryClient.invalidateQueries({ queryKey: ['album', albumId] })
    setSlotAssignments({})
    setActiveSlotIndex(0)
  }

  return (
    <>
      {albumQuery.isLoading && (
        <main className="photos-route-state">
          <p>Loading your book...</p>
        </main>
      )}

      {albumQuery.isError && (
        <main className="photos-route-state">
          <p role="alert">Your book could not be loaded.</p>
        </main>
      )}

      {albumQuery.data && (
        <CreationShell stage="Arrange · 2 of 5" title={albumTitle}>
          <section className="arrange-workspace">
            <header className="arrange-workspace__header">
              <dl className="arrange-workspace__summary">
                <dt>
                  <h1>Spread {String(activeSpread).padStart(2, '0')}</h1>
                </dt>
                <dd className="arrange-workspace__progress">
                  {completedSpreads}/12 spreads complete
                </dd>
              </dl>
            </header>

            <div className="arrange-workspace__content">
              <div className="arrange-canvas-region">
                <button
                  type="button"
                  className="arrange-template-menu"
                  aria-haspopup="dialog"
                  aria-expanded={layoutModalOpen}
                  onClick={() => setLayoutModalOpen(true)}
                >
                  <strong>{selectedTemplate?.name ?? 'Select layout'}</strong>
                  <ChevronDown
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.75}
                  />
                </button>

                <ModalWrapper
                  open={layoutModalOpen}
                  title="Choose layout"
                  onClose={() => setLayoutModalOpen(false)}
                >
                  <div className="arrange-template-rail arrange-template-rail--modal">
                    <div className="arrange-template-rail__header">
                      {templatesQuery.isLoading && <p>Loading templates...</p>}
                      {templatesQuery.isError && (
                        <p role="alert">Templates could not be loaded.</p>
                      )}
                    </div>

                    {templatesQuery.data && templatesQuery.data.length > 0 && (
                      <div
                        className="arrange-template-options"
                        aria-label="Spread layout templates"
                      >
                        {templatesQuery.data.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            aria-pressed={template.id === selectedTemplateId}
                            className="arrange-template-option"
                            data-selected={template.id === selectedTemplateId}
                            onClick={() => {
                              setSelectedTemplateId(template.id)
                              setLayoutModalOpen(false)
                            }}
                          >
                            <span>{template.name}</span>
                            <small>
                              {template.imageSlots}{' '}
                              {template.imageSlots === 1
                                ? 'photograph'
                                : 'photographs'}
                            </small>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedTemplate && (
                      <p className="arrange-template-rail__description">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                </ModalWrapper>

                <div className="arrange-spread-composer">
                  <div className="arrange-spread-page" />
                  <div className="arrange-spread-page" />
                  <div
                    className="arrange-spread-slots"
                    data-layout={selectedTemplate?.id ?? 'empty'}
                    aria-label={`Spread ${activeSpread} photograph slots`}
                  >
                    {spreadSlotItems.map(({ slotIndex, assignedAsset }) => (
                      <button
                        key={slotIndex}
                        type="button"
                        className="arrange-spread-slot"
                        data-slot={slotIndex}
                        data-active={slotIndex === activeSlotIndex}
                        aria-pressed={slotIndex === activeSlotIndex}
                        onClick={() => setActiveSlotIndex(slotIndex)}
                      >
                        {assignedAsset && (
                          <img
                            src={assignedAsset.previewUrl}
                            alt={`Photograph placed in slot ${slotIndex + 1}`}
                          />
                        )}
                        {!assignedAsset && <span>Slot {slotIndex + 1}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <p>Choose a layout, select a slot, then place a photograph.</p>
                {addSpreadMutation.isError && (
                  <p role="alert">This spread could not be added.</p>
                )}
                <Button
                  disabled={!canAddSpread}
                  loading={addSpreadMutation.isPending}
                  onClick={addCurrentSpread}
                >
                  {addSpreadMutation.isPending ? 'Adding spread' : 'Add spread'}
                </Button>

                <div className="arrange-template-rail arrange-template-rail--desktop">
                  <div className="arrange-template-rail__header">
                    <h2>Layout</h2>
                    {templatesQuery.isLoading && <p>Loading templates...</p>}
                    {templatesQuery.isError && (
                      <p role="alert">Templates could not be loaded.</p>
                    )}
                  </div>

                  {templatesQuery.data && templatesQuery.data.length > 0 && (
                    <div
                      className="arrange-template-options"
                      aria-label="Spread layout templates"
                    >
                      {templatesQuery.data.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          aria-pressed={template.id === selectedTemplateId}
                          className="arrange-template-option"
                          data-selected={template.id === selectedTemplateId}
                          onClick={() => {
                            setSelectedTemplateId(template.id)
                          }}
                        >
                          <span>{template.name}</span>
                          <small>
                            {template.imageSlots}{' '}
                            {template.imageSlots === 1
                              ? 'photograph'
                              : 'photographs'}
                          </small>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedTemplate && (
                    <p className="arrange-template-rail__description">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
              </div>

              <aside className="arrange-photo-tray" aria-label="Photographs">
                <div className="arrange-photo-tray__header">
                  <h2>Photographs</h2>
                  <Link to="/albums/$albumId/photos" params={{ albumId }}>
                    Add photographs
                  </Link>
                </div>

                {albumQuery.data.assets.length === 0 && (
                  <p className="arrange-photo-tray__empty">
                    No uploaded photographs yet.
                  </p>
                )}

                {albumQuery.data.assets.length > 0 && (
                  <div className="arrange-photo-tray__grid">
                    {albumQuery.data.assets.slice(0, 12).map((asset) => (
                      <button
                        key={asset.assetId}
                        type="button"
                        className="arrange-photo-tray__item"
                        onClick={() => placePhotograph(asset.assetId)}
                      >
                        <img
                          src={asset.previewUrl}
                          alt={`Uploaded photograph ${asset.order + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </section>
        </CreationShell>
      )}
    </>
  )
}
