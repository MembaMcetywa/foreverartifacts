import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Link, createFileRoute } from '@tanstack/react-router'

import { CreationShell } from '../../../components/CreationShell'
import { ReviewSpread } from '../../../components/ReviewSpread'
import { useReviewSpreadOrder } from '../../../hooks/useReviewSpreadOrder'
import { useReviewWorkflowCheckpoint } from '../../../hooks/useReviewWorkflowCheckpoint'
import { useAlbumQuery } from '../../../queries/albums'
import { useLayoutTemplatesQuery } from '../../../queries/templates'
import {
  countCompletedSpreads,
  getAlbumTitle,
  getFirstEmptyPosition,
  getPreviewSlotsForSpread,
  getSpreadPositionId,
} from '../../../utils/review-spreads'

export const Route = createFileRoute('/albums/$albumId/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const { albumId } = Route.useParams()
  const albumQuery = useAlbumQuery(albumId)
  const templatesQuery = useLayoutTemplatesQuery(
    albumQuery.data?.albumSpecId ?? null,
  )
  const { orderedSpreadPositions, reorderSpread } = useReviewSpreadOrder(
    albumId,
    albumQuery.data?.spreadPositions,
  )
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
  )
  const albumTitle = getAlbumTitle(albumQuery.data?.albumName, albumId)
  const completedSpreads = countCompletedSpreads(albumQuery.data?.spreadPositions)
  const firstEmptyPosition = getFirstEmptyPosition(
    albumQuery.data?.spreadPositions,
  )
  const isReadyForProof = completedSpreads === 12

  useReviewWorkflowCheckpoint(albumId)

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
        <CreationShell stage="Review - 4 of 5" title={albumTitle}>
          <section className="review-workspace">
            {!isReadyForProof && (
              <section className="review-readiness-panel">
                <dl>
                  <dt>
                    <h1>Review your book sequence</h1>
                  </dt>
                  <dd>
                    Spread {firstEmptyPosition} still needs to be completed
                    before proofing.
                  </dd>
                </dl>
                <Link to="/albums/$albumId/arrange" params={{ albumId }}>
                  Return to arrange
                </Link>
              </section>
            )}

            {isReadyForProof && (
              <section className="review-readiness-panel">
                <dl>
                  <dt>
                    <h1>Review your book sequence</h1>
                  </dt>
                  <dd>
                    All interior spreads are complete. Review and edit each
                    spread before proofing.
                  </dd>
                </dl>
                <Link to="/albums/$albumId/arrange" params={{ albumId }}>
                  Back to arrange
                </Link>
              </section>
            )}

            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={reorderSpread}
              sensors={sensors}
            >
              <SortableContext
                items={orderedSpreadPositions.map(getSpreadPositionId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="review-spread-sequence">
                  {orderedSpreadPositions.map((spreadPosition, index) => (
                    <ReviewSpread
                      key={getSpreadPositionId(spreadPosition)}
                      albumId={albumId}
                      index={index}
                      spreadPosition={spreadPosition}
                      previewSlots={getPreviewSlotsForSpread(
                        templatesQuery.data,
                        spreadPosition,
                      )}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        </CreationShell>
      )}
    </>
  )
}
