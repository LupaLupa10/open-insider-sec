import Link from "next/link";

import type { Form4Transaction } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getRoleSummary
} from "@/lib/utils/format";

export function ResultsTable({ rows }: { rows: Form4Transaction[] }) {
  if (rows.length === 0) {
    return <div className="panel muted">No filings matched the current filter combination.</div>;
  }

  return (
    <div className="table-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name and Address of Reporting Person</th>
              <th>Issuer name</th>
              <th>Ticker</th>
              <th>Relationship</th>
              <th>Transaction date</th>
              <th>Transaction code</th>
              <th>Amount</th>
              <th>A or D</th>
              <th>Price</th>
              <th>Amount of Securities Owned</th>
              <th>Ownership form</th>
              <th>Filing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div>{row.reporting_owner_name}</div>
                  <div className="muted">{formatOwnerAddress(row)}</div>
                </td>
                <td>{row.issuer_name}</td>
                <td>{row.issuer_ticker ?? "—"}</td>
                <td>{getRoleSummary(row)}</td>
                <td>{formatDate(row.transaction_date)}</td>
                <td>{row.transaction_code}</td>
                <td>{formatNumber(row.transaction_shares)}</td>
                <td>{row.acquired_disposed_code ?? "—"}</td>
                <td>{formatCurrency(row.transaction_price_per_share)}</td>
                <td>{formatNumber(row.shares_owned_following)}</td>
                <td>{row.ownership_type ?? "—"}</td>
                <td>
                  {row.sec_url ? (
                    <a className="button-ghost" href={row.sec_url} rel="noreferrer" target="_blank">
                      SEC Form
                    </a>
                  ) : (
                    <Link className="button-ghost" href={`/filings/${row.filing_id}`}>
                      Open
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatOwnerAddress(row: Form4Transaction) {
  const line1 = [row.reporting_owner_street1, row.reporting_owner_street2].filter(Boolean).join(" ");
  const line2 = [row.reporting_owner_city, row.reporting_owner_state, row.reporting_owner_zip].filter(Boolean).join(", ");
  const value = [line1, line2].filter(Boolean).join(" ");
  return value || "—";
}
