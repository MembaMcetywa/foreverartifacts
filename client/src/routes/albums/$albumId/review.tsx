import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CompleteSpreadPreview } from '../../../components/CompleteSpreadPreview'
import { requireAuth } from '../../../auth/requireAuth'
import { CreationShell } from '../../../components/CreationShell'
import { Spinner } from '../../../components/Spinner'
import { useAlbumNameEditor } from '../../../hooks/useAlbumNameEditor'
import { useReviewWorkflowCheckpoint } from '../../../hooks/useReviewWorkflowCheckpoint'
import { useAlbumQuery } from '../../../queries/albums'
import { useLayoutTemplatesQuery } from '../../../queries/templates'
import {
  countCompletedSpreads,
  getAlbumTitle,
  getFirstEmptyPosition,
  getPreviewSlotsForSpread,
} from '../../../utils/review-spreads'

export const Route = createFileRoute('/albums/$albumId/review')({
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: ReviewPage,
})

function ReviewPage() {
  const { albumId } = Route.useParams()
  const albumQuery = useAlbumQuery(albumId)
  const { saveAlbumName, savingAlbumName } = useAlbumNameEditor(albumId)
  const templatesQuery = useLayoutTemplatesQuery(
    albumQuery.data?.albumSpecId ?? null,
  )
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(0)
  const albumTitle = getAlbumTitle(albumQuery.data?.albumName, albumId)
  const spreadPositions = albumQuery.data?.spreadPositions ?? []
  const activeSpreadPosition = spreadPositions[activeSpreadIndex]
  const completedSpreads = countCompletedSpreads(spreadPositions)
  const firstEmptyPosition = getFirstEmptyPosition(spreadPositions)
  const isReadyForRender =
    spreadPositions.length > 0 && completedSpreads === spreadPositions.length
  const canGoPrevious = activeSpreadIndex > 0
  const canGoNext = activeSpreadIndex < spreadPositions.length - 1

  useReviewWorkflowCheckpoint(albumId)

  useEffect(() => {
    setActiveSpreadIndex((index) =>
      Math.min(index, Math.max(spreadPositions.length - 1, 0)),
    )
  }, [spreadPositions.length])

  function showPreviousSpread() {
    setActiveSpreadIndex((index) => Math.max(index - 1, 0))
  }

  function showNextSpread() {
    setActiveSpreadIndex((index) =>
      Math.min(index + 1, spreadPositions.length - 1),
    )
  }

  return (
    <>
      {albumQuery.isLoading && (
        <main className="photos-route-state">
          <Spinner size="lg" label="Loading your book" />
        </main>
      )}

      {albumQuery.isError && (
        <main className="photos-route-state">
          <p role="alert">Your book could not be loaded.</p>
        </main>
      )}

      {albumQuery.data && (
        <CreationShell
          stage="Review — 4 of 5"
          title={albumTitle}
          titleSaving={savingAlbumName}
          onTitleSave={saveAlbumName}
        >
          <section className="review-workspace">
            {!isReadyForRender && (
              <section className="review-readiness-panel">
                <dl>
                  <dt>
                    <h1>Review your book sequence</h1>
                  </dt>
                  <dd>
                    Spread {firstEmptyPosition} still needs to be completed
                    before you complete your book.
                  </dd>
                </dl>
              </section>
            )}

            {isReadyForRender && (
              <section className="review-readiness-panel">
                <dl>
                  <dt>
                    <h1>Review your book sequence</h1>
                  </dt>
                  <dd>
                    All interior spreads are complete. Review and edit each
                    spread before continuing.
                  </dd>
                </dl>
                <Link to="/albums/$albumId/complete" params={{ albumId }}>
                  Continue to complete
                </Link>
              </section>
            )}

            <section className="review-focus" aria-label="Review spreads">
              <div className="review-focus__toolbar">
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

              <div className="review-focus__actions">
                {activeSpreadPosition?.spread && (
                  <Link
                    to="/albums/$albumId/arrange"
                    params={{ albumId }}
                    search={{
                      spread: activeSpreadIndex + 1,
                      returnTo: 'review',
                    }}
                    aria-label={`Edit spread ${activeSpreadIndex + 1}`}
                  >
                    Edit spread
                  </Link>
                )}
              </div>
            </section>

            <nav className="review-spread-index" aria-label="Spread index">
              {spreadPositions.map((spreadPosition, index) => (
                <button
                  key={
                    spreadPosition.spread?.id ??
                    `empty-${spreadPosition.position}`
                  }
                  type="button"
                  data-active={index === activeSpreadIndex || undefined}
                  data-complete={
                    spreadPosition.status === 'complete' || undefined
                  }
                  onClick={() => setActiveSpreadIndex(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </nav>
          </section>
        </CreationShell>
      )}
    </>
  )
}

