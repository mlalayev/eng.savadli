import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_circle_at_30%_20%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_60%),radial-gradient(900px_circle_at_70%_75%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_60%)]"
      />

      <div className="mx-auto w-full max-w-4xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-medium text-[var(--muted)]">Error 404</p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              This page doesn’t exist.
            </h1>
            <p className="mt-4 max-w-prose text-pretty text-base leading-relaxed text-[var(--muted)]">
              The link might be broken, or the page may have been moved. Use the
              options below to get back on track.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)] shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Go to home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--text)] shadow-sm transition-colors hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
              >
                Dashboard
              </Link>
            </div>

            <div className="mt-6 text-sm text-[var(--faint)]">
              If you think this is a mistake, try refreshing or go back to a
              known page.
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_1px_0_var(--shadow-ring),0_10px_30px_rgb(0_0_0_/_0.05)]">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                  </div>
                  <div className="text-xs text-[var(--faint)]">
                    dsat://not-found
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-6">
                  <div>
                    <div className="text-6xl font-semibold tracking-tight text-[var(--text)] sm:text-7xl">
                      404
                    </div>
                    <div className="mt-2 text-sm font-medium text-[var(--muted)]">
                      Page not found
                    </div>
                  </div>

                  <svg
                    aria-hidden="true"
                    viewBox="0 0 120 120"
                    className="h-24 w-24 text-[var(--accent)]"
                    fill="none"
                  >
                    {/* Clean “compass / lost” icon */}
                    <path
                      d="M60 12c26.5 0 48 21.5 48 48s-21.5 48-48 48S12 86.5 12 60 33.5 12 60 12Z"
                      stroke="currentColor"
                      strokeWidth="6"
                      opacity="0.18"
                    />
                    <path
                      d="M60 28c17.7 0 32 14.3 32 32S77.7 92 60 92 28 77.7 28 60s14.3-32 32-32Z"
                      stroke="currentColor"
                      strokeWidth="6"
                      opacity="0.35"
                    />
                    <path
                      d="M60 38v6"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                    <path
                      d="M60 76v6"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                    <path
                      d="M38 60h6"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                    <path
                      d="M76 60h6"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                    <path
                      d="M73 47 64.5 68.5 47 73 55.5 51.5 73 47Z"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinejoin="round"
                      opacity="0.9"
                    />
                    <path
                      d="M58 62a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                  </svg>
                </div>

                <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--muted)]">
                  Tip: check the URL for typos, or use the navigation menu to
                  find what you need.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

