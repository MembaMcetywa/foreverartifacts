import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'

import type { Album } from '../api/albums'

interface BookIndexRowProps {
  album: Album
  index: number
  onDelete: () => void
}

export function BookIndexRow({ album, index, onDelete }: BookIndexRowProps) {
  const title = album.albumName || 'Untitled'
  const sequence = String(index + 1).padStart(2, '0')
  const progress = String(album.spreads.length).padStart(2, '0')
  const thumbnail = album.assets[0]?.previewUrl
  const continueTarget = getContinueTarget(album)

  return (
    <article className="books-index-row">
      <Link
        to={continueTarget.to}
        params={continueTarget.params}
        search={continueTarget.search}
        className="books-index-row__link"
        aria-label={`Continue ${title}, ${album.spreads.length} of 12 spreads complete`}
      >
        <span className="books-index-row__sequence">{sequence}</span>

        <span className="books-index-row__thumbnail">
          {thumbnail && <img src={thumbnail} alt="" />}
        </span>

        <span className="books-index-row__title">{title}</span>

        <span className="books-index-row__progress">
          <span>{progress} / 12</span>
          <span className="books-index-row__progress-label">Spreads</span>
        </span>

        <span className="books-index-row__continue">Continue</span>
      </Link>

      <button
        type="button"
        className="books-index-row__delete"
        aria-label={`Delete ${title}`}
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" size={18} strokeWidth={1.75} />
      </button>
    </article>
  )
}

function getContinueTarget(album: Album) {
  if (album.workflowStage === 'collect_photos') {
    return {
      to: '/albums/$albumId/photos' as const,
      params: { albumId: album.id },
      search: {},
    }
  }

  if (album.workflowStage === 'compose_spreads') {
    return {
      to: '/albums/$albumId/arrange' as const,
      params: { albumId: album.id },
      search: album.activeSpreadPosition
        ? { spread: album.activeSpreadPosition }
        : {},
    }
  }

  if (album.workflowStage === 'render_album') {
    return {
      to: '/albums/$albumId/complete' as const,
      params: { albumId: album.id },
      search: {},
    }
  }

  return {
    to: '/albums/$albumId/review' as const,
    params: { albumId: album.id },
    search: {},
  }
}

