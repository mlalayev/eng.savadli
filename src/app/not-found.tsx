import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex h-[calc(100dvh-64px)] flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_circle_at_30%_20%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_60%),radial-gradient(900px_circle_at_70%_75%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_60%)]"
      />

      <div className="mx-auto w-full max-w-4xl overflow-hidden">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-medium text-[var(--muted)]">Error 404</p>
            <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              This page doesn’t exist.
            </h1>
            <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-[var(--muted)] sm:mt-4 sm:text-base">
              The link might be broken, or the page may have been moved. Use the
              options below to get back on track.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
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

            <div className="mt-5 text-sm text-[var(--faint)] sm:mt-6">
              If you think this is a mistake, try refreshing or go back to a
              known page.
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_1px_0_var(--shadow-ring),0_10px_30px_rgb(0_0_0_/_0.05)] sm:p-6">
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

                <div className="mt-5 sm:mt-6">
                  <div>
                    <div className="text-5xl font-semibold tracking-tight text-[var(--text)] sm:text-7xl">
                      404
                    </div>
                    <div className="mt-2 text-sm font-medium text-[var(--muted)]">
                      Page not found
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--muted)] sm:mt-6 sm:p-4">
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

