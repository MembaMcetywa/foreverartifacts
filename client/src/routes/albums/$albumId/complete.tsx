import { useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { AlbumNameEditor } from '../../../components/AlbumNameEditor'
import { requireAuth } from '../../../auth/requireAuth'
import { Button } from '../../../components/Button'
import { CompleteSpreadPreview } from '../../../components/CompleteSpreadPreview'
import { CreationShell } from '../../../components/CreationShell'
import { useAlbumNameEditor } from '../../../hooks/useAlbumNameEditor'
import {
  useAlbumQuery,
  useApproveAlbumRenderMutation,
  useStartAlbumRenderMutation,
  writeAlbumToCache,
} from '../../../queries/albums'
import { useLayoutTemplatesQuery } from '../../../queries/templates'
import {
  getAlbumTitle,
  getPreviewSlotsForSpread,
} from '../../../utils/review-spreads'

export const Route = createFileRoute('/albums/$albumId/complete')({
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: CompletePage,
})

function CompletePage() {
  const { albumId } = Route.useParams()
  const queryClient = useQueryClient()
  const albumQuery = useAlbumQuery(albumId)
  const { saveAlbumName, savingAlbumName } = useAlbumNameEditor(albumId)
  const templatesQuery = useLayoutTemplatesQuery(
    albumQuery.data?.albumSpecId ?? null,
  )
  const startRenderMutation = useStartAlbumRenderMutation()
  const approveRenderMutation = useApproveAlbumRenderMutation()
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(0)
  const album = albumQuery.data
  const albumTitle = getAlbumTitle(album?.albumName, albumId)
  const spreadPositions = album?.spreadPositions ?? []
  const activeSpreadPosition = spreadPositions[activeSpreadIndex]
  const renderStatus = album?.renderStatus ?? 'not_started'
  const isRendering =
    renderStatus === 'rendering' || startRenderMutation.isPending
  const canContinue = renderStatus === 'ready' && !approveRenderMutation.isPending
  const canGoPrevious = activeSpreadIndex > 0
  const canGoNext = activeSpreadIndex < spreadPositions.length - 1

  function startRender() {
    startRenderMutation.mutate(albumId, {
      onSuccess: (updatedAlbum) => writeAlbumToCache(queryClient, updatedAlbum),
    })
  }

  function showPreviousSpread() {
    setActiveSpreadIndex((index) => Math.max(index - 1, 0))
  }

  function showNextSpread() {
    setActiveSpreadIndex((index) =>
      Math.min(index + 1, spreadPositions.length - 1),
    )
  }

  function continueToOrder() {
    approveRenderMutation.mutate(albumId, {
      onSuccess: (updatedAlbum) => writeAlbumToCache(queryClient, updatedAlbum),
    })
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

      {album && (
        <CreationShell
          stage="Complete - 5 of 5"
          title={albumTitle}
          titleSaving={savingAlbumName}
          onTitleSave={saveAlbumName}
        >
          <section className="complete-workspace">
            <header className="complete-workspace__header">
              <div>
                <h1>Complete your book</h1>
                <p>Check your book, then continue to order.</p>
              </div>
              <Link to="/albums/$albumId/review" params={{ albumId }}>
                Back to review
              </Link>
            </header>

            <AlbumNameEditor
              albumName={albumTitle}
              className="complete-book-title"
              inputClassName="complete-book-title complete-book-title--input"
              label="Edit album name for the cover"
              saving={savingAlbumName}
              onSave={saveAlbumName}
            />

            <div className="complete-preview" data-status={renderStatus}>
              <div className="complete-preview__toolbar">
                <button
                  type="button"
                  aria-label="Previous spread"
                  disabled={!canGoPrevious}
                  onClick={showPreviousSpread}
                >
                  <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.75} />
                </button>
                <p>
                  Spread {String(activeSpreadIndex + 1).padStart(2, '0')} /{' '}
                  {String(spreadPositions.length).padStart(2, '0')}
                </p>
                <button
                  type="button"
                  aria-label="Next spread"
                  disabled={!canGoNext}
                  onClick={showNextSpread}
                >
                  <ChevronRight
                    aria-hidden="true"
                    size={20}
                    strokeWidth={1.75}
                  />
                </button>
              </div>

              {activeSpreadPosition && (
                <CompleteSpreadPreview
                  spreadPosition={activeSpreadPosition}
                  previewSlots={getPreviewSlotsForSpread(
                    templatesQuery.data,
                    activeSpreadPosition,
                  )}
                />
              )}
            </div>

            {startRenderMutation.isError && (
              <p className="complete-workspace__error" role="alert">
                The book PDF could not be rendered. Try again.
              </p>
            )}

            {approveRenderMutation.isError && (
              <p className="complete-workspace__error" role="alert">
                Your book could not be moved to order. Try again.
              </p>
            )}

            <footer className="complete-workspace__actions">
              {renderStatus !== 'ready' && renderStatus !== 'approved' && (
                <Button
                  type="button"
                  loading={isRendering}
                  disabled={isRendering}
                  onClick={startRender}
                >
                  {isRendering ? 'Rendering your book...' : 'Continue to order'}
                </Button>
              )}

              {(renderStatus === 'ready' || renderStatus === 'approved') && (
                <Button
                  type="button"
                  loading={approveRenderMutation.isPending}
                  disabled={!canContinue}
                  onClick={continueToOrder}
                >
                  Continue to order
                </Button>
              )}
            </footer>
          </section>
        </CreationShell>
      )}
    </>
  )
}


