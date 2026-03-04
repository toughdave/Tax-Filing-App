import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ paddingBottom: "3rem", paddingTop: "3rem" }}>
      <section className="container" style={{ display: "grid", gap: "1rem", textAlign: "center" }}>
        <div className="surface" style={{ padding: "2rem", display: "grid", gap: "0.8rem" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-title)", fontSize: "2rem" }}>404</h1>
          <p className="muted" style={{ margin: 0 }}>The page you are looking for does not exist.</p>
          <div>
            <Link className="btn btn-primary" href="/">Return home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
