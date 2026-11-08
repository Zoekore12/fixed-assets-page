"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Check,
  X,
  FileText,
  MapPin,
  CalendarDays,
  UserRound,
  Package,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const TABS = [
  { label: "All Requests", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_STYLES = {
  PENDING:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getRequestData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatus = (request) => {
  const status = String(
    request?.authorization_status || request?.status || "PENDING"
  )
    .trim()
    .toUpperCase();

  if (status === "AUTHORIZED") return "APPROVED";

  return status;
};

const getAssetName = (request) =>
  request?.asset_name ||
  request?.asset?.name ||
  request?.asset?.asset_name ||
  request?.product_name ||
  "Asset";

const getAssetTag = (request) =>
  request?.asset_tag ||
  request?.asset?.asset_tag ||
  request?.asset?.tag ||
  "—";

const getRequesterName = (request) =>
  request?.taken_by_name ||
  request?.taker_name ||
  request?.taken_by ||
  request?.user_name ||
  request?.requester_name ||
  request?.taken_by_user?.full_name ||
  request?.taken_by_user?.name ||
  "—";

const getApproverName = (request) =>
  request?.authorized_by_name ||
  request?.approver_name ||
  request?.authorized_by_user?.full_name ||
  request?.authorized_by_user?.name ||
  "—";

function StatusBadge({ status }) {
  const normalized = getStatus({ status });

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[normalized] ||
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

function SummaryCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    blue: "bg-[#1597E5] text-white",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
    green:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
      <div className="mt-0.5 shrink-0 text-[#1597E5]">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function ExitRequestsPage() {
  const [requests, setRequests] = useState({
    pending: [],
    approved: [],
    rejected: [],
  });

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestToReject, setRequestToReject] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [pendingResult, approvedResult, rejectedResult] =
        await Promise.allSettled([
          api.get("/exit-approvals/exit-requests/pending"),
          api.get("/exit-approvals/exit-requests/approved"),
          api.get("/exit-approvals/exit-requests/rejected"),
        ]);

      const results = {
        pending: pendingResult,
        approved: approvedResult,
        rejected: rejectedResult,
      };

      const nextRequests = {
        pending: [],
        approved: [],
        rejected: [],
      };

      const failedTabs = [];

      Object.entries(results).forEach(([key, result]) => {
        if (result.status === "fulfilled") {
          nextRequests[key] = getRequestData(result.value);
        } else {
          failedTabs.push(key);
        }
      });

      setRequests(nextRequests);

      if (failedTabs.length === 3) {
        setError(
          "Unable to load exit requests. Please check your connection and try again."
        );
      } else if (failedTabs.length > 0) {
        setError(
          `Some request lists could not be loaded: ${failedTabs.join(", ")}.`
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRequests = async () => {
      try {
        const [pendingResult, approvedResult, rejectedResult] =
          await Promise.allSettled([
            api.get("/exit-approvals/exit-requests/pending"),
            api.get("/exit-approvals/exit-requests/approved"),
            api.get("/exit-approvals/exit-requests/rejected"),
          ]);

        if (cancelled) return;

        const results = {
          pending: pendingResult,
          approved: approvedResult,
          rejected: rejectedResult,
        };

        const nextRequests = {
          pending: [],
          approved: [],
          rejected: [],
        };

        const failedTabs = [];

        Object.entries(results).forEach(([key, result]) => {
          if (result.status === "fulfilled") {
            nextRequests[key] = getRequestData(result.value);
          } else {
            failedTabs.push(key);
          }
        });

        setRequests(nextRequests);

        if (failedTabs.length === 3) {
          setError(
            "Unable to load exit requests. Please check your connection and try again."
          );
        } else if (failedTabs.length > 0) {
          setError(
            `Some request lists could not be loaded: ${failedTabs.join(", ")}.`
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  const allRequests = useMemo(
    () => [
      ...requests.pending,
      ...requests.approved,
      ...requests.rejected,
    ],
    [requests]
  );

  const filteredRequests = useMemo(() => {
    let result = allRequests;

    if (activeTab !== "all") {
      result = result.filter(
        (request) => getStatus(request) === activeTab.toUpperCase()
      );
    }

    const query = searchTerm.trim().toLowerCase();

    if (query) {
      result = result.filter((request) => {
        const searchable = [
          getAssetName(request),
          getAssetTag(request),
          getRequesterName(request),
          request?.destination,
          request?.reason,
          request?.id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    return result;
  }, [allRequests, activeTab, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openDetails = async (request) => {
    setSelectedRequest(request);
    setShowDetails(true);
    setError("");
    setNotice("");

    if (!request?.id) return;

    try {
      const response = await api.get(
        `/exit-approvals/exit-requests/${request.id}`
      );

      const details = response?.data?.data;

      if (details) {
        setSelectedRequest(details);
      }
    } catch (err) {
      // Keep the row data visible if the detail request fails.
      setError(getErrorMessage(err));
    }
  };

  const handleApprove = async (request) => {
    if (!request?.id) {
      setError("This request does not have a valid ID.");
      return;
    }

    const confirmed = window.confirm(
      `Approve the checkout request for ${getAssetName(request)} (${getAssetTag(request)})?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await api.post(
        `/exit-approvals/exit-requests/${request.id}/approve`
      );

      setNotice("Checkout request approved successfully.");
      setShowDetails(false);
      setSelectedRequest(null);

      await fetchRequests(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (request) => {
    setRequestToReject(request);
    setRejectionReason("");
    setShowRejectModal(true);
    setError("");
    setNotice("");
  };

  const handleReject = async (event) => {
    event.preventDefault();

    if (!requestToReject?.id) {
      setError("This request does not have a valid ID.");
      return;
    }

    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting this request.");
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await api.post(
        `/exit-approvals/exit-requests/${requestToReject.id}/reject`,
        {
          rejection_reason: rejectionReason.trim(),
        }
      );

      setNotice("Checkout request rejected successfully.");
      setShowRejectModal(false);
      setShowDetails(false);
      setSelectedRequest(null);
      setRequestToReject(null);
      setRejectionReason("");

      await fetchRequests(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedRequest(null);
  };

  const pendingCount = requests.pending.length;
  const approvedCount = requests.approved.length;
  const rejectedCount = requests.rejected.length;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#1597E5] p-3 text-white">
              <FileText size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                Exit Requests
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review and manage asset checkout requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success alert */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              className="rounded p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Requests"
            value={allRequests.length}
            description="Requests returned by the API"
            icon={FileText}
            color="blue"
          />

          <SummaryCard
            title="Pending"
            value={pendingCount}
            description="Awaiting administrator review"
            icon={Clock}
            color="amber"
          />

          <SummaryCard
            title="Approved"
            value={approvedCount}
            description="Checkout requests approved"
            icon={CheckCircle2}
            color="green"
          />

          <SummaryCard
            title="Rejected"
            value={rejectedCount}
            description="Checkout requests rejected"
            icon={XCircle}
            color="red"
          />
        </div>

        {/* Main content */}
        <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Search and tabs */}
          <div className="border-b border-slate-200 p-4 dark:border-slate-700 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => {
                  const count =
                    tab.value === "all"
                      ? allRequests.length
                      : requests[tab.value].length;

                  const isActive = activeTab === tab.value;

                  return (
                    <button
                      type="button"
                      key={tab.value}
                      onClick={() => handleTabChange(tab.value)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#1597E5] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {tab.label}

                      <span
                        className={`rounded-md px-1.5 py-0.5 text-xs ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full xl:max-w-sm">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    handleSearchChange(event.target.value)
                  }
                  placeholder="Search asset, tag, requester..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-[#1597E5]/20"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/70">
                <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-4 font-semibold">Asset</th>
                  <th className="px-5 py-4 font-semibold">Requested By</th>
                  <th className="px-5 py-4 font-semibold">Destination</th>
                  <th className="px-5 py-4 font-semibold">Date Out</th>
                  <th className="px-5 py-4 font-semibold">
                    Expected Return
                  </th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
                        <Loader2
                          size={28}
                          className="animate-spin text-[#1597E5]"
                        />
                        <p className="text-sm">Loading exit requests...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-400 dark:bg-slate-800">
                          <FileText size={30} />
                        </div>

                        <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                          No exit requests found
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {searchTerm
                            ? "Try a different search term."
                            : "Requests will appear here when available."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((request, index) => {
                    const status = getStatus(request);
                    const isPending = status === "PENDING";

                    return (
                      <tr
                        key={
                          request.id ||
                          `${getAssetTag(request)}-${index}`
                        }
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[#1597E5] p-2.5 text-white">
                              <Package size={19} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {getAssetName(request)}
                              </p>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Tag: {getAssetTag(request)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <UserRound
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            {getRequesterName(request)}
                          </div>
                        </td>

                        <td className="max-w-[200px] px-5 py-4">
                          <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <MapPin
                              size={16}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />

                            <span className="break-words">
                              {request.destination || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {formatDate(request.date_out)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {formatDate(request.expected_return_date)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              title="View request"
                              onClick={() => openDetails(request)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-[#1597E5] hover:bg-[#1597E5] hover:text-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5] dark:hover:bg-[#1597E5] dark:hover:text-white"
                            >
                              <Eye size={16} />
                            </button>

                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  title="Approve request"
                                  onClick={() => handleApprove(request)}
                                  disabled={actionLoading}
                                  className="rounded-lg border border-emerald-200 p-2 text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                                >
                                  <Check size={16} />
                                </button>

                                <button
                                  type="button"
                                  title="Reject request"
                                  onClick={() => openRejectModal(request)}
                                  disabled={actionLoading}
                                  className="rounded-lg border border-red-200 p-2 text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/30"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredRequests.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {Math.min(
                    currentPage * pageSize,
                    filteredRequests.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {filteredRequests.length}
                </span>{" "}
                requests
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm text-slate-600 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Request details modal */}
        {showDetails && selectedRequest && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDetails();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="exit-request-title"
              className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6">
                <div>
                  <h2
                    id="exit-request-title"
                    className="text-xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    Exit Request Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Review the information submitted for this asset.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Close details"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1597E5]/30 bg-sky-50 p-4 dark:border-[#1597E5]/40 dark:bg-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {getAssetName(selectedRequest)}
                    </p>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Asset tag: {getAssetTag(selectedRequest)}
                    </p>
                  </div>

                  <StatusBadge status={getStatus(selectedRequest)} />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={UserRound}
                    label="Person taking asset"
                    value={getRequesterName(selectedRequest)}
                  />

                  <DetailItem
                    icon={MapPin}
                    label="Destination"
                    value={selectedRequest.destination}
                  />

                  <DetailItem
                    icon={CalendarDays}
                    label="Date out"
                    value={formatDateTime(selectedRequest.date_out)}
                  />

                  <DetailItem
                    icon={CalendarDays}
                    label="Expected return"
                    value={formatDate(selectedRequest.expected_return_date)}
                  />

                  <DetailItem
                    icon={UserRound}
                    label="Authorized by"
                    value={getApproverName(selectedRequest)}
                  />

                  <DetailItem
                    icon={CalendarDays}
                    label="Authorization date"
                    value={formatDateTime(selectedRequest.authorized_at)}
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Reason for checkout
                  </h3>

                  <div className="rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    {selectedRequest.reason || "No reason provided."}
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Additional notes
                    </h3>

                    <div className="rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      {selectedRequest.notes}
                    </div>
                  </div>
                )}

                {selectedRequest.rejection_reason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                      Rejection reason
                    </p>

                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {selectedRequest.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 dark:border-slate-700 sm:flex-row sm:justify-end sm:p-6">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>

                {getStatus(selectedRequest) === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => openRejectModal(selectedRequest)}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/30"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Approve Request
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection reason modal */}
        {showRejectModal && requestToReject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-request-title"
              className="my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="reject-request-title"
                    className="text-lg font-bold text-slate-900 dark:text-slate-100"
                  >
                    Reject Checkout Request
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Provide a reason for the rejection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={actionLoading}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Close rejection form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReject} className="space-y-5 p-5">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {getAssetName(requestToReject)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Tag: {getAssetTag(requestToReject)} · Requested by{" "}
                    {getRequesterName(requestToReject)}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="rejection_reason"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Rejection reason <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="rejection_reason"
                    name="rejection_reason"
                    required
                    rows={4}
                    maxLength={1000}
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    placeholder="Explain why this checkout request is being rejected..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-[#1597E5]/20"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {rejectionReason.length}/1000
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    disabled={actionLoading}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}