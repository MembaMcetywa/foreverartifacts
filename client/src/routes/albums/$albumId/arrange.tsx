import { useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ArrangePhotoTray } from '../../../components/ArrangePhotoTray'
import { requireAuth } from '../../../auth/requireAuth'
import { Button } from '../../../components/Button'
import { CreationShell } from '../../../components/CreationShell'
import { ModalWrapper } from '../../../components/ModalWrapper'
import { useAlbumNameEditor } from '../../../hooks/useAlbumNameEditor'
import {
  useAlbumQuery,
  useUpdateAlbumWorkflowMutation,
  writeAlbumToCache,
} from '../../../queries/albums'
import { useSaveSpreadAtPositionMutation } from '../../../queries/spreads'
import { useLayoutTemplatesQuery } from '../../../queries/templates'

export const Route = createFileRoute('/albums/$albumId/arrange')({
  beforeLoad: ({ location }) => requireAuth(location.href),
  validateSearch: (search: Record<string, unknown>) => {
    const spread = Number(search.spread)

    return {
      spread:
        Number.isInteger(spread) && spread >= 1 && spread <= 12
          ? spread
          : undefined,
      returnTo: search.returnTo === 'review' ? 'review' : undefined,
    }
  },
  component: ArrangePage,
})

function ArrangePage() {
  const { albumId } = Route.useParams()
  const { returnTo, spread: requestedSpreadPosition } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const albumQuery = useAlbumQuery(albumId)
  const { saveAlbumName, savingAlbumName } = useAlbumNameEditor(albumId)
  const updateWorkflowMutation = useUpdateAlbumWorkflowMutation()
  const saveSpreadMutation = useSaveSpreadAtPositionMutation()
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
  const spreadPositions = albumQuery.data?.spreadPositions ?? []
  const completedSpreads = spreadPositions.filter(
    (spreadPosition) => spreadPosition.status === 'complete',
  ).length
  const firstEmptySpreadPosition = spreadPositions.find(
    (spreadPosition) => spreadPosition.status === 'empty',
  )?.position
  const activeSpreadPosition =
    requestedSpreadPosition ?? firstEmptySpreadPosition ?? 12
  const activeSpread = spreadPositions.find(
    (spreadPosition) => spreadPosition.position === activeSpreadPosition,
  )
  const activeSpreadRecord = activeSpread?.spread ?? null
  const isEditingSpread = returnTo === 'review' && Boolean(activeSpreadRecord)
  const hasCompletedAllSpreads = completedSpreads === 12
  const shouldShowCompletion = hasCompletedAllSpreads && !isEditingSpread
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
    previewSlot: selectedTemplate?.preview.slots.find(
      (slot) => slot.slotIndex === slotIndex,
    ),
  }))
  const originalTemplateId = activeSpreadRecord?.templateId ?? null
  const originalSlotAssignments = Object.fromEntries(
    activeSpreadRecord?.slots.map((slot) => [slot.slotIndex, slot.assetId]) ??
      [],
  )
  const hasSpreadChanges =
    !isEditingSpread ||
    selectedTemplateId !== originalTemplateId ||
    spreadSlots.some(
      (slotIndex) =>
        slotAssignments[slotIndex] !== originalSlotAssignments[slotIndex],
    )
  const canAddSpread =
    Boolean(selectedTemplate) &&
    spreadSlots.length > 0 &&
    spreadSlots.every((slotIndex) => slotAssignments[slotIndex]) &&
    (completedSpreads < 12 || isEditingSpread) &&
    hasSpreadChanges &&
    !saveSpreadMutation.isPending

  useEffect(() => {
    const firstTemplate = templatesQuery.data?.[0]

    if (firstTemplate && !selectedTemplateId) {
      setSelectedTemplateId(firstTemplate.id)
    }
  }, [selectedTemplateId, templatesQuery.data])

  useEffect(() => {
    updateWorkflowMutation.mutate(
      {
        albumId,
        workflowStage:
          returnTo === 'review' ? 'review_album' : 'compose_spreads',
        activeSpreadPosition: activeSpreadPosition,
      },
      {
        onSuccess: (album) => writeAlbumToCache(queryClient, album),
      },
    )
  }, [activeSpreadPosition, albumId, queryClient, returnTo])

  useEffect(() => {
    if (activeSpreadRecord) {
      setSelectedTemplateId(activeSpreadRecord.templateId)
      setSlotAssignments(
        Object.fromEntries(
          activeSpreadRecord.slots.map((slot) => [
            slot.slotIndex,
            slot.assetId,
          ]),
        ),
      )
      setActiveSlotIndex(0)
    }
  }, [activeSpreadRecord])

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

    const savedAlbum = await saveSpreadMutation.mutateAsync({
      albumId,
      position: activeSpreadPosition,
      templateId: selectedTemplate.id,
      slots,
    })

    if (isEditingSpread) {
      queryClient.setQueryData(['album', albumId], savedAlbum)
      await navigate({
        to: '/albums/$albumId/review',
        params: { albumId },
      })
      return
    }

    const hasCompletedBook = savedAlbum.spreadPositions.every(
      (spreadPosition) => spreadPosition.status === 'complete',
    )

    if (hasCompletedBook) {
      queryClient.setQueryData(['album', albumId], savedAlbum)
      await navigate({
        to: '/albums/$albumId/review',
        params: { albumId },
      })
      return
    }

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
        <CreationShell
          stage="Arrange - 2 of 5"
          title={albumTitle}
          titleSaving={savingAlbumName}
          onTitleSave={saveAlbumName}
        >
          <section className="arrange-workspace">
            {!shouldShowCompletion && (
              <header className="arrange-workspace__header">
                <dl className="arrange-workspace__summary">
                  <dt>
                    <h1>
                      Spread {String(activeSpreadPosition).padStart(2, '0')}
                    </h1>
                  </dt>
                  <dd className="arrange-workspace__progress">
                    {completedSpreads}/12 spreads complete
                  </dd>
                </dl>
              </header>
            )}

            {shouldShowCompletion && (
              <div className="arrange-completion-panel">
                <div>
                  <h2>All 12 spreads are complete</h2>
                  <p>
                    Continue to review your book and make any final edits.
                  </p>
                </div>
                <Link
                  className="button"
                  to="/albums/$albumId/review"
                  params={{ albumId }}
                >
                  Continue to review
                </Link>
              </div>
            )}

            {!shouldShowCompletion && (
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
                        {templatesQuery.isLoading && (
                          <p>Loading templates...</p>
                        )}
                        {templatesQuery.isError && (
                          <p role="alert">Templates could not be loaded.</p>
                        )}
                      </div>

                      {templatesQuery.data &&
                        templatesQuery.data.length > 0 && (
                          <div
                            className="arrange-template-options"
                            aria-label="Spread layout templates"
                          >
                            {templatesQuery.data.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                aria-pressed={
                                  template.id === selectedTemplateId
                                }
                                className="arrange-template-option"
                                data-selected={
                                  template.id === selectedTemplateId
                                }
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
                      aria-label={`Spread ${activeSpreadPosition} photograph slots`}
                    >
                      {spreadSlotItems.map(
                        ({ slotIndex, assignedAsset, previewSlot }) => (
                        <button
                          key={slotIndex}
                          type="button"
                          className="arrange-spread-slot"
                          data-slot={slotIndex}
                          data-active={slotIndex === activeSlotIndex}
                          aria-pressed={slotIndex === activeSlotIndex}
                          style={
                            previewSlot
                              ? {
                                  left: `${previewSlot.rect.left}%`,
                                  top: `${previewSlot.rect.top}%`,
                                  width: `${previewSlot.rect.width}%`,
                                  height: `${previewSlot.rect.height}%`,
                                }
                              : undefined
                          }
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
                        ),
                      )}
                    </div>
                  </div>
                  <p>
                    Choose a layout, select a slot, then place a photograph.
                  </p>
                  {saveSpreadMutation.isError && (
                    <p role="alert">This spread could not be saved.</p>
                  )}
                  <Button
                    disabled={!canAddSpread}
                    loading={saveSpreadMutation.isPending}
                    onClick={addCurrentSpread}
                  >
                    {saveSpreadMutation.isPending
                      ? 'Saving spread'
                      : isEditingSpread
                        ? 'Save changes'
                        : 'Add spread'}
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

                <ArrangePhotoTray
                  activeSpreadPosition={activeSpreadPosition}
                  albumId={albumId}
                  assets={albumQuery.data.assets}
                  returnTo={returnTo}
                  onSelectAsset={placePhotograph}
                />
              </div>
            )}
          </section>
        </CreationShell>
      )}
    </>
  )
}

