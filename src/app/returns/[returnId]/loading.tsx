export default function ReturnLoading() {
  return (
    <main style={{ paddingBottom: "3rem" }}>
      <div style={{ height: "56px", background: "rgba(255,255,255,0.5)" }} />
      <section className="container" style={{ marginTop: "1.2rem", display: "grid", gap: "0.9rem" }}>
        <div className="surface" style={{ padding: "1.2rem", display: "grid", gap: "0.5rem" }}>
          <div style={{ height: "1.5rem", width: "16rem", background: "#e2e8f0", borderRadius: "6px" }} />
          <div style={{ height: "1rem", width: "10rem", background: "#edf2f7", borderRadius: "6px" }} />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="surface" style={{ padding: "1rem" }}>
            <div style={{ height: "1.1rem", width: `${8 + i * 3}rem`, background: "#edf2f7", borderRadius: "6px", marginBottom: "0.6rem" }} />
            <div style={{ height: "2.5rem", background: "#f7fafc", borderRadius: "8px" }} />
          </div>
        ))}
      </section>
    </main>
  );
}
