"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ACQUIRED_DISPOSED_OPTIONS,
  DEFAULT_FILTERS,
  OWNERSHIP_TYPE_OPTIONS,
  ROLE_OPTIONS,
  TRANSACTION_CODE_OPTIONS
} from "@/lib/constants";
import type { ExplorerFilters } from "@/lib/types";
import { filtersToSearchParams } from "@/lib/utils/filters";

export function ExplorerFilterForm({ initialFilters }: { initialFilters: ExplorerFilters }) {
  const [filters, setFilters] = useState(initialFilters);
  const router = useRouter();
  const issuerTickerValue = filters.issuerTicker.join(", ");
  const issuerNameValue = filters.issuerName.join(", ");
  const ownerNameValue = filters.reportingOwnerName.join(", ");

  function updateArray(name: keyof ExplorerFilters, value: string, checked: boolean) {
    setFilters((current) => {
      const currentValues = current[name] as string[];
      const nextValues = checked ? [...currentValues, value] : currentValues.filter((item) => item !== value);

      return {
        ...current,
        [name]: nextValues,
        page: 1
      };
    });
  }

  function submit() {
    router.push(`/explorer?${filtersToSearchParams({ ...filters, page: 1 })}`);
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
    router.push("/explorer");
  }

  return (
    <div className="panel sticky-panel stack">
      <div>
        <h2>Filters</h2>
        <p className="muted">Refine public Form 4 records across issuer, insider, timing, and transaction behavior.</p>
      </div>

      <label className="stack">
        <span>Search</span>
        <input
          onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value, page: 1 }))}
          placeholder="Ticker, issuer, or reporting owner"
          value={filters.q}
        />
      </label>

      <div className="filter-grid">
        <label className="stack">
          <span>Issuer tickers</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                issuerTicker: splitInput(event.target.value),
                page: 1
              }))
            }
            placeholder="TSLA, NVDA"
            value={issuerTickerValue}
          />
        </label>
        <label className="stack">
          <span>Issuer names</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                issuerName: splitInput(event.target.value),
                page: 1
              }))
            }
            placeholder="Tesla, Nvidia"
            value={issuerNameValue}
          />
        </label>
      </div>

      <label className="stack">
        <span>Reporting owners</span>
        <input
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              reportingOwnerName: splitInput(event.target.value),
              page: 1
            }))
          }
          placeholder="Elon Musk, Jensen Huang"
          value={ownerNameValue}
        />
      </label>

      <div className="filter-group">
        <span>Roles</span>
        <div className="checkbox-grid">
          {ROLE_OPTIONS.map((option) => (
            <label className="checkbox-row" key={option.value}>
              <input
                checked={filters.roles.includes(option.value)}
                onChange={(event) => updateArray("roles", option.value, event.target.checked)}
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span>Transaction codes</span>
        <div className="checkbox-grid">
          {TRANSACTION_CODE_OPTIONS.map((code) => (
            <label className="checkbox-row" key={code}>
              <input
                checked={filters.transactionCodes.includes(code)}
                onChange={(event) => updateArray("transactionCodes", code, event.target.checked)}
                type="checkbox"
              />
              <span>{code}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span>Ownership type</span>
        <div className="checkbox-grid">
          {OWNERSHIP_TYPE_OPTIONS.map((option) => (
            <label className="checkbox-row" key={option.value}>
              <input
                checked={filters.ownershipTypes.includes(option.value)}
                onChange={(event) => updateArray("ownershipTypes", option.value, event.target.checked)}
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span>Buy / Sell</span>
        <div className="checkbox-grid">
          {ACQUIRED_DISPOSED_OPTIONS.map((option) => (
            <label className="checkbox-row" key={option.value}>
              <input
                checked={filters.acquiredDisposed.includes(option.value)}
                onChange={(event) => updateArray("acquiredDisposed", option.value, event.target.checked)}
                type="checkbox"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-grid">
        <label className="stack">
          <span>Transaction date from</span>
          <input
            onChange={(event) => setFilters((current) => ({ ...current, transactionDateFrom: event.target.value || null, page: 1 }))}
            type="date"
            value={filters.transactionDateFrom ?? ""}
          />
        </label>
        <label className="stack">
          <span>Transaction date to</span>
          <input
            onChange={(event) => setFilters((current) => ({ ...current, transactionDateTo: event.target.value || null, page: 1 }))}
            type="date"
            value={filters.transactionDateTo ?? ""}
          />
        </label>
        <label className="stack">
          <span>Filing date from</span>
          <input
            onChange={(event) => setFilters((current) => ({ ...current, filingDateFrom: event.target.value || null, page: 1 }))}
            type="date"
            value={filters.filingDateFrom ?? ""}
          />
        </label>
        <label className="stack">
          <span>Filing date to</span>
          <input
            onChange={(event) => setFilters((current) => ({ ...current, filingDateTo: event.target.value || null, page: 1 }))}
            type="date"
            value={filters.filingDateTo ?? ""}
          />
        </label>
      </div>

      <div className="filter-grid">
        <label className="stack">
          <span>Min shares</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                minShares: event.target.value ? Number(event.target.value) : null,
                page: 1
              }))
            }
            type="number"
            value={filters.minShares ?? ""}
          />
        </label>
        <label className="stack">
          <span>Max shares</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                maxShares: event.target.value ? Number(event.target.value) : null,
                page: 1
              }))
            }
            type="number"
            value={filters.maxShares ?? ""}
          />
        </label>
        <label className="stack">
          <span>Min price</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                minPrice: event.target.value ? Number(event.target.value) : null,
                page: 1
              }))
            }
            step="0.01"
            type="number"
            value={filters.minPrice ?? ""}
          />
        </label>
        <label className="stack">
          <span>Max price</span>
          <input
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                maxPrice: event.target.value ? Number(event.target.value) : null,
                page: 1
              }))
            }
            step="0.01"
            type="number"
            value={filters.maxPrice ?? ""}
          />
        </label>
      </div>

      <div className="filter-grid">
        <label className="stack">
          <span>Sort by</span>
          <select
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sortBy: event.target.value as ExplorerFilters["sortBy"],
                page: 1
              }))
            }
            value={filters.sortBy}
          >
            <option value="transactionDate">Transaction date</option>
            <option value="filingDate">Filing date</option>
            <option value="shares">Shares</option>
            <option value="price">Price</option>
          </select>
        </label>
        <label className="stack">
          <span>Order</span>
          <select
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sortOrder: event.target.value as ExplorerFilters["sortOrder"],
                page: 1
              }))
            }
            value={filters.sortOrder}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      <div className="header-actions">
        <button className="button" onClick={submit} type="button">
          Apply filters
        </button>
        <button className="button-secondary" onClick={reset} type="button">
          Reset
        </button>
      </div>
    </div>
  );
}

function splitInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
