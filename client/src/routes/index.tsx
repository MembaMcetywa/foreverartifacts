import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [
      {
        title: 'Forever Artifacts | Photo books for the photographs that matter',
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
        <header className="fa-site-header">
          <img
            className="fa-hero-wordmark"
            src="/brand/fa-wordmark-stacked.svg"
            alt="Forever Artifacts"
          />
          <Link to={'#' as '/'} className="fa-button-sm">
            Login
          </Link>
        </header>

        <div className="fa-hero-statement">
          <h1 className="fa-display">
            Your photographs deserve a life beyond the screen.
          </h1>

          <div className="fa-hero-support">
            <p className="fa-body">
              Turn the photographs that matter into a carefully designed and
              hand crafted book you can hold, revisit and keep.
            </p>

            <Link to={'#product' as '/'} className="fa-button">
              Create Your Photo Book
            </Link>
          </div>
        </div>
      </section>

      <section id="product" className="fa-product-band">
        <div className="fa-shell fa-product-inner">
          <div className="fa-product-intro">
            <p className="fa-overline">The Forever Artifacts Book</p>
            <p className="fa-format-mark">210 x 210</p>
            <p className="fa-format-unit">Millimetres</p>
          </div>

          <div className="fa-spread-study">
            <div
              className="fa-spread-diagram"
              role="img"
              aria-label="Diagram of an open square layflat photo-book spread"
            >
              <div className="fa-spread-page" />
              <div className="fa-spread-page" />
            </div>

            <div className="fa-spec-line">
              <span>Hardcover</span>
              <span>24 interior pages</span>
              <span>12 hand-crafted layflat spreads</span>
            </div>
          </div>
        </div>
      </section>

      <section className="fa-shell fa-statement-section">
        <p className="fa-overline">A Physical Life for Digital Memories</p>

        <h2 className="fa-statement">
          The photographs we value most are often the ones we see the least.
        </h2>

        <div className="fa-statement-foot">
          <p className="fa-body">
            Forever Artifacts brings them back into everyday life, where they
            can be held, shared and encountered again.
          </p>
        </div>
      </section>

      <section className="fa-shell fa-principles-section">
        <div className="fa-rule-strong" />
        <p className="fa-overline fa-principles-label">
          Designed with restraint
        </p>

        <div className="fa-principles">
          <article className="fa-principle">
            <p className="fa-principle-number">01</p>
            <h3>Considered format</h3>
            <p>Substantial in the hand. Easy to live with.</p>
          </article>

          <article className="fa-principle">
            <p className="fa-principle-number">02</p>
            <h3>Quiet composition</h3>
            <p>Consistent margins give every photograph room to breathe.</p>
          </article>

          <article className="fa-principle">
            <p className="fa-principle-number">03</p>
            <h3>Layflat binding</h3>
            <p>Images cross the centre without disappearing into the spine.</p>
          </article>
        </div>
      </section>

      <section className="fa-closing-section">
        <div className="fa-shell fa-closing-inner">
          <p className="fa-overline">Begin Your Book</p>
          <h2 className="fa-closing-title">
            Choose the photographs you want to keep close.
          </h2>
          <Link to={'#' as '/'} className="fa-button">
            Create Your Artifact
          </Link>
        </div>
      </section>
    </main>
  )
}
