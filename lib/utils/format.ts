import type { Form4Transaction } from "@/lib/types";

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const parts = value.split("-").map(Number);
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [year, month, day] = parts;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, day)));
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(Number(value));
}

export function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value));
}

export function getRoleSummary(transaction: Form4Transaction) {
  const roles: string[] = [];

  if (transaction.is_officer) {
    roles.push("Officer");
  }

  if (transaction.is_director) {
    roles.push("Director");
  }

  if (transaction.is_ten_percent_owner) {
    roles.push("10% Owner");
  }

  if (transaction.is_other) {
    roles.push("Other");
  }

  return roles.length > 0 ? roles.join(", ") : "—";
}

export function getDirectionLabel(code: string | null) {
  if (code === "A") {
    return "Buy/Acquire";
  }

  if (code === "D") {
    return "Sell/Dispose";
  }

  return "—";
}

export function getTransactionValue(transaction: Form4Transaction) {
  if (!transaction.transaction_shares || !transaction.transaction_price_per_share) {
    return null;
  }

  return Number(transaction.transaction_shares) * Number(transaction.transaction_price_per_share);
}
