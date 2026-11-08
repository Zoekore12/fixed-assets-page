"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

const STATUS_STYLES = {
  PENDING:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  APPROVED:
    "bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white",
  IN_TRANSIT:
    "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  COMPLETED:
    "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED:
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  ARRIVED:
    "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

function getResult(response) {
  return response?.data ?? response;
}

function getStatus(movement) {
  return String(
    movement?.movement_status || movement?.status || "UNKNOWN"
  ).toUpperCase();
}

function getAssetTag(movement) {
  return (
    movement?.asset_tag ||
    movement?.asset?.asset_tag ||
    movement?.assetTag ||
    "—"
  );
}

function getAssetName(movement) {
  return (
    movement?.asset_name ||
    movement?.asset?.name ||
    "—"
  );
}

function getRequester(movement) {
  return (
    movement?.requested_by_name ||
    movement?.requester_name ||
    movement?.requester?.name ||
    "—"
  );
}

function getMover(movement) {
  return (
    movement?.moved_by_name ||
    movement?.mover_name ||
    movement?.mover?.name ||
    "—"
  );
}

function getDestination(movement) {
  const parts = [
    movement?.to_building_name,
    movement?.to_department_name,
    movement?.to_unit_name,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "Destination not specified";
}

function getOrigin(movement) {
  const parts = [
    movement?.from_building_name,
    movement?.from_department_name,
    movement?.from_unit_name,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "Origin not specified";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toUpperCase();

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[normalized] ||
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold">
        {value == null || value === "" ? "—" : String(value)}
      </p>
    </div>
  );
}

export default function TransfersTrackingPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedMovement, setSelectedMovement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadMovements = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/transfers/transfers");
      const result = getResult(response);

      if (result?.success === false) {
        throw new Error(
          result.message || "Failed to load movement records."
        );
      }

      setMovements(
        Array.isArray(result?.movements)
          ? result.movements
          : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load movement records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchMovements = async () => {
      try {
        const response = await api.get("/transfers/transfers");
        const result = getResult(response);

        if (result?.success === false) {
          throw new Error(
            result.message || "Failed to load movement records."
          );
        }

        if (!ignore) {
          setMovements(
            Array.isArray(result?.movements)
              ? result.movements
              : []
          );
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load movement records."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchMovements();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const status = getStatus(movement);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const searchableValues = [
        getAssetTag(movement),
        getAssetName(movement),
        getOrigin(movement),
        getDestination(movement),
        getRequester(movement),
        getMover(movement),
        movement?.reason,
        movement?.notes,
        movement?.id,
        status,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return matchesStatus && matchesSearch;
    });
  }, [movements, search, statusFilter]);

  const pendingCount = movements.filter(
    (item) => getStatus(item) === "PENDING"
  ).length;

  const inTransitCount = movements.filter(
    (item) => getStatus(item) === "IN_TRANSIT"
  ).length;

  const completedCount = movements.filter(
    (item) => getStatus(item) === "COMPLETED"
  ).length;

  const openMovementDetails = async (movement) => {
    setSelectedMovement(movement);
    setShowDetails(true);
    setDetailsLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/transfers/transfers/${movement.id}`
      );

      const result = getResult(response);

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load movement details."
        );
      }

      const detail =
        result?.movement ||
        result?.transfer ||
        result?.data?.movement ||
        result?.data?.transfer;

      if (detail) setSelectedMovement(detail);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load full movement details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedMovement(null);
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
              <ArrowLeftRight size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Transfer Tracking
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitor asset movements within your authorized scope.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadMovements(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
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
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Total Movements</p>
                <p className="mt-3 text-3xl font-bold">
                  {loading ? "—" : movements.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Records available to you
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <ClipboardList size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-3 text-3xl font-bold">
                  {loading ? "—" : pendingCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Awaiting approval
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <AlertTriangle size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">In Transit</p>
                <p className="mt-3 text-3xl font-bold">
                  {loading ? "—" : inTransitCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Movements underway
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Truck size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-3 text-3xl font-bold">
                  {loading ? "—" : completedCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Completed movements
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Movement directory */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Movement Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and review movements you are authorized to access.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search asset, destination, requester..."
                  aria-label="Search movements"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter movements by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="IN_TRANSIT">In transit</option>
                <option value="ARRIVED">Arrived</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading movement records...
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <ArrowLeftRight size={27} />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                No movements found
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Try changing your search or status filter. New records will
                appear here when they fall within your authorized scope.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Asset</th>
                      <th className="px-5 py-4 font-semibold">Origin</th>
                      <th className="px-5 py-4 font-semibold">Destination</th>
                      <th className="px-5 py-4 font-semibold">Requester</th>
                      <th className="px-5 py-4 font-semibold">Mover</th>
                      <th className="px-5 py-4 font-semibold">Date</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMovements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                              <Package size={19} />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {getAssetTag(movement)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {getAssetName(movement)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin size={15} className="mt-0.5 shrink-0 text-[#1597E5]" />
                            <span>{getOrigin(movement)}</span>
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin size={15} className="mt-0.5 shrink-0 text-[#1597E5]" />
                            <span>{getDestination(movement)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">{getRequester(movement)}</td>
                        <td className="px-5 py-4">{getMover(movement)}</td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(
                            movement.created_at || movement.requested_at
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={getStatus(movement)} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openMovementDetails(movement)}
                            title="View movement details"
                            aria-label="View movement details"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredMovements.length} of {movements.length} movement records
              </div>
            </>
          )}
        </div>

        {/* Movement details modal */}
        {showDetails && selectedMovement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDetails();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="movement-details-title"
              className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="movement-details-title" className="text-lg font-bold">
                    Movement Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {getAssetTag(selectedMovement)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close movement details"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-5 p-5">
                {detailsLoading && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <LoaderCircle size={17} className="animate-spin" />
                    Loading full movement details...
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Current status</p>
                    <div className="mt-2">
                      <StatusBadge status={getStatus(selectedMovement)} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatDate(selectedMovement.created_at)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem label="Asset Tag" value={getAssetTag(selectedMovement)} />
                  <DetailItem label="Asset Name" value={getAssetName(selectedMovement)} />
                  <DetailItem label="Asset Status" value={selectedMovement.asset_status} />
                  <DetailItem label="Movement Type" value={selectedMovement.movement_type} />
                  <DetailItem label="Origin" value={getOrigin(selectedMovement)} />
                  <DetailItem label="Destination" value={getDestination(selectedMovement)} />
                  <DetailItem label="Requester" value={getRequester(selectedMovement)} />
                  <DetailItem label="Mover" value={getMover(selectedMovement)} />
                  <DetailItem label="Authorized By" value={selectedMovement.authorized_by_name} />
                  <DetailItem label="Received By" value={selectedMovement.received_by_name} />
                  <DetailItem label="Reason" value={selectedMovement.reason} />
                  <DetailItem label="Notes" value={selectedMovement.notes} />
                  <DetailItem label="Movement ID" value={selectedMovement.id} />
                  <DetailItem
                    label="Last Updated"
                    value={formatDate(selectedMovement.updated_at)}
                  />
                </div>

                <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
