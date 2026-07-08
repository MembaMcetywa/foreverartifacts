import type { ReactNode } from 'react'

export interface CreationShellProps {
  stage: string
  title: string
  status?: string
  actions?: ReactNode
  children: ReactNode
}

// TODO: Add functionality to support editing current album title. 
// Will need to be a callback function that updates the title in the parent component and also updates the album title in the database.

export function CreationShell({
  stage,
  title,
  status,
  actions,
  children,
}: CreationShellProps) {
  return (
    <main className="creation-shell">
      <div className="creation-shell__inner">
        <header className="creation-shell__header">
          <p className="creation-shell__brand">ForeverArtifacts</p>

          <div className="creation-shell__project">
            <p className="creation-shell__title">{title}</p>
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
