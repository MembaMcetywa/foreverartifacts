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
          'Layflat photo books designed to turn digital memories into lasting physical objects.',
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
              Photo books for the images that should not stay on a phone.
            </h1>

            <p className="fa-body mt-8 max-w-2xl">
              Forever Artifacts is building a single, carefully defined object:
              a premium layflat album that gives photographs a permanent place
              in the home.
            </p>

            <div className="fa-hero-actions">
              <Link to="/create" className="fa-button">
                Open Product Preview
              </Link>

              <a href="#product" className="fa-button fa-button-secondary">
                View Product Direction
              </a>
            </div>
          </div>

          <aside className="fa-hero-meta fa-kicker-block">
            <div className="fa-editorial-frame">
              <div>
                <p className="fa-overline">Current Product</p>
                <p className="mt-4 text-2xl leading-tight">
                  210 x 210 mm hardcover layflat photo book
                </p>
                <p className="fa-footnote mt-8 max-w-sm">
                  Product photography is being prepared. The landing page is
                  intentionally typographic until the real album shoot is ready.
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
              Twelve layflat spreads, with covers treated separately.
            </p>
          </div>

          <div className="fa-stat">
            <span className="fa-stat-value">1</span>
            <p className="fa-overline">MVP Format</p>
            <p className="fa-footnote mt-4">
              A single size keeps production, quality control, and fulfillment
              disciplined.
            </p>
          </div>

          <div className="fa-stat">
            <span className="fa-stat-value">300</span>
            <p className="fa-overline">Print Target</p>
            <p className="fa-footnote mt-4">
              The rendering pipeline is being shaped around premium print
              quality constraints.
            </p>
          </div>
        </div>
      </section>

      <section id="product" className="fa-shell fa-section">
        <div className="fa-rule" />

        <div className="fa-grid-12 pt-6">
          <div className="col-span-12 md:col-span-4">
            <p className="fa-overline">Product Direction</p>
          </div>

          <div className="col-span-12 md:col-span-8">
            <h2 className="fa-section-title max-w-3xl">
              The product is intentionally narrow in scope so the object can be
              precise.
            </h2>
          </div>
        </div>

        <div className="fa-grid-12 mt-12">
          <div className="col-span-12 md:col-span-4">
            <div className="fa-editorial-card">
              <p className="fa-overline">Format</p>
              <p className="mt-6 text-3xl leading-tight">
                One square format. One premium paper direction. One layflat
                experience.
              </p>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="fa-editorial-card">
              <p className="fa-overline">Aesthetic</p>
              <p className="mt-6 text-3xl leading-tight">
                Consistent margins, quiet pacing, and space that lets
                photographs breathe.
              </p>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <div className="fa-editorial-card">
              <p className="fa-overline">Intent</p>
              <p className="mt-6 text-3xl leading-tight">
                A home object first. Software exists to serve the printed
                result.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fa-shell fa-section">
        <div className="fa-rule" />

        <div className="fa-grid-12 pt-6">
          <div className="col-span-12 md:col-span-5">
            <p className="fa-overline">Design System</p>
            <h2 className="fa-section-title mt-8 max-w-xl">
              The brand should feel editorial, physical, and measured.
            </h2>
          </div>

          <div className="col-span-12 md:col-span-7">
            <div className="fa-detail-list">
              <div className="fa-detail-row">
                <p className="fa-overline">Typography</p>
                <p className="fa-body">
                  Neutral grotesk typography, large headline scale, controlled
                  spacing, and no decorative treatment competing with the
                  imagery.
                </p>
              </div>

              <div className="fa-detail-row">
                <p className="fa-overline">Colour</p>
                <p className="fa-body">
                  Warm paper tones, black structural elements, muted greys, and
                  no gradients. Contrast should come from layout and tone rather
                  than effects.
                </p>
              </div>

              <div className="fa-detail-row">
                <p className="fa-overline">Layout</p>
                <p className="fa-body">
                  Swiss grid discipline, thin rules, flat planes, and strict
                  alignment. White space should feel purposeful rather than
                  empty.
                </p>
              </div>

              <div className="fa-detail-row">
                <p className="fa-overline">Photography</p>
                <p className="fa-body">
                  Real album photography will eventually carry the emotional
                  weight. Until then, the site stays restrained and does not
                  fake the product.
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
            <p className="fa-overline">Current State</p>
          </div>

          <div className="col-span-12 md:col-span-8">
            <h2 className="fa-section-title max-w-3xl">
              The backend and render pipeline are being hardened first, because
              the print artifact is the core product.
            </h2>

            <p className="fa-body mt-8 max-w-2xl">
              The public site can already communicate the product direction
              cleanly while the ordering experience, authentication, and final
              marketing photography are still in development.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
