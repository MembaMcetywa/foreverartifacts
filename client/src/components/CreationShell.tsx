import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { AlbumNameEditor } from './AlbumNameEditor'
import { Spinner } from './Spinner'

export interface CreationShellProps {
  stage: string
  title: string
  status?: string
  actions?: ReactNode
  titleSaving?: boolean
  children: ReactNode
  onTitleSave?: (title: string) => void
}

export function CreationShell({
  stage,
  title,
  status,
  actions,
  titleSaving,
  children,
  onTitleSave,
}: CreationShellProps) {
  return (
    <main className="creation-shell">
      <div className="creation-shell__inner">
        <header className="creation-shell__header">
          <Link
            to="/create"
            className="creation-shell__brand"
            aria-label="Forever Artifacts books"
          >
            <img src="/brand/fa-mark-spread.svg" alt="Forever Artifacts" />
          </Link>

          <div className="creation-shell__project">
            {onTitleSave ? (
              <AlbumNameEditor
                albumName={title}
                className="creation-shell__title"
                label="Edit album name"
                saving={titleSaving}
                onSave={onTitleSave}
              />
            ) : (
              <p className="creation-shell__title">{title}</p>
            )}
            {titleSaving && <Spinner size="sm" label="Saving album name" />}
            {status && <p className="creation-shell__status">{status}</p>}
          </div>

          <p className="creation-shell__stage">{stage}</p>

          {actions && <div className="creation-shell__actions">{actions}</div>}
        </header>

        <div className="creation-shell__body">{children}</div>
      </div>
    </main>
  )
}
