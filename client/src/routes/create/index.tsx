import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { Album } from '../../api/albums'
import { requireAuth } from '../../auth/requireAuth'
import { BookIndexRow } from '../../components/BookIndexRow'
import { Button } from '../../components/Button'
import { ModalWrapper } from '../../components/ModalWrapper'
import {
  removeAlbumFromCache,
  useAlbumsQuery,
  useCreateAlbumMutation,
  useDeleteAlbumMutation,
} from '../../queries/albums'

export const Route = createFileRoute('/create/')({
  beforeLoad: ({ location }) => requireAuth(location.href),
  component: CreatePage,
})

const ALBUM_SPEC_ID = 'square_210_v1'

function CreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [albumPendingDelete, setAlbumPendingDelete] = useState<Album | null>(
    null,
  )
  const albumsQuery = useAlbumsQuery()
  const createAlbumMutation = useCreateAlbumMutation()
  const deleteAlbumMutation = useDeleteAlbumMutation()
  const bookCount = albumsQuery.data?.length ?? 0

  function openPhotographs(albumId: string) {
    navigate({
      to: '/albums/$albumId/photos',
      params: { albumId },
    })
  }

  function startBook() {
    createAlbumMutation.mutate(
      {
        albumSpecId: ALBUM_SPEC_ID,
        assetIds: [],
      },
      {
        onSuccess: (album) => openPhotographs(album.id),
      },
    )
  }

  function closeDeleteModal() {
    if (!deleteAlbumMutation.isPending) {
      deleteAlbumMutation.reset()
      setAlbumPendingDelete(null)
    }
  }

  function openDeleteModal(album: Album) {
    deleteAlbumMutation.reset()
    setAlbumPendingDelete(album)
  }

  function confirmDeleteAlbum() {
    if (!albumPendingDelete) {
      return
    }

    deleteAlbumMutation.mutate(albumPendingDelete.id, {
      onSuccess: () => {
        removeAlbumFromCache(queryClient, albumPendingDelete.id)
        queryClient.invalidateQueries({ queryKey: ['albums'] })
        setAlbumPendingDelete(null)
      },
    })
  }

  return (
    <main className="books-page">
      <header className="books-masthead">
        <img
          className="books-masthead__lockup"
          src="/brand/fa-lockup-horizontal.svg"
          alt="Forever Artifacts"
        />
        <p className="books-masthead__context">Your archive</p>
      </header>

      <section className="books-opening">
        <div className="books-opening__statement">
          {/* <p className="books-overline">Forever Artifacts</p> */}
          <h1>The photographs that matter, made into a book</h1>
        </div>

        <div className="books-opening__action">
          <p className="books-product-notation">210 × 210 mm / 12 spreads</p>
          <p className="books-opening__support">
            Begin with your photographs, and compose your forever artifact one
            spread at a time.
          </p>
          <Button
            type="button"
            loading={createAlbumMutation.isPending}
            onClick={startBook}
          >
            {createAlbumMutation.isPending
              ? 'Starting your book...'
              : 'Start a new book'}
          </Button>
          <p className="books-opening__status" role="status">
            {createAlbumMutation.isError
              ? 'Your book could not be started. Try again.'
              : ''}
          </p>
        </div>
      </section>

      <section className="books-archive" aria-labelledby="books-heading">
        <header className="books-archive__header">
          <h2 id="books-heading">Your books</h2>
          <p>{bookCount === 1 ? '1 book' : `${bookCount} books`}</p>
        </header>

        {albumsQuery.isLoading && (
          <div className="books-archive__loading" aria-label="Loading books">
            {[0, 1, 2].map((row) => (
              <div className="books-loading-row" key={row}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        )}

        {albumsQuery.isError && (
          <div className="books-archive__message" role="alert">
            <p>Your books could not be loaded.</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => albumsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {albumsQuery.data && albumsQuery.data.length > 0 && (
          <div className="books-archive__rows">
            {albumsQuery.data.map((album, index) => (
              <BookIndexRow
                key={album.id}
                album={album}
                index={index}
                onDelete={() => openDeleteModal(album)}
              />
            ))}
          </div>
        )}
      </section>

      <ModalWrapper
        open={Boolean(albumPendingDelete)}
        title="Delete book"
        onClose={closeDeleteModal}
      >
        <div className="books-delete-dialog">
          <p>
            This will delete the book from your archive, including its spreads.
            This action cannot be undone.
          </p>
          <div className="books-delete-dialog__actions">
            <Button
              type="button"
              variant="secondary"
              disabled={deleteAlbumMutation.isPending}
              onClick={closeDeleteModal}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={deleteAlbumMutation.isPending}
              onClick={confirmDeleteAlbum}
            >
              Yes, delete
            </Button>
          </div>
          {deleteAlbumMutation.isError && (
            <p className="books-delete-dialog__status" role="status">
              The book could not be deleted. Try again.
            </p>
          )}
        </div>
      </ModalWrapper>
    </main>
  )
}
