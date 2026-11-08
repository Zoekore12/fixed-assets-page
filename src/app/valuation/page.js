"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  DollarSign,
  Eye,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  X,
  Calculator,
  Globe,
  ClipboardList,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

const EMPTY_COLLECT_FORM = {
  searchTerm: "",
};

const EMPTY_OBSERVATION_FORM = {
  sourceName: "",
  productTitle: "",
  productUrl: "",
  listedPrice: "",
  currency: "NGN",
  brand: "",
  model: "",
  availabilityStatus: "AVAILABLE",
};

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
      type: amount > 0 ? "APPRECIATED" : amount < 0 ? "DEPRECIATED" : "UNCHANGED",
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

export default function ValuationsPage() {
  const [valuations, setValuations] = useState([]);
  const [observations, setObservations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [recalculatingId, setRecalculatingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [observationFilter, setObservationFilter] = useState("PENDING");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assetId, setAssetId] = useState("");

  const [selectedValuation, setSelectedValuation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [showCollectForm, setShowCollectForm] = useState(false);
  const [collectForm, setCollectForm] = useState(EMPTY_COLLECT_FORM);

  const [showObservationForm, setShowObservationForm] = useState(false);
  const [observationForm, setObservationForm] = useState(
    EMPTY_OBSERVATION_FORM
  );

  const [thresholdPercent, setThresholdPercent] = useState("30");

  const loadValuations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/valuation");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(result.message || "Unable to load valuations.");
      }

      setValuations(
        Array.isArray(result?.valuations) ? result.valuations : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load valuations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadObservations = useCallback(async () => {
    try {
      const response = await api.get("/observation", {
        params: {
          status: observationFilter,
          limit: 100,
          offset: 0,
        },
      });

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load market-price observations."
        );
      }

      setObservations(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load market-price observations."
      );
    }
  }, [observationFilter]);

  useEffect(() => {
    let cancelled = false;

    async function fetchValuations() {
      try {
        const response = await api.get("/valuation");
        const result = response?.data ?? response;

        if (result?.success === false) {
          throw new Error(
            result.message || "Unable to load valuations."
          );
        }

        if (!cancelled) {
          setValuations(
            Array.isArray(result?.valuations)
              ? result.valuations
              : []
          );
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load valuations."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchValuations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchObservations() {
      try {
        const response = await api.get("/observation", {
          params: {
            status: observationFilter,
            limit: 100,
            offset: 0,
          },
        });

        const result = response?.data ?? response;

        if (result?.success === false) {
          throw new Error(
            result.message || "Unable to load observations."
          );
        }

        if (!cancelled) {
          setObservations(
            Array.isArray(result?.data) ? result.data : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load market-price observations."
          );
        }
      }
    }

    fetchObservations();

    return () => {
      cancelled = true;
    };
  }, [observationFilter]);

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

  function openCreateForm() {
    setAssetId("");
    setError("");
    setNotice("");
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (saving) return;

    setShowCreateForm(false);
    setAssetId("");
  }

  async function handleCreateValuation(event) {
    event.preventDefault();

    const cleanAssetId = assetId.trim();

    if (!cleanAssetId) {
      setError("Enter the asset ID to create a valuation.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post("/valuation", {
        assetId: cleanAssetId,
      });

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to create valuation."
        );
      }

      setNotice("Valuation created successfully.");
      setShowCreateForm(false);
      setAssetId("");

      await loadValuations(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create valuation."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openValuationDetails(valuation) {
    setSelectedValuation(valuation);
    setShowDetails(true);
    setError("");
    setNotice("");

    try {
      const response = await api.get(`/valuation/${valuation.id}`);
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load valuation details."
        );
      }

      if (result?.valuation) {
        setSelectedValuation(result.valuation);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load valuation details."
      );
    }
  }

  function openCollectForm(valuation) {
    setSelectedValuation(valuation);
    setCollectForm(EMPTY_COLLECT_FORM);
    setError("");
    setNotice("");
    setShowCollectForm(true);
  }

  async function handleCollectPrices(event) {
    event.preventDefault();

    if (!selectedValuation?.id) {
      setError("Select a valuation before collecting market prices.");
      return;
    }

    if (!collectForm.searchTerm.trim()) {
      setError("Enter a product name or model to search.");
      return;
    }

    setCollecting(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post("/price-collector/collect", {
        valuationId: selectedValuation.id,
        searchTerm: collectForm.searchTerm.trim(),
      });

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "No market-price observations were saved."
        );
      }

      const savedCount = result?.data?.savedCount ?? 0;

      setNotice(
        `Market-price collection completed. ${savedCount} observation(s) saved.`
      );

      setShowCollectForm(false);
      setCollectForm(EMPTY_COLLECT_FORM);

      await loadObservations();
      await loadValuations(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to collect market prices."
      );
    } finally {
      setCollecting(false);
    }
  }

  function openObservationForm(valuation) {
    setSelectedValuation(valuation);
    setObservationForm(EMPTY_OBSERVATION_FORM);
    setError("");
    setNotice("");
    setShowObservationForm(true);
  }

  async function handleAddObservation(event) {
    event.preventDefault();

    if (!selectedValuation?.id) {
      setError("Select a valuation first.");
      return;
    }

    const price = Number(observationForm.listedPrice);

    if (!observationForm.productTitle.trim()) {
      setError("Product title is required.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid market listing price greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        sourceName: observationForm.sourceName.trim() || undefined,
        productTitle: observationForm.productTitle.trim(),
        productUrl: observationForm.productUrl.trim() || undefined,
        listedPrice: price,
        currency: observationForm.currency,
        brand: observationForm.brand.trim() || undefined,
        model: observationForm.model.trim() || undefined,
        availabilityStatus: observationForm.availabilityStatus,
      };

      const response = await api.post(
        `/valuation/${selectedValuation.id}/observations`,
        payload
      );

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to add market-price observation."
        );
      }

      setNotice("Market-price observation recorded successfully.");
      setShowObservationForm(false);
      setObservationForm(EMPTY_OBSERVATION_FORM);

      await loadObservations();
      await loadValuations(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to add market-price observation."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRecalculate(valuation) {
    const confirmed = window.confirm(
      `Recalculate the market value for ${getAssetLabel(valuation)}?`
    );

    if (!confirmed) return;

    setRecalculatingId(valuation.id);
    setError("");
    setNotice("");

    try {
      const response = await api.post(
        `/valuation/${valuation.id}/recalculate`,
        {
          thresholdPercent: Number(thresholdPercent || 30),
        }
      );

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to recalculate valuation."
        );
      }

      setNotice(
        result?.message || "Valuation calculation completed successfully."
      );

      await loadValuations(true);

      if (showDetails) {
        const detailResponse = await api.get(
          `/valuation/${valuation.id}`
        );
        const detailResult =
          detailResponse?.data ?? detailResponse;

        if (detailResult?.valuation) {
          setSelectedValuation(detailResult.valuation);
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to recalculate valuation."
      );
    } finally {
      setRecalculatingId(null);
    }
  }

  async function handleReviewObservation(observation, decision) {
    let reason;

    if (decision === "REJECT") {
      reason = window.prompt(
        "Enter a reason for rejecting this market listing:"
      );

      if (reason === null) return;

      if (!reason.trim()) {
        setError("A rejection reason is required.");
        return;
      }
    }

    const action = decision === "APPROVE" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} this market-price observation?`
      )
    ) {
      return;
    }

    setReviewingId(observation.id);
    setError("");
    setNotice("");

    try {
      const payload =
        decision === "REJECT"
          ? { decision, reason: reason.trim() }
          : { decision };

      const response = await api.patch(
        `/observation/${observation.id}/review`,
        payload
      );

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to review observation."
        );
      }

      setNotice(
        result?.message ||
          `Market-price observation ${action}d successfully.`
      );

      await loadObservations();
      await loadValuations(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to review market-price observation."
      );
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5]/50 text-white dark:bg-[#1597E5] dark:text-white">
              <DollarSign size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Asset Valuation
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage asset valuations, collect market prices, and review
                comparable listings.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadValuations(true);
                loadObservations();
              }}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
            >
              <Plus size={17} />
              Create Valuation
            </button>
          </div>
        </div>

        {/* Feedback messages */}
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

        {notice && !error && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
          >
            <Check size={18} className="shrink-0" />
            <span className="flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
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
            description="Recorded valuation records"
            icon={ClipboardList}
            iconStyle="bg-[#1597E5]/50 text-white dark:bg-[#1597E5] dark:text-white"
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
            description="Valuations completed"
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
              <h2 className="text-lg font-semibold">Valuation Records</h2>
              <p className="mt-1 text-sm text-slate-500">
                View valuation records and manage their market-price
                calculations.
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search asset tag, asset ID, status..."
                  aria-label="Search valuations"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter valuations by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="REVIEW_REQUIRED">Requires review</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading valuations...
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
                Create a valuation for an eligible asset or adjust your
                search and filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Asset</th>
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
                      <th className="px-5 py-4 font-semibold">Created</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredValuations.map((valuation) => {
                      const purchaseCost = getPurchaseCost(valuation);
                      const marketValue = getMarketValue(valuation);
                      const currency = valuation.currency || "NGN";
                      const valuationChange = getValuationChange(valuation);

                      return (
                        <tr
                          key={valuation.id}
                          className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5]/50 text-white dark:bg-[#1597E5] dark:text-white">
                                <DollarSign size={19} />
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
                            {formatCurrency(purchaseCost, currency)}
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {formatCurrency(marketValue, currency)}
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
                                        valuationChange.type === "APPRECIATED"
                                            ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                                            : valuationChange.type === "DEPRECIATED"
                                            ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
                                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                        }`}
                                    >
                                        {valuationChange.type === "APPRECIATED" ? (
                                        <TrendingUp size={17} />
                                        ) : valuationChange.type === "DEPRECIATED" ? (
                                        <TrendingDown size={17} />
                                        ) : (
                                        <DollarSign size={17} />
                                        )}
                                    </div>

                                    <div>
                                        <p
                                        className={`font-semibold ${
                                            valuationChange.type === "APPRECIATED"
                                            ? "text-green-600 dark:text-green-300"
                                            : valuationChange.type === "DEPRECIATED"
                                                ? "text-red-600 dark:text-red-300"
                                                : "text-slate-600 dark:text-slate-300"
                                        }`}
                                        >
                                        {valuationChange.type === "APPRECIATED"
                                            ? "Increased"
                                            : valuationChange.type === "DEPRECIATED"
                                            ? "Decreased"
                                            : "Unchanged"}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                        {valuationChange.amount > 0 ? "+" : ""}
                                        {formatCurrency(valuationChange.amount, currency)}
                                        </p>

                                        {valuationChange.percentage !== null && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            {valuationChange.percentage > 0 ? "+" : ""}
                                            {valuationChange.percentage.toFixed(2)}%
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
                              {(valuation.valuation_status || "UNKNOWN")
                                .replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {formatDate(
                              valuation.created_at ||
                                valuation.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <ActionButton
                                title="View valuation"
                                onClick={() =>
                                  openValuationDetails(valuation)
                                }
                              >
                                <Eye size={16} />
                              </ActionButton>

                              <ActionButton
                                title="Collect market prices"
                                onClick={() => openCollectForm(valuation)}
                                color="purple"
                              >
                                <Globe size={16} />
                              </ActionButton>

                              <ActionButton
                                title="Add market-price observation"
                                onClick={() =>
                                  openObservationForm(valuation)
                                }
                                color="green"
                              >
                                <Plus size={16} />
                              </ActionButton>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRecalculate(valuation)
                                }
                                disabled={
                                  recalculatingId === valuation.id
                                }
                                title="Recalculate valuation"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#1597E5] px-3 text-[#1597E5] transition hover:bg-[#1597E5]/10 disabled:opacity-50 dark:border-[#1597E5] dark:text-[#1597E5] dark:hover:bg-[#1597E5]/10"
                              >
                                {recalculatingId === valuation.id ? (
                                  <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Calculator size={15} />
                                )}
                                <span className="hidden xl:inline">
                                  Recalculate
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredValuations.length} of {valuations.length}{" "}
                valuations
              </div>
            </>
          )}
        </div>

        {/* Market-price observation review */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Market-Price Observations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review collected listings before using them in valuation
                calculations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={observationFilter}
                onChange={(event) =>
                  setObservationFilter(event.target.value)
                }
                aria-label="Filter observations by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="PENDING">Pending review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All observations</option>
              </select>

              <button
                type="button"
                onClick={loadObservations}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>
          </div>

          {observations.length === 0 ? (
            <div className="p-10 text-center">
              <Globe
                size={28}
                className="mx-auto text-slate-400"
              />
              <h3 className="mt-3 font-semibold">
                No observations found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Collect market prices from Apify or add an observation
                manually.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">Source</th>
                    <th className="px-5 py-4 font-semibold">Listed Price</th>
                    <th className="px-5 py-4 font-semibold">Availability</th>
                    <th className="px-5 py-4 font-semibold">Comparable</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Review
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {observations.map((observation) => (
                    <tr
                      key={observation.id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {observation.product_title || "Untitled listing"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {observation.brand || "—"}{" "}
                          {observation.model || ""}
                        </p>
                        {observation.product_url && (
                          <a
                            href={observation.product_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-xs text-blue-600 hover:underline dark:text-blue-300"
                          >
                            View listing
                          </a>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {observation.source_name || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatCurrency(
                          observation.listed_price,
                          observation.currency || "NGN"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {observation.availability_status || "UNKNOWN"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            observation.is_comparable
                              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {observation.is_comparable
                            ? "Yes"
                            : "No"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleReviewObservation(
                                observation,
                                "APPROVE"
                              )
                            }
                            disabled={reviewingId === observation.id}
                            title="Approve comparable listing"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 text-green-600 transition hover:bg-green-50 disabled:opacity-50 dark:border-green-900 dark:text-green-300 dark:hover:bg-green-950"
                          >
                            {reviewingId === observation.id ? (
                              <LoaderCircle
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Check size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleReviewObservation(
                                observation,
                                "REJECT"
                              )
                            }
                            disabled={reviewingId === observation.id}
                            title="Reject listing"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create valuation modal */}
        {showCreateForm && (
          <Modal
            title="Create Valuation"
            description="Enter the UUID of an eligible asset to create its valuation record."
            onClose={closeCreateForm}
            disabled={saving}
          >
            <form onSubmit={handleCreateValuation}>
              <div className="space-y-4 p-5">
                <label
                  htmlFor="valuation-asset-id"
                  className="block text-sm font-semibold"
                >
                  Asset ID (UUID) <span className="text-red-500">*</span>
                </label>

                <input
                  id="valuation-asset-id"
                  value={assetId}
                  onChange={(event) => setAssetId(event.target.value)}
                  placeholder="Enter asset UUID"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                />

                <p className="text-xs text-slate-500">
                  Your backend expects an asset ID. The valuation service
                  determines whether the asset is eligible.
                </p>
              </div>

              <ModalFooter
                onCancel={closeCreateForm}
                saving={saving}
                submitLabel="Create Valuation"
                icon={<Plus size={17} />}
              />
            </form>
          </Modal>
        )}

        {/* Collect market prices modal */}
        {showCollectForm && (
          <Modal
            title="Collect Market Prices"
            description={`Collect online listings for ${getAssetLabel(
              selectedValuation
            )}.`}
            onClose={() => {
              if (!collecting) setShowCollectForm(false);
            }}
            disabled={collecting}
          >
            <form onSubmit={handleCollectPrices}>
              <div className="space-y-4 p-5">
                <label
                  htmlFor="valuation-search-term"
                  className="block text-sm font-semibold"
                >
                  Product Search Term{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  id="valuation-search-term"
                  value={collectForm.searchTerm}
                  onChange={(event) =>
                    setCollectForm({
                      searchTerm: event.target.value,
                    })
                  }
                  placeholder="e.g. Dell Latitude 5420 16GB RAM"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                />

                <p className="text-xs text-slate-500">
                  The search term is sent to your existing Apify collection
                  endpoint.
                </p>
              </div>

              <ModalFooter
                onCancel={() => setShowCollectForm(false)}
                saving={collecting}
                submitLabel="Collect Prices"
                savingLabel="Collecting..."
                icon={<Globe size={17} />}
              />
            </form>
          </Modal>
        )}

        {/* Add manual observation modal */}
        {showObservationForm && (
          <Modal
            title="Add Market-Price Observation"
            description={`Record a market listing for ${getAssetLabel(
              selectedValuation
            )}.`}
            onClose={() => {
              if (!saving) setShowObservationForm(false);
            }}
            disabled={saving}
            maxWidth="max-w-2xl"
          >
            <form onSubmit={handleAddObservation}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <FormField
                  label="Product Title"
                  required
                  className="sm:col-span-2"
                >
                  <input
                    value={observationForm.productTitle}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        productTitle: event.target.value,
                      }))
                    }
                    required
                    placeholder="e.g. Dell Latitude 5420 Laptop"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Source Name">
                  <input
                    value={observationForm.sourceName}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        sourceName: event.target.value,
                      }))
                    }
                    placeholder="e.g. Jumia Nigeria"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Product URL">
                  <input
                    type="url"
                    value={observationForm.productUrl}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        productUrl: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Listed Price" required>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={observationForm.listedPrice}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        listedPrice: event.target.value,
                      }))
                    }
                    required
                    placeholder="450000"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Currency" required>
                  <select
                    value={observationForm.currency}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="NGN">NGN — Nigerian Naira</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </FormField>

                <FormField label="Brand">
                  <input
                    value={observationForm.brand}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        brand: event.target.value,
                      }))
                    }
                    placeholder="e.g. Dell"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Model">
                  <input
                    value={observationForm.model}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        model: event.target.value,
                      }))
                    }
                    placeholder="e.g. Latitude 5420"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Availability Status">
                  <select
                    value={observationForm.availabilityStatus}
                    onChange={(event) =>
                      setObservationForm((current) => ({
                        ...current,
                        availabilityStatus: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </FormField>
              </div>

              <ModalFooter
                onCancel={() => setShowObservationForm(false)}
                saving={saving}
                submitLabel="Save Observation"
                icon={<Check size={17} />}
              />
            </form>
          </Modal>
        )}

        {/* Valuation details modal */}
        {showDetails && selectedValuation && (
          <Modal
            title="Valuation Details"
            description={`Record for ${getAssetLabel(selectedValuation)}.`}
            onClose={() => setShowDetails(false)}
            maxWidth="max-w-3xl"
            >
            <div className="space-y-5 p-5 scrollbar-hide ">
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
                    selectedValuation.valuation_status || "UNKNOWN"
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
                    value={
                        (() => {
                        const change = getValuationChange(selectedValuation);

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
                        })()
                    }
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

              <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                <label
                  htmlFor="valuation-threshold"
                  className="block text-sm font-semibold"
                >
                  Recalculation Threshold (%)
                </label>

                <input
                  id="valuation-threshold"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={thresholdPercent}
                  onChange={(event) =>
                    setThresholdPercent(event.target.value)
                  }
                  className={inputClass}
                />

                <p className="text-xs text-slate-500">
                  Defaults to 30%. Your backend validates this threshold
                  between 0 and 100.
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    openCollectForm(selectedValuation);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Globe size={16} />
                  Collect Prices
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    openObservationForm(selectedValuation);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1597E5] bg-[#1597E5]/10 px-4 py-2.5 text-sm font-semibold text-[#1597E5] transition hover:bg-[#1597E5]/20 dark:border-[#1597E5] dark:bg-[#1597E5]/20 dark:text-[#1597E5] dark:hover:bg-[#1597E5]/20"
                >
                  <Plus size={16} />
                  Add Observation
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleRecalculate(selectedValuation)
                  }
                  disabled={
                    recalculatingId === selectedValuation.id
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:opacity-60"
                >
                  {recalculatingId === selectedValuation.id ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Calculator size={16} />
                  )}
                  Recalculate
                </button>
              </div>
            </div>
          </Modal>
        )}
      </section>
    </DashboardLayout>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950";

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
          <p className="mt-2 text-xs text-slate-500">{description}</p>
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

function ActionButton({ children, title, onClick, color = "blue" }) {
  const styles = {
    blue: "border-slate-200 text-slate-600 hover:border-[#1597E5] hover:bg-[#1597E5]/10 hover:text-[#1597E5] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5] dark:hover:bg-[#1597E5]/20 dark:hover:text-[#1597E5]",
    purple:
      "border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-300 dark:hover:bg-purple-950",
    green:
      "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-300 dark:hover:bg-green-950",
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${styles[color]}`}
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
  disabled = false,
  maxWidth = "max-w-lg",
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) {
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
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalFooter({
  onCancel,
  saving,
  submitLabel,
  savingLabel = "Saving...",
  icon,
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : (
          icon
        )}
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  );
}

function FormField({ label, required = false, className = "", children }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold">{value ?? "—"}</p>
    </div>
  );
}