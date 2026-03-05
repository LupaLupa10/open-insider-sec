import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="shell auth-layout stack">
      <div className="section-heading">
        <div className="eyebrow">Not found</div>
        <h2>The requested filing or page does not exist.</h2>
      </div>
      <div className="panel stack">
        <p className="muted">Use the explorer to return to indexed Form 4 records.</p>
        <Link className="button" href="/explorer">
          Back to explorer
        </Link>
      </div>
    </div>
  );
}
