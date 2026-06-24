import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to ForeverArtifacts</h1>
      <p className="mt-4 text-lg">
        This is ForeverArtifacts, the artifacts are meant to last forever.
      </p>
    </div>
  )
}
