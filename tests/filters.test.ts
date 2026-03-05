import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_FILTERS } from "../lib/constants";
import { filtersToSearchParams, parseExplorerFilters, searchParamsToRecord } from "../lib/utils/filters";

test("parseExplorerFilters keeps repeated array params", () => {
  const params = new URLSearchParams();
  params.append("transactionCodes", "P");
  params.append("transactionCodes", "S");
  params.append("roles", "officer");
  params.append("roles", "director");

  const parsed = parseExplorerFilters(searchParamsToRecord(params));

  assert.deepEqual(parsed.transactionCodes, ["P", "S"]);
  assert.deepEqual(parsed.roles, ["officer", "director"]);
});

test("filtersToSearchParams omits defaults and round-trips custom values", () => {
  const filters = {
    ...DEFAULT_FILTERS,
    q: "tesla",
    ownershipTypes: ["D"],
    minShares: 1000,
    page: 3
  };

  const serialized = filtersToSearchParams(filters);
  const reparsed = parseExplorerFilters(searchParamsToRecord(new URLSearchParams(serialized)));

  assert.equal(reparsed.q, "tesla");
  assert.deepEqual(reparsed.ownershipTypes, ["D"]);
  assert.equal(reparsed.minShares, 1000);
  assert.equal(reparsed.page, 3);
});

test("invalid values fall back to defaults", () => {
  const parsed = parseExplorerFilters({
    page: "-2",
    pageSize: "999",
    sortBy: "bad-field",
    sortOrder: "down"
  });

  assert.equal(parsed.page, DEFAULT_FILTERS.page);
  assert.equal(parsed.pageSize, DEFAULT_FILTERS.pageSize);
  assert.equal(parsed.sortBy, DEFAULT_FILTERS.sortBy);
  assert.equal(parsed.sortOrder, DEFAULT_FILTERS.sortOrder);
});
