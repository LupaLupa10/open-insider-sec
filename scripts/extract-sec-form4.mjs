import fs from "node:fs/promises";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const DATA_SEC_BASE = "https://data.sec.gov";
const ARCHIVES_BASE = "https://www.sec.gov/Archives/edgar/data";
const DEFAULT_DELAY_MS = 250;
const DEFAULT_LIMIT = 100;

const args = parseArgs(process.argv.slice(2));

if (!args.ciks || args.ciks.length === 0) {
  console.error("Usage: npm run extract:sec -- --cik 1318605[,320193] [--limit 100] [--since 2025-01-01] [--out ./form4.json] [--upsert]");
  process.exit(1);
}

const userAgent = process.env.SEC_USER_AGENT;

if (!userAgent) {
  console.error("Missing SEC_USER_AGENT env var (required by SEC). Example: 'Your Name your@email.com'");
  process.exit(1);
}

const shouldUpsert = Boolean(args.upsert);

if (shouldUpsert) {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required env vars for upsert: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const filings = [];
const transactions = [];
let dedupedTransactionCount = 0;

for (const cik of args.ciks) {
  const paddedCik = padCik(cik);
  const submission = await fetchJson(`${DATA_SEC_BASE}/submissions/CIK${paddedCik}.json`, userAgent);
  const recent = submission?.filings?.recent;

  if (!recent || !Array.isArray(recent.form)) {
    console.warn(`No recent filings array for CIK ${cik}`);
    continue;
  }

  const candidates = collectRecentFilingRows(recent, submission?.cik ?? String(Number(cik)))
    .filter((item) => item.form === "4" || item.form === "4/A")
    .filter((item) => (args.since ? item.filingDate >= args.since : true))
    .slice(0, args.limit);

  for (const filing of candidates) {
    const parsed = await extractOneFiling({
      cik: filing.cik,
      accessionNumber: filing.accessionNumber,
      filingDate: filing.filingDate,
      form: filing.form,
      primaryDocument: filing.primaryDocument,
      reportDate: filing.reportDate,
      userAgent
    });

    if (!parsed) {
      continue;
    }

    filings.push(parsed.filing);
    transactions.push(...parsed.transactions);
    await sleep(DEFAULT_DELAY_MS);
  }
}

if (args.out) {
  await fs.writeFile(
    args.out,
    JSON.stringify(
      {
        extractedAt: new Date().toISOString(),
        ciks: args.ciks,
        filings,
        transactions
      },
      null,
      2
    ),
    "utf8"
  );
}

if (shouldUpsert) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const dedupedFilings = [...new Map(filings.map((item) => [item.filing_id, item])).values()];
  const dedupedTransactions = [
    ...new Map(
      transactions.map((item) => [
        [
          item.filing_id,
          item.accession_no,
          item.transaction_date,
          item.transaction_code,
          item.reporting_owner_name,
          item.issuer_name
        ].join("|"),
        item
      ])
    ).values()
  ];
  dedupedTransactionCount = dedupedTransactions.length;

  if (dedupedFilings.length > 0) {
    const { error } = await supabase.from("filings").upsert(dedupedFilings, { onConflict: "filing_id" });

    if (error) {
      console.error(`Failed to upsert filings: ${error.message}`);
      process.exit(1);
    }
  }

  if (dedupedTransactions.length > 0) {
    const { error } = await supabase.from("form4_transactions").upsert(dedupedTransactions, {
      onConflict: "filing_id,accession_no,transaction_date,transaction_code,reporting_owner_name,issuer_name"
    });

    if (error) {
      console.error(`Failed to upsert transactions: ${error.message}`);
      process.exit(1);
    }
  }
}

console.log(
  JSON.stringify(
    {
      filings: filings.length,
      transactions: transactions.length,
      dedupedTransactions: dedupedTransactionCount,
      outputFile: args.out ?? null,
      upserted: shouldUpsert
    },
    null,
    2
  )
);

async function extractOneFiling({ cik, accessionNumber, filingDate, form, primaryDocument, reportDate, userAgent }) {
  const cikNoLeadingZeros = String(Number(cik));
  const accessionNoDashes = accessionNumber.replaceAll("-", "");
  const filingId = `${cikNoLeadingZeros}-${accessionNoDashes}`;
  const packageUrl = `${ARCHIVES_BASE}/${cikNoLeadingZeros}/${accessionNoDashes}/${accessionNumber}.txt`;
  const docUrl = `${ARCHIVES_BASE}/${cikNoLeadingZeros}/${accessionNoDashes}/${primaryDocument}`;

  let xml;
  let acceptedFromPackage = null;
  try {
    const packageText = await fetchText(packageUrl, userAgent);
    acceptedFromPackage = extractAcceptanceDatetimeFromPackage(packageText);
    xml = extractOwnershipXmlFromPackage(packageText);

    if (!xml) {
      xml = await fetchText(docUrl, userAgent);
    }
  } catch (error) {
    console.warn(`Skipping ${accessionNumber}, failed to fetch ${primaryDocument}: ${error.message}`);
    return null;
  }

  const issuer = {
    issuer_cik: firstTag(xml, "issuerCik") ?? cikNoLeadingZeros,
    issuer_name: firstTag(xml, "issuerName") ?? "",
    issuer_ticker: firstTag(xml, "issuerTradingSymbol") ?? null
  };
  const owner = {
    reporting_owner_cik: firstTag(xml, "rptOwnerCik") ?? "",
    reporting_owner_name: firstTag(xml, "rptOwnerName") ?? "",
    reporting_owner_street1: firstTag(xml, "reportingOwnerAddress/rptOwnerStreet1") ?? null,
    reporting_owner_street2: firstTag(xml, "reportingOwnerAddress/rptOwnerStreet2") ?? null,
    reporting_owner_city: firstTag(xml, "reportingOwnerAddress/rptOwnerCity") ?? null,
    reporting_owner_state: firstTag(xml, "reportingOwnerAddress/rptOwnerState") ?? null,
    reporting_owner_zip: firstTag(xml, "reportingOwnerAddress/rptOwnerZipCode") ?? null
  };
  const ownerRelationXml = firstBlock(xml, "reportingOwnerRelationship") ?? "";
  const ownerFlags = {
    is_director: toBoolean(firstTag(ownerRelationXml, "isDirector")),
    is_officer: toBoolean(firstTag(ownerRelationXml, "isOfficer")),
    is_ten_percent_owner: toBoolean(firstTag(ownerRelationXml, "isTenPercentOwner")),
    is_other: toBoolean(firstTag(ownerRelationXml, "isOther")),
    officer_title: firstTag(ownerRelationXml, "officerTitle") ?? null
  };

  const filing = {
    filing_id: filingId,
    accession_no: accessionNumber,
    issuer_cik: issuer.issuer_cik,
    issuer_ticker: issuer.issuer_ticker,
    issuer_name: issuer.issuer_name || "Unknown Issuer",
    reporting_owner_cik: owner.reporting_owner_cik,
    reporting_owner_name: owner.reporting_owner_name || "Unknown Owner",
    filing_date: filingDate,
    accepted_at:
      acceptedFromPackage ??
      (firstTag(xml, "acceptanceDatetime") ? normalizeAcceptedDatetime(firstTag(xml, "acceptanceDatetime")) : null),
    sec_url: docUrl,
    raw_payload: {
      source: "sec-edgar",
      form,
      reportDate
    }
  };

  const nonDerivativeBlocks = allBlocks(xml, "nonDerivativeTransaction");
  const parsedTransactions = nonDerivativeBlocks
    .map((block) => normalizeTransactionBlock(block, filing, owner, ownerFlags, docUrl, form))
    .filter(Boolean);

  if (parsedTransactions.length > 0) {
    return {
      filing,
      transactions: parsedTransactions
    };
  }

  const fallbackTransactionDate = firstTag(xml, "transactionDate/value") ?? reportDate ?? filingDate;
  return {
    filing,
    transactions: [
      {
        filing_id: filing.filing_id,
        accession_no: filing.accession_no,
        issuer_cik: filing.issuer_cik,
        issuer_ticker: filing.issuer_ticker,
        issuer_name: filing.issuer_name,
        reporting_owner_cik: filing.reporting_owner_cik,
        reporting_owner_name: filing.reporting_owner_name,
        reporting_owner_street1: owner.reporting_owner_street1,
        reporting_owner_street2: owner.reporting_owner_street2,
        reporting_owner_city: owner.reporting_owner_city,
        reporting_owner_state: owner.reporting_owner_state,
        reporting_owner_zip: owner.reporting_owner_zip,
        reporting_owner_title: null,
        is_director: ownerFlags.is_director,
        is_officer: ownerFlags.is_officer,
        is_ten_percent_owner: ownerFlags.is_ten_percent_owner,
        is_other: ownerFlags.is_other,
        officer_title: ownerFlags.officer_title,
        security_title: firstTag(xml, "securityTitle/value") ?? null,
        transaction_date: fallbackTransactionDate,
        filing_date: filing.filing_date,
        transaction_code: firstTag(xml, "transactionCoding/transactionCode") ?? "UNK",
        transaction_shares: null,
        transaction_price_per_share: null,
        acquired_disposed_code: firstTag(xml, "transactionAcquiredDisposedCode/value") ?? null,
        shares_owned_following: null,
        ownership_type: firstTag(xml, "directOrIndirectOwnership/value") ?? null,
        form_type: form.replace("/A", ""),
        sec_url: docUrl,
        raw_payload: {
          source: "sec-edgar-fallback",
          missingNonDerivativeTransactions: true
        }
      }
    ]
  };
}

function normalizeTransactionBlock(block, filing, owner, ownerFlags, secUrl, form) {
  const transactionDate = firstTag(block, "transactionDate/value");
  const transactionCode = firstTag(block, "transactionCoding/transactionCode");

  if (!transactionDate || !transactionCode) {
    return null;
  }

  return {
    filing_id: filing.filing_id,
    accession_no: filing.accession_no,
    issuer_cik: filing.issuer_cik,
    issuer_ticker: filing.issuer_ticker,
    issuer_name: filing.issuer_name,
    reporting_owner_cik: filing.reporting_owner_cik,
    reporting_owner_name: filing.reporting_owner_name,
    reporting_owner_street1: owner.reporting_owner_street1 ?? null,
    reporting_owner_street2: owner.reporting_owner_street2 ?? null,
    reporting_owner_city: owner.reporting_owner_city ?? null,
    reporting_owner_state: owner.reporting_owner_state ?? null,
    reporting_owner_zip: owner.reporting_owner_zip ?? null,
    reporting_owner_title: null,
    is_director: ownerFlags.is_director,
    is_officer: ownerFlags.is_officer,
    is_ten_percent_owner: ownerFlags.is_ten_percent_owner,
    is_other: ownerFlags.is_other,
    officer_title: ownerFlags.officer_title,
    security_title: firstTag(block, "securityTitle/value") ?? null,
    transaction_date: transactionDate,
    filing_date: filing.filing_date,
    transaction_code: transactionCode,
    transaction_shares: asNumeric(firstTag(block, "transactionAmounts/transactionShares/value")),
    transaction_price_per_share: asNumeric(firstTag(block, "transactionAmounts/transactionPricePerShare/value")),
    acquired_disposed_code: firstTag(block, "transactionAmounts/transactionAcquiredDisposedCode/value") ?? null,
    shares_owned_following: asNumeric(firstTag(block, "postTransactionAmounts/sharesOwnedFollowingTransaction/value")),
    ownership_type: firstTag(block, "ownershipNature/directOrIndirectOwnership/value") ?? null,
    form_type: form.replace("/A", ""),
    sec_url: secUrl,
    raw_payload: {
      source: "sec-edgar"
    }
  };
}

function collectRecentFilingRows(recent, fallbackCik) {
  const size = recent.form.length;
  const rows = [];

  for (let i = 0; i < size; i += 1) {
    rows.push({
      form: recent.form[i],
      accessionNumber: recent.accessionNumber[i],
      filingDate: recent.filingDate[i],
      reportDate: recent.reportDate?.[i] ?? null,
      primaryDocument: recent.primaryDocument[i],
      cik: recent.cik?.[i] ?? recent.cik ?? fallbackCik ?? null
    });
  }

  return rows.filter((row) => row.accessionNumber && row.filingDate && row.primaryDocument && row.cik);
}

async function fetchJson(url, userAgent) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

async function fetchText(url, userAgent) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

function firstTag(xml, path) {
  if (!xml) return null;
  const direct = findNestedTagValue(xml, path);
  if (direct) return decodeXml(direct);
  return null;
}

function firstBlock(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = pattern.exec(xml);
  return match?.[0] ?? null;
}

function allBlocks(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const out = [];
  let match;

  while ((match = pattern.exec(xml)) !== null) {
    out.push(match[0]);
  }

  return out;
}

function findNestedTagValue(xml, path) {
  const tags = path.split("/");
  let fragment = xml;

  for (const tag of tags) {
    const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
    const match = pattern.exec(fragment);
    if (!match) return null;
    fragment = match[1];
  }

  return stripTags(fragment).trim();
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, "");
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function asNumeric(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/[$,]/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value) {
  if (!value) return false;
  return ["1", "true", "y", "yes"].includes(String(value).toLowerCase());
}

function normalizeAcceptedDatetime(value) {
  if (!value) return null;
  const raw = String(value).trim();

  if (/^\d{14}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}Z`;
  }

  return raw;
}

function extractOwnershipXmlFromPackage(packageText) {
  if (!packageText) {
    return null;
  }

  const xmlBlocks = [...packageText.matchAll(/<XML>\s*([\s\S]*?)\s*<\/XML>/gi)].map((match) => match[1]);
  const ownershipBlock = xmlBlocks.find((block) => block.includes("<ownershipDocument>"));

  return ownershipBlock ?? null;
}

function extractAcceptanceDatetimeFromPackage(packageText) {
  if (!packageText) {
    return null;
  }

  const match = packageText.match(/<ACCEPTANCE-DATETIME>\s*(\d{14})/i);

  if (!match?.[1]) {
    return null;
  }

  return normalizeAcceptedDatetime(match[1]);
}

function parseArgs(argv) {
  const parsed = {
    ciks: [],
    limit: DEFAULT_LIMIT,
    since: null,
    out: null,
    upsert: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--cik") {
      parsed.ciks = (argv[i + 1] ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (token === "--limit") {
      parsed.limit = Number(argv[i + 1] ?? DEFAULT_LIMIT);
      i += 1;
      continue;
    }

    if (token === "--since") {
      parsed.since = argv[i + 1] ?? null;
      i += 1;
      continue;
    }

    if (token === "--out") {
      parsed.out = argv[i + 1] ?? null;
      i += 1;
      continue;
    }

    if (token === "--upsert") {
      parsed.upsert = true;
    }
  }

  return parsed;
}

function padCik(value) {
  return String(value).replace(/\D/g, "").padStart(10, "0");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
