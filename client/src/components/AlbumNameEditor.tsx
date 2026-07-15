import type { KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

interface AlbumNameEditorProps {
  albumName: string
  className?: string
  inputClassName?: string
  label: string
  saving?: boolean
  onSave: (albumName: string) => void
}

export function AlbumNameEditor({
  albumName,
  className,
  inputClassName,
  label,
  saving = false,
  onSave,
}: AlbumNameEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(albumName)

  useEffect(() => {
    if (!editing) {
      setDraftName(albumName)
    }
  }, [albumName, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function saveName() {
    const nextName = draftName.trim()

    setEditing(false)

    if (nextName && nextName !== albumName) {
      onSave(nextName)
    } else {
      setDraftName(albumName)
    }
  }

  function cancelEditing() {
    setDraftName(albumName)
    setEditing(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      saveName()
    }

    if (event.key === 'Escape') {
      cancelEditing()
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={inputClassName ?? className}
        value={draftName}
        aria-label={label}
        disabled={saving}
        maxLength={120}
        onBlur={saveName}
        onChange={(event) => setDraftName(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    )
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => setEditing(true)}
    >
      {albumName}
    </button>
  )
}
