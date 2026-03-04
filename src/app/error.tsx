"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main style={{ paddingBottom: "3rem", paddingTop: "3rem" }}>
      <section className="container" style={{ display: "grid", gap: "1rem", textAlign: "center" }}>
        <div className="surface" style={{ padding: "2rem", display: "grid", gap: "0.8rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "1.5rem" }}>Something went wrong</h1>
          <p className="muted" style={{ margin: 0 }}>
            {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."}
          </p>
          <div>
            <button className="btn btn-primary" type="button" onClick={reset}>Try again</button>
          </div>
        </div>
      </section>
    </main>
  );
}
