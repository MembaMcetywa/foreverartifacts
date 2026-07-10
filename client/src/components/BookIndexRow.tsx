import { Link } from '@tanstack/react-router'

import type { Album } from '../api/albums'

interface BookIndexRowProps {
  album: Album
  index: number
}

export function BookIndexRow({ album, index }: BookIndexRowProps) {
  const title = album.albumName || 'Untitled'
  const sequence = String(index + 1).padStart(2, '0')
  const progress = String(album.spreads.length).padStart(2, '0')
  const thumbnail = album.assets[0]?.previewUrl
  const continueTarget = getContinueTarget(album)

  return (
    <Link
      to={continueTarget.to}
      params={continueTarget.params}
      search={continueTarget.search}
      className="books-index-row"
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

  return {
    to: '/albums/$albumId/review' as const,
    params: { albumId: album.id },
    search: {},
  }
}
