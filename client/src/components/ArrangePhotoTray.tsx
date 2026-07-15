import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import type { AlbumAsset } from '../api/albums'

interface ArrangePhotoTrayProps {
  activeSpreadPosition: number
  albumId: string
  assets: AlbumAsset[]
  returnTo?: 'review'
  onSelectAsset: (assetId: string) => void
}

const INITIAL_VISIBLE_ASSETS = 12
const VISIBLE_ASSET_INCREMENT = 12

export function ArrangePhotoTray({
  activeSpreadPosition,
  albumId,
  assets,
  returnTo,
  onSelectAsset,
}: ArrangePhotoTrayProps) {
  const [visibleAssetCount, setVisibleAssetCount] = useState(
    INITIAL_VISIBLE_ASSETS,
  )
  const visibleAssets = assets.slice(0, visibleAssetCount)
  const hasAssets = assets.length > 0
  const canViewMore = visibleAssetCount < assets.length

  function viewMoreAssets() {
    setVisibleAssetCount((count) =>
      Math.min(count + VISIBLE_ASSET_INCREMENT, assets.length),
    )
  }

  return (
    <aside className="arrange-photo-tray" aria-label="Photographs">
      <div className="arrange-photo-tray__header">
        <h2>Photographs</h2>
        <Link
          to="/albums/$albumId/photos"
          params={{ albumId }}
          search={
            returnTo === 'review'
              ? { spread: activeSpreadPosition, returnTo }
              : {}
          }
        >
          Add photographs
        </Link>
      </div>

      {!hasAssets && (
        <p className="arrange-photo-tray__empty">
          No uploaded photographs yet.
        </p>
      )}

      {hasAssets && (
        <div className="arrange-photo-tray__body">
          <div
            className="arrange-photo-tray__scroller"
            data-expanded={visibleAssetCount > INITIAL_VISIBLE_ASSETS}
          >
            <div className="arrange-photo-tray__grid">
              {visibleAssets.map((asset) => (
                <button
                  key={asset.assetId}
                  type="button"
                  className="arrange-photo-tray__item"
                  onClick={() => onSelectAsset(asset.assetId)}
                >
                  <img
                    src={asset.previewUrl}
                    alt={`Uploaded photograph ${asset.order + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {canViewMore && (
            <button
              type="button"
              className="arrange-photo-tray__view-more"
              onClick={viewMoreAssets}
            >
              View more
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
