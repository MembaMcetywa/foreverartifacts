import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [
      {
        title: 'Forever Artifacts',
      },
      {
        name: 'description',
        content:
          'Turn meaningful photographs into a carefully designed layflat photo book, made to be held, revisited and kept.',
      },
    ],
  }),
})

function Home() {
  return (
    <main className="fa-page">
      <section className="fa-shell fa-hero">
        <div className="fa-grid-12 mt-2">
          <div className="fa-hero-copy fa-kicker-block">
            <p className="fa-overline">Forever Artifacts</p>

            <h1 className="fa-display mt-8 max-w-5xl">
              Your photographs deserve a life beyond the screen.
            </h1>

            <p className="fa-body mt-8 max-w-2xl">
              Turn the photographs that matter into a carefully designed book
              you can hold, revisit and keep.
            </p>

            <div className="fa-hero-actions">
              <Link to="/create" className="fa-button">
                Create Your Photo Book
              </Link>

              <a href="#product" className="fa-button fa-button-secondary">
                Discover the Book
              </a>
            </div>
          </div>

          <aside className="fa-hero-meta fa-kicker-block">
            <div className="fa-editorial-frame">
              <div>
                <p className="fa-overline">The Forever Artifacts Book</p>
                <p className="mt-4 text-2xl leading-tight">
                  210 x 210 mm hardcover layflat photo book
                </p>
                <p className="fa-footnote mt-8 max-w-sm">
                  A considered format designed to feel substantial in the hand
                  and at home on the shelf.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="fa-stat-row">
          <div className="fa-stat">
            <span className="fa-stat-value">24</span>
            <p className="fa-overline">Interior Pages</p>
            <p className="fa-footnote mt-4">
              Twelve spreads, with the hardcover treated separately.
            </p>
          </div>

          <div className="fa-stat">
            <span className="fa-stat-value">210</span>
            <p className="fa-overline">Millimetres Square</p>
            <p className="fa-footnote mt-4">
              Large enough for photographs to hold attention, compact enough to
              live with.
            </p>
          </div>

          <div className="fa-stat">
            <span className="fa-stat-value">12</span>
            <p className="fa-overline">Layflat Spreads</p>
            <p className="fa-footnote mt-4">
              Pages open flat so photographs can move naturally across the
              centre.
            </p>
          </div>
        </div>
      </section>

      <section id="product" className="fa-shell fa-section">
        <div className="fa-rule" />

        <div className="fa-grid-12 pt-6">
          <div className="col-span-12 md:col-span-4">
            <p className="fa-overline">The Forever Artifacts Book</p>
          </div>

          <div className="col-span-12 md:col-span-8">
            <h2 className="fa-section-title max-w-3xl">
              Made to give your photographs a permanent place in your life.
            </h2>
            <p className="fa-body mt-8 max-w-2xl">
              A 210 x 210 mm hardcover photo book with 24 interior pages and
              hand crafted layflat binding. Every detail is designed around the photographs:
              balanced layouts, consistent margins and enough space for each
              image to breathe.
            </p>
          </div>
        </div>

        <div className="fa-grid-12 mt-12">
          <div className="col-span-12 md:col-span-4">
            <div className="fa-editorial-card">
              <p className="fa-overline">Considered Format</p>
              <p className="mt-6 text-3xl leading-tight">
                One square format, chosen to feel substantial without becoming
                difficult to live with.
              </p>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="fa-editorial-card">
              <p className="fa-overline">Quiet Composition</p>
              <p className="mt-6 text-3xl leading-tight">
                Consistent margins bring structure to every spread while giving
                each photograph room to breathe.
              </p>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="fa-editorial-card">
              <p className="fa-overline">Layflat Binding</p>
              <p className="mt-6 text-3xl leading-tight">
                Pages open flat so photographs can cross the centre without
                disappearing into the binding.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fa-shell fa-section">
        <div className="fa-rule" />

        <div className="fa-grid-12 pt-6">
          <div className="col-span-12 md:col-span-5">
            <p className="fa-overline">A Physical Life for Digital Memories</p>
            <h2 className="fa-section-title mt-8 max-w-xl">
              The photographs we value most are often the ones we see the least.
            </h2>
          </div>

          <div className="col-span-12 md:col-span-7">
            <div className="fa-detail-list">
              <div className="fa-detail-row">
                <p className="fa-overline">Out of Storage</p>
                <p className="fa-body">
                  They disappear into camera rolls, message threads and folders
                  we mean to return to.
                </p>
              </div>

              <div className="fa-detail-row">
                <p className="fa-overline">Into the Home</p>
                <p className="fa-body">
                  Forever Artifacts brings them back into everyday life, where
                  they can be held, shared and encountered again.
                </p>
              </div>

              <div className="fa-detail-row">
                <p className="fa-overline">Made Present</p>
                <p className="text-3xl leading-tight">
                  Not simply stored. Made present.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fa-shell fa-section">
        <div className="fa-rule" />

        <div className="fa-grid-12 pt-6">
          <div className="col-span-12 md:col-span-4">
            <p className="fa-overline">Begin Your Book</p>
          </div>

          <div className="col-span-12 md:col-span-8">
            <h2 className="fa-section-title max-w-3xl">
              Choose the photographs you want to keep close.
            </h2>

            <p className="fa-body mt-8 max-w-2xl">
              Arrange them into a lasting object, made for the shelf, the table
              and the hands of the people who matter.
            </p>

            <div className="fa-hero-actions">
              <Link to="/create" className="fa-button">
                Create Your Photo Book
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
