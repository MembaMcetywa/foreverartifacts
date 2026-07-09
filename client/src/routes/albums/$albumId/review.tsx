import { Link, createFileRoute } from '@tanstack/react-router'

import { CreationShell } from '../../../components/CreationShell'
import { useAlbumQuery } from '../../../queries/albums'

export const Route = createFileRoute('/albums/$albumId/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const { albumId } = Route.useParams()
  const albumQuery = useAlbumQuery(albumId)
  const albumTitle =
    albumQuery.data?.albumName && albumQuery.data.albumName !== albumId
      ? albumQuery.data.albumName
      : 'Untitled'
  const completedSpreads =
    albumQuery.data?.spreadPositions.filter(
      (spreadPosition) => spreadPosition.status === 'complete',
    ).length ?? 0
  const firstEmptyPosition = albumQuery.data?.spreadPositions.find(
    (spreadPosition) => spreadPosition.status === 'empty',
  )?.position
  const isReadyForProof = completedSpreads === 12

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

            <div className="review-spread-sequence">
              {albumQuery.data.spreadPositions.map((spreadPosition) => (
                <article
                  key={spreadPosition.position}
                  className="review-spread"
                >
                  <header className="review-spread__header">
                    <p className="review-spread__number">
                      Spread {String(spreadPosition.position).padStart(2, '0')}
                    </p>
                    {spreadPosition.spread && (
                      <Link
                        to="/albums/$albumId/arrange"
                        params={{ albumId }}
                        search={{
                          spread: spreadPosition.position,
                          returnTo: 'review',
                        }}
                        aria-label={`Edit spread ${spreadPosition.position}`}
                      >
                        <span>Edit</span>
                      </Link>
                    )}
                  </header>

                  <div className="review-spread__surface">
                    <div className="review-spread__page" />
                    <div className="review-spread__page" />

                    {spreadPosition.spread && (
                      <div
                        className="review-spread__slots"
                        data-layout={spreadPosition.spread.templateId}
                      >
                        {spreadPosition.spread.slots.map((slot) => (
                          <div
                            key={slot.id}
                            className="review-spread__slot"
                            data-slot={slot.slotIndex}
                          >
                            <img
                              src={slot.asset.previewUrl}
                              alt={`Photograph in spread ${spreadPosition.position}, slot ${slot.slotIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {!spreadPosition.spread && (
                      <p className="review-spread__empty">Empty spread</p>
                    )}
                  </div>

                  {spreadPosition.spread && (
                    <p className="review-spread__meta">
                      {spreadPosition.spread.templateId.replaceAll('_', ' ')}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </CreationShell>
      )}
    </>
  )
}
