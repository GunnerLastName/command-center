export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080d13", color: "white", flexDirection: "column", gap: "16px" }}>
      <span style={{ fontSize: "48px", color: "#fbb415" }}>⌘</span>
      <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Page not found</h1>
      <a href="/" style={{ color: "#fbb415", textDecoration: "underline", fontSize: "14px" }}>Go to dashboard</a>
    </div>
  );
}
