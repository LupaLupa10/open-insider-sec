import { notFound } from "next/navigation";

import { ResultsTable } from "@/components/results-table";
import { getFilingDetail } from "@/lib/data/queries";
import { formatDate } from "@/lib/utils/format";

export default async function FilingDetailPage({ params }: { params: Promise<{ filingId: string }> }) {
  const { filingId } = await params;
  const filing = await getFilingDetail(filingId);

  if (!filing) {
    notFound();
  }

  return (
    <div className="shell stack">
      <section className="detail-card stack">
        <div className="eyebrow">Filing detail</div>
        <h1>{filing.issuer_name}</h1>
        <div className="card-grid">
          <div className="metric-card stack">
            <span className="muted">Ticker</span>
            <strong>{filing.issuer_ticker ?? "—"}</strong>
          </div>
          <div className="metric-card stack">
            <span className="muted">Reporting owner</span>
            <strong>{filing.reporting_owner_name}</strong>
          </div>
          <div className="metric-card stack">
            <span className="muted">Filing date</span>
            <strong>{formatDate(filing.filing_date)}</strong>
          </div>
        </div>
        <div className="stack">
          <span className="muted">Accession number</span>
          <strong>{filing.accession_no}</strong>
        </div>
        {filing.sec_url ? (
          <a className="button-secondary" href={filing.sec_url} rel="noreferrer" target="_blank">
            Open on SEC
          </a>
        ) : null}
      </section>

      <section className="stack">
        <div className="section-heading">
          <div className="eyebrow">Transactions</div>
          <h2>Rows included in this filing</h2>
        </div>
        <ResultsTable rows={filing.transactions} />
      </section>
    </div>
  );
}
