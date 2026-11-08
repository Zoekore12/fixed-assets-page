"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  DollarSign,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
  ClipboardList,
  Globe,
  CalendarDays,
  Package,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

const STATUS_STYLES = {
  PENDING:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  COMPLETED:
    "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  REVIEW_REQUIRED:
    "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  FAILED:
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatCurrency(value, currency = "NGN") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status) {
  return (
    STATUS_STYLES[status] ||
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  );
}

function getAssetLabel(valuation) {
  const asset = valuation?.asset;

  return (
    valuation?.asset_tag ||
    valuation?.tag ||
    asset?.asset_tag ||
    asset?.tag ||
    valuation?.asset_name ||
    asset?.name ||
    valuation?.asset_id ||
    "Unknown asset"
  );
}

function getPurchaseCost(valuation) {
  return (
    valuation?.original_purchase_cost ??
    valuation?.purchase_cost ??
    valuation?.asset?.purchase_cost ??
    null
  );
}

function getMarketValue(valuation) {
  return (
    valuation?.current_market_value ??
    valuation?.market_value ??
    valuation?.estimated_market_value ??
    valuation?.current_value ??
    null
  );
}

function getValuationChange(valuation) {
  const valueChange =
    valuation?.value_change ??
    valuation?.valueChange ??
    valuation?.market_value_change ??
    valuation?.current_market_value_change;

  const percentageChange =
    valuation?.percentage_change ??
    valuation?.percentageChange ??
    valuation?.market_percentage_change;

  if (
    valueChange !== undefined &&
    valueChange !== null &&
    Number.isFinite(Number(valueChange))
  ) {
    const amount = Number(valueChange);

    return {
      amount,
      percentage:
        percentageChange !== undefined &&
        percentageChange !== null &&
        Number.isFinite(Number(percentageChange))
          ? Number(percentageChange)
          : null,
      type:
        amount > 0
          ? "APPRECIATED"
          : amount < 0
            ? "DEPRECIATED"
            : "UNCHANGED",
    };
  }

  const purchaseCost = Number(getPurchaseCost(valuation));
  const marketValue = Number(getMarketValue(valuation));

  if (
    getPurchaseCost(valuation) === null ||
    getPurchaseCost(valuation) === undefined ||
    getMarketValue(valuation) === null ||
    getMarketValue(valuation) === undefined ||
    !Number.isFinite(purchaseCost) ||
    !Number.isFinite(marketValue)
  ) {
    return null;
  }

  const amount = marketValue - purchaseCost;

  return {
    amount,
    percentage:
      purchaseCost !== 0 ? (amount / purchaseCost) * 100 : null,
    type:
      amount > 0
        ? "APPRECIATED"
        : amount < 0
          ? "DEPRECIATED"
          : "UNCHANGED",
  };
}

export default function MyValuationsPage() {
  const [valuations, setValuations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedValuation, setSelectedValuation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load valuations belonging to the authenticated user.
  const loadValuations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/valuation/my-valuations");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load your valuations."
        );
      }

      setValuations(
        Array.isArray(result?.valuations)
          ? result.valuations
          : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load your valuations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
  const timer = setTimeout(() => {
    loadValuations();
  }, 0);

  return () => clearTimeout(timer);
}, [loadValuations]);

  // Search and status filtering.
  const filteredValuations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return valuations.filter((valuation) => {
      const matchesSearch =
        !query ||
        [
          getAssetLabel(valuation),
          valuation.id,
          valuation.asset_id,
          valuation.valuation_status,
          valuation.currency,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      const matchesStatus =
        statusFilter === "ALL" ||
        valuation.valuation_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [valuations, search, statusFilter]);

  // Summary statistics.
  const pendingCount = valuations.filter(
    (item) => item.valuation_status === "PENDING"
  ).length;

  const completedCount = valuations.filter(
    (item) => item.valuation_status === "COMPLETED"
  ).length;

  const reviewRequiredCount = valuations.filter(
    (item) => item.valuation_status === "REVIEW_REQUIRED"
  ).length;

  const failedCount = valuations.filter(
    (item) => item.valuation_status === "FAILED"
  ).length;

  function openValuationDetails(valuation) {
    setSelectedValuation(valuation);
    setShowDetails(true);
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/30 dark:text-white/950">
              <DollarSign size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Valuations
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View valuation records and market-price information
                for assets within your authorized access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadValuations(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />

            <div className="flex-1">{error}</div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Valuations"
            count={valuations.length}
            loading={loading}
            description="Valuation records accessible to you"
            icon={ClipboardList}
            iconStyle="bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/30 dark:text-white/950"
          />

          <SummaryCard
            title="Pending"
            count={pendingCount}
            loading={loading}
            description="Awaiting calculation or review"
            icon={LoaderCircle}
            iconStyle="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
          />

          <SummaryCard
            title="Completed"
            count={completedCount}
            loading={loading}
            description="Completed valuations"
            icon={ClipboardCheck}
            iconStyle="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
          />

          <SummaryCard
            title="Requires Review"
            count={reviewRequiredCount}
            loading={loading}
            description={`${failedCount} failed valuation(s)`}
            icon={AlertTriangle}
            iconStyle="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300"
          />
        </div>

        {/* Valuation directory */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Valuation Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View the purchase costs, current market values and
                valuation status of your accessible assets.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-2">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search asset tag, asset ID, status..."
                  aria-label="Search valuations"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                aria-label="Filter valuations by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="REVIEW_REQUIRED">
                  Requires review
                </option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading your valuations...
            </div>
          ) : filteredValuations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <DollarSign size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No valuations found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                There are currently no valuation records available
                within your authorized access, or your search and
                filters returned no results.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Asset
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Purchase Cost
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Market Value
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Value Change
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Valuation Status
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Created
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredValuations.map((valuation) => {
                      const purchaseCost =
                        getPurchaseCost(valuation);

                      const marketValue =
                        getMarketValue(valuation);

                      const currency =
                        valuation.currency || "NGN";

                      const valuationChange =
                        getValuationChange(valuation);

                      return (
                        <tr
                          key={valuation.id}
                          className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/30 dark:text-white/950">
                                <Package size={19} />
                              </div>

                              <div>
                                <p className="font-semibold">
                                  {getAssetLabel(valuation)}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Valuation ID: {valuation.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {formatCurrency(
                              purchaseCost,
                              currency
                            )}
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {formatCurrency(
                              marketValue,
                              currency
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {!valuationChange ? (
                              <span className="text-sm text-slate-400">
                                Not calculated
                              </span>
                            ) : (
                              <div className="flex items-start gap-2">
                                <div
                                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                    valuationChange.type ===
                                    "APPRECIATED"
                                      ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                                      : valuationChange.type ===
                                          "DEPRECIATED"
                                        ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  }`}
                                >
                                  {valuationChange.type ===
                                  "APPRECIATED" ? (
                                    <TrendingUp size={17} />
                                  ) : valuationChange.type ===
                                    "DEPRECIATED" ? (
                                    <TrendingDown size={17} />
                                  ) : (
                                    <DollarSign size={17} />
                                  )}
                                </div>

                                <div>
                                  <p
                                    className={`font-semibold ${
                                      valuationChange.type ===
                                      "APPRECIATED"
                                        ? "text-green-600 dark:text-green-300"
                                        : valuationChange.type ===
                                            "DEPRECIATED"
                                          ? "text-red-600 dark:text-red-300"
                                          : "text-slate-600 dark:text-slate-300"
                                    }`}
                                  >
                                    {valuationChange.type ===
                                    "APPRECIATED"
                                      ? "Increased"
                                      : valuationChange.type ===
                                          "DEPRECIATED"
                                        ? "Decreased"
                                        : "Unchanged"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {valuationChange.amount > 0
                                      ? "+"
                                      : ""}
                                    {formatCurrency(
                                      valuationChange.amount,
                                      currency
                                    )}
                                  </p>

                                  {valuationChange.percentage !==
                                    null && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {valuationChange.percentage > 0
                                        ? "+"
                                        : ""}
                                      {valuationChange.percentage.toFixed(
                                        2
                                      )}
                                      %
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                valuation.valuation_status
                              )}`}
                            >
                              {(
                                valuation.valuation_status ||
                                "UNKNOWN"
                              ).replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {formatDate(
                              valuation.created_at ||
                                valuation.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end">
                              <ActionButton
                                title="View valuation details"
                                onClick={() =>
                                  openValuationDetails(valuation)
                                }
                              >
                                <Eye size={16} />
                              </ActionButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredValuations.length} of{" "}
                {valuations.length} valuations
              </div>
            </>
          )}
        </div>

        {/* Valuation details modal */}
        {showDetails && selectedValuation && (
          <Modal
            title="Valuation Details"
            description={`Valuation record for ${getAssetLabel(
              selectedValuation
            )}.`}
            onClose={() => setShowDetails(false)}
            maxWidth="max-w-3xl"
          >
            <div className="space-y-5 p-5">

              {/* Valuation information */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList size={17} className="text-blue-600" />
                  Valuation Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Asset"
                    value={getAssetLabel(selectedValuation)}
                  />

                  <DetailItem
                    label="Valuation ID"
                    value={selectedValuation.id}
                  />

                  <DetailItem
                    label="Asset ID"
                    value={selectedValuation.asset_id || "—"}
                  />

                  <DetailItem
                    label="Status"
                    value={(
                      selectedValuation.valuation_status ||
                      "UNKNOWN"
                    ).replaceAll("_", " ")}
                  />

                  <DetailItem
                    label="Original Purchase Cost"
                    value={formatCurrency(
                      getPurchaseCost(selectedValuation),
                      selectedValuation.currency || "NGN"
                    )}
                  />

                  <DetailItem
                    label="Current Market Value"
                    value={formatCurrency(
                      getMarketValue(selectedValuation),
                      selectedValuation.currency || "NGN"
                    )}
                  />

                  <DetailItem
                    label="Value Change"
                    value={(() => {
                      const change =
                        getValuationChange(selectedValuation);

                      if (!change) return "Not calculated";

                      const direction =
                        change.type === "APPRECIATED"
                          ? "Increased"
                          : change.type === "DEPRECIATED"
                            ? "Decreased"
                            : "Unchanged";

                      const percentage =
                        change.percentage !== null
                          ? ` (${change.percentage > 0 ? "+" : ""}${change.percentage.toFixed(2)}%)`
                          : "";

                      return `${direction}: ${
                        change.amount > 0 ? "+" : ""
                      }${formatCurrency(
                        change.amount,
                        selectedValuation.currency || "NGN"
                      )}${percentage}`;
                    })()}
                  />

                  <DetailItem
                    label="Created"
                    value={formatDate(
                      selectedValuation.created_at ||
                        selectedValuation.createdAt
                    )}
                  />

                  <DetailItem
                    label="Last Updated"
                    value={formatDate(
                      selectedValuation.updated_at ||
                        selectedValuation.updatedAt
                    )}
                  />
                </div>
              </div>

              {/* Market-price observations */}
              <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Globe size={17} className="text-blue-600" />
                  Market-Price Observations
                </h3>

                {!Array.isArray(
                  selectedValuation.observations
                ) ||
                selectedValuation.observations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                    <Globe
                      size={25}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-medium">
                      No market-price observations
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      No market listings are currently available for
                      this valuation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedValuation.observations.map(
                      (observation) => (
                        <div
                          key={observation.id}
                          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <p className="font-semibold">
                                {observation.product_title ||
                                  "Untitled listing"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {observation.source_name || "Unknown source"}
                              </p>

                              <p className="mt-2 text-xs text-slate-500">
                                {observation.brand || "—"}{" "}
                                {observation.model || ""}
                              </p>
                            </div>

                            <div className="sm:text-right">
                              <p className="font-bold text-blue-600 dark:text-blue-300">
                                {formatCurrency(
                                  observation.listed_price,
                                  observation.currency || "NGN"
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatDate(observation.observed_at)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {(
                                observation.availability_status ||
                                "UNKNOWN"
                              ).replaceAll("_", " ")}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                observation.is_comparable
                                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {observation.is_comparable
                                ? "Comparable"
                                : "Not comparable"}
                            </span>

                            {observation.product_url && (
                              <a
                                href={observation.product_url}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                              >
                                View listing
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </section>
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  count,
  loading,
  description,
  icon: Icon,
  iconStyle,
}) {
  return (
    <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight">
            {loading ? "—" : count}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5]/30 hover:bg-[#1597E5]/100 hover:text-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5]/30 dark:hover:bg-[#1597E5]/30 dark:hover:text-white/950"
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-lg",
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`my-auto max-h-[95vh] w-full ${maxWidth} overflow-y-auto scrollbar-hide rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold">
        {value ?? "—"}
      </p>
    </div>
  );
}