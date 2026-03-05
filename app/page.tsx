import Link from "next/link";

const highlights = [
  {
    title: "Filter by the fields that matter",
    body: "Search by issuer, insider, transaction code, role, ownership type, filing date, and transaction date without exposing raw SEC XML."
  },
  {
    title: "Start public, save when signed in",
    body: "Anyone can browse filings. Authenticated users can preserve their working screens as named saved filters."
  },
  {
    title: "Supabase-native backend",
    body: "Postgres, Row Level Security, email/password auth, and a straightforward import path for extracted Form 4 data."
  }
];

export default function HomePage() {
  return (
    <div className="shell stack">
      <section className="hero">
        <div className="stack">
          <div className="eyebrow">SEC Form 4 Explorer</div>
          <h1>Track insider transactions without digging through EDGAR manually.</h1>
          <p className="lede">
            Browse extracted Form 4 filings by issuer, insider, role, transaction behavior, ownership type, and date ranges.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/explorer">
              Explore filings
            </Link>
            <Link className="button-secondary" href="/auth/sign-up">
              Create account
            </Link>
          </div>
        </div>
        <div className="detail-card stack">
          <div className="eyebrow">Core fields</div>
          <div className="pill-row">
            <span className="pill">Issuer ticker</span>
            <span className="pill">Reporting owner</span>
            <span className="pill">Transaction code</span>
            <span className="pill">Ownership type</span>
            <span className="pill">Buy / Sell</span>
            <span className="pill">Date ranges</span>
          </div>
          <p className="muted">
            Host on Vercel, store extracted filings in Supabase, and keep auth and row-level access in one place.
          </p>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div className="eyebrow">What ships in v1</div>
          <h2>Focused explorer, not a bloated terminal mirror.</h2>
        </div>
        <div className="card-grid">
          {highlights.map((item) => (
            <article className="metric-card stack" key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
