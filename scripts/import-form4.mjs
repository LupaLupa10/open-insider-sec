import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: npm run import:form4 -- <path-to-json-or-csv>");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const extension = path.extname(inputPath).toLowerCase();
const source = await fs.readFile(inputPath, "utf8");
const rows = extension === ".csv" ? parseCsv(source) : JSON.parse(source);

if (!Array.isArray(rows)) {
  console.error("Expected the source file to contain an array of rows.");
  process.exit(1);
}

const filings = new Map();
const transactions = [];

for (const row of rows) {
  const normalized = normalizeRow(row);

  if (!normalized) {
    continue;
  }

  filings.set(normalized.filing.filing_id, normalized.filing);
  transactions.push(normalized.transaction);
}

const filingRows = [...filings.values()];

if (filingRows.length > 0) {
  const { error } = await supabase.from("filings").upsert(filingRows, { onConflict: "filing_id" });

  if (error) {
    console.error(`Failed to upsert filings: ${error.message}`);
    process.exit(1);
  }
}

if (transactions.length > 0) {
  const { error } = await supabase.from("form4_transactions").upsert(transactions, {
    onConflict: "filing_id,accession_no,transaction_date,transaction_code,reporting_owner_name,issuer_name"
  });

  if (error) {
    console.error(`Failed to upsert transactions: ${error.message}`);
    process.exit(1);
  }
}

console.log(`Imported ${filingRows.length} filings and ${transactions.length} transaction rows.`);

function normalizeRow(row) {
  const filingId = pick(row, ["filing_id", "filingId"]);
  const issuerName = pick(row, ["issuer_name", "issuerName"]);
  const reportingOwnerName = pick(row, ["reporting_owner_name", "reportingOwnerName"]);
  const transactionDate = pick(row, ["transaction_date", "transactionDate"]);
  const filingDate = pick(row, ["filing_date", "filingDate"]);
  const transactionCode = pick(row, ["transaction_code", "transactionCode"]);

  if (!filingId || !issuerName || !reportingOwnerName || !transactionDate || !filingDate || !transactionCode) {
    return null;
  }

  const accessionNo = pick(row, ["accession_no", "accessionNo"]) ?? filingId;

  return {
    filing: {
      filing_id: filingId,
      accession_no: accessionNo,
      issuer_cik: pick(row, ["issuer_cik", "issuerCik"]) ?? "",
      issuer_ticker: pick(row, ["issuer_ticker", "issuerTicker"]) ?? null,
      issuer_name: issuerName,
      reporting_owner_cik: pick(row, ["reporting_owner_cik", "reportingOwnerCik"]) ?? "",
      reporting_owner_name: reportingOwnerName,
      filing_date: filingDate,
      accepted_at: pick(row, ["accepted_at", "acceptedAt"]) ?? null,
      sec_url: pick(row, ["sec_url", "secUrl"]) ?? null,
      raw_payload: row
    },
    transaction: {
      filing_id: filingId,
      accession_no: accessionNo,
      issuer_cik: pick(row, ["issuer_cik", "issuerCik"]) ?? "",
      issuer_ticker: pick(row, ["issuer_ticker", "issuerTicker"]) ?? null,
      issuer_name: issuerName,
      reporting_owner_cik: pick(row, ["reporting_owner_cik", "reportingOwnerCik"]) ?? "",
      reporting_owner_name: reportingOwnerName,
      reporting_owner_street1: pick(row, ["reporting_owner_street1", "reportingOwnerStreet1"]) ?? null,
      reporting_owner_street2: pick(row, ["reporting_owner_street2", "reportingOwnerStreet2"]) ?? null,
      reporting_owner_city: pick(row, ["reporting_owner_city", "reportingOwnerCity"]) ?? null,
      reporting_owner_state: pick(row, ["reporting_owner_state", "reportingOwnerState"]) ?? null,
      reporting_owner_zip: pick(row, ["reporting_owner_zip", "reportingOwnerZip"]) ?? null,
      reporting_owner_title: pick(row, ["reporting_owner_title", "reportingOwnerTitle"]) ?? null,
      is_director: asBoolean(pick(row, ["is_director", "isDirector"])),
      is_officer: asBoolean(pick(row, ["is_officer", "isOfficer"])),
      is_ten_percent_owner: asBoolean(pick(row, ["is_ten_percent_owner", "isTenPercentOwner"])),
      is_other: asBoolean(pick(row, ["is_other", "isOther"])),
      officer_title: pick(row, ["officer_title", "officerTitle"]) ?? null,
      security_title: pick(row, ["security_title", "securityTitle"]) ?? null,
      transaction_date: transactionDate,
      filing_date: filingDate,
      transaction_code: transactionCode,
      transaction_shares: normalizeNumeric(pick(row, ["transaction_shares", "transactionShares"])),
      transaction_price_per_share: normalizeNumeric(
        pick(row, ["transaction_price_per_share", "transactionPricePerShare"])
      ),
      acquired_disposed_code: pick(row, ["acquired_disposed_code", "acquiredDisposedCode"]) ?? null,
      shares_owned_following: normalizeNumeric(pick(row, ["shares_owned_following", "sharesOwnedFollowing"])),
      ownership_type: pick(row, ["ownership_type", "ownershipType"]) ?? null,
      form_type: pick(row, ["form_type", "formType"]) ?? "4",
      sec_url: pick(row, ["sec_url", "secUrl"]) ?? null,
      raw_payload: row
    }
  };
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return null;
}

function normalizeNumeric(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const cleaned = String(value).replace(/[$,]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function asBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

function parseCsv(source) {
  const lines = source.split(/\r?\n/).filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}
