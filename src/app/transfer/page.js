"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Eye,
  LoaderCircle,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

const EMPTY_FORM = {
  asset_id: "",
  to_building_id: "",
  to_department_id: "",
  to_unit_id: "",
  reason: "",
  notes: "",
};

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

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getStatus(transfer) {
  return String(
    transfer?.movement_status ||
      transfer?.status ||
      "UNKNOWN"
  ).toUpperCase();
}

function getAssetTag(transfer) {
  return (
    transfer?.asset_tag ||
    transfer?.asset?.asset_tag ||
    transfer?.asset?.tag ||
    transfer?.assetTag ||
    "—"
  );
}

function getAssetName(transfer) {
  return (
    transfer?.asset_name ||
    transfer?.asset?.name ||
    transfer?.asset?.asset_name ||
    "—"
  );
}

function getDestination(transfer) {
  const parts = [
    transfer?.to_building_name ||
      transfer?.destination_building_name,
    transfer?.to_department_name ||
      transfer?.destination_department_name,
    transfer?.to_unit_name ||
      transfer?.destination_unit_name,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "Destination not specified";
}

function getRequester(transfer) {
  return (
    transfer?.requester_name ||
    transfer?.requested_by_name ||
    transfer?.requestedByName ||
    transfer?.requested_by ||
    transfer?.requester?.name ||
    "—"
  );
}

function getMover(transfer) {
  return (
    transfer?.mover_name ||
    transfer?.moved_by_name ||
    transfer?.mover?.name ||
    "—"
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
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

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [moverTransfer, setMoverTransfer] = useState(null);
  const [movedBy, setMovedBy] = useState("");

  
const loadTransfers = useCallback(async () => {
   console.count("loadTransfers called");
  setLoading(true);
  setError("");

  try {
    const apiResponse = await api.get("/transfers/transfers");

    console.log("1. FULL API RESPONSE:", apiResponse);
    console.log("2. RESPONSE DATA:", apiResponse.data);

    const result = apiResponse.data;

    const records = Array.isArray(result)
      ? result
      : result?.transfers ??
        result?.movements ??
        result?.data?.transfers ??
        result?.data?.movements ??
        result?.data ??
        [];

    console.log("3. RECORDS TO DISPLAY:", records);

    setTransfers(Array.isArray(records) ? records : []);
  } catch (error) {
    console.error("TRANSFER REQUEST FAILED:", error.response?.status);
    console.error(
      "ERROR DETAILS:",
      error.response?.data || error.message
    );

    setError(
      error.response?.data?.message ||
        error.message ||
        "Failed to load transfers."
    );
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  const timer = setTimeout(() => {
    loadTransfers();
  }, 500);

  return () => clearTimeout(timer);
}, [loadTransfers]);

  useEffect(() => {
    let ignore = false;

    async function loadSupportingData() {
      const results = await Promise.allSettled([
        api.get("/assets"),
        api.get("/buildings"),
        api.get("/departments"),
        api.get("/units"),
        api.get("/users"),
      ]);

      if (ignore) return;

      const [assetResult, buildingResult, departmentResult, unitResult, userResult] =
        results.map((result) =>
          result.status === "fulfilled"
            ? getResult(result.value)
            : null
        );

      const extractList = (result, key) => {
        if (Array.isArray(result?.[key])) return result[key];
        if (Array.isArray(result?.data)) return result.data;
        if (Array.isArray(result)) return result;
        return [];
      };

      setAssets(extractList(assetResult, "assets"));
      setBuildings(extractList(buildingResult, "buildings"));
      setDepartments(extractList(departmentResult, "departments"));
      setUnits(extractList(unitResult, "units"));
      setUsers(extractList(userResult, "users"));
    }

    loadSupportingData();

    return () => {
      ignore = true;
    };
  }, []);

  const availableUnits = useMemo(() => {
    if (!form.to_department_id) return units;

    return units.filter(
      (unit) =>
        String(unit.department_id) === String(form.to_department_id)
    );
  }, [units, form.to_department_id]);

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transfers.filter((transfer) => {
      const status = getStatus(transfer);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const searchableValues = [
        getAssetTag(transfer),
        getAssetName(transfer),
        getDestination(transfer),
        getRequester(transfer),
        getMover(transfer),
        transfer?.reason,
        transfer?.id,
        status,
      ];

      const matchesSearch =
        !query ||
        searchableValues
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      return matchesStatus && matchesSearch;
    });
  }, [transfers, search, statusFilter]);

  const pendingCount = transfers.filter(
    (item) => getStatus(item) === "PENDING"
  ).length;

  const inTransitCount = transfers.filter(
    (item) => getStatus(item) === "IN_TRANSIT"
  ).length;

  const completedCount = transfers.filter(
    (item) => getStatus(item) === "COMPLETED"
  ).length;

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "to_department_id" ? { to_unit_id: "" } : {}),
    }));
  }

  async function handleCreateTransfer(event) {
    event.preventDefault();

    if (!form.asset_id || !form.reason.trim()) {
      setError("Select an asset and provide a transfer reason.");
      return;
    }

    if (
      form.to_unit_id &&
      !form.to_department_id
    ) {
      setError("Select the destination department for the unit.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        asset_id: form.asset_id,
        to_building_id: form.to_building_id || null,
        to_department_id: form.to_department_id || null,
        to_unit_id: form.to_unit_id || null,
        reason: form.reason.trim(),
        notes: form.notes.trim() || null,
      };

      const response = await api.post("/transfers", payload);
      const result = getResult(response);

      if (result?.success === false) {
        throw new Error(result.message || "Unable to create transfer.");
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      setNotice("Transfer request created successfully.");

      await loadTransfers(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create transfer request."));
    } finally {
      setSaving(false);
    }
  }

  async function performAction(transfer, action, options = {}) {
    const id = transfer?.id;

    if (!id) {
      setError("The transfer record does not contain an ID.");
      return;
    }

    const messages = {
      approve: "approve this transfer",
      start: "start this transfer",
      confirm: "confirm possession of this asset",
      complete: "complete this transfer",
    };

    if (
      !window.confirm(
        `Are you sure you want to ${messages[action] || action}?`
      )
    ) {
      return;
    }

    const endpoints = {
      approve: `/transfers/transfers/${id}/approve`,
      start: `/transfers/transfers/${id}/in-transit`,
      confirm: `/transfers/transfers/${id}/confirm-possession`,
      complete: `/transfers/transfers/${id}/complete`,
    };

    const successMessages = {
      approve: "Transfer approved successfully.",
      start: "Transfer marked as in transit.",
      confirm: "Possession confirmed successfully.",
      complete: "Transfer completed successfully.",
    };

    setActionId(id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(endpoints[action]);
      const result = getResult(response);

      if (result?.success === false) {
        throw new Error(result.message || "Transfer action failed.");
      }

      setNotice(successMessages[action] || "Transfer updated successfully.");

      if (showDetails) {
        setSelectedTransfer(
          result?.movement ||
            result?.data?.movement ||
            selectedTransfer
        );
      }

      await loadTransfers(true);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          `Unable to ${messages[action] || "update the transfer"}.`
        )
      );
    } finally {
      setActionId(null);
    }
  }

  function openMoverForm(transfer) {
    setMoverTransfer(transfer);
    setMovedBy("");
    setError("");
    setNotice("");
  }

  async function handleAssignMover(event) {
    event.preventDefault();

    if (!moverTransfer?.id || !movedBy) {
      setError("Select a user to assign as the mover.");
      return;
    }

    setActionId(moverTransfer.id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/transfers/transfers/${moverTransfer.id}/assign-mover`,
        { moved_by: movedBy }
      );

      const result = getResult(response);

      if (result?.success === false) {
        throw new Error(result.message || "Unable to assign mover.");
      }

      setMoverTransfer(null);
      setMovedBy("");
      setNotice("Mover assigned successfully.");

      await loadTransfers(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to assign mover."));
    } finally {
      setActionId(null);
    }
  }

  async function openTransferDetails(transfer) {
    setSelectedTransfer(transfer);
    setShowDetails(true);
    setError("");

    try {
      const response = await api.get(`/transfers/${transfer.id}`);
      const result = getResult(response);

      if (result?.success && result?.transfer) {
        setSelectedTransfer(result.transfer);
      }
    } catch {
      // Keep the record already available in the table.
    }
  }

  function closeDetails() {
    setShowDetails(false);
    setSelectedTransfer(null);
  }

  function renderActions(transfer) {
    const status = getStatus(transfer);
    const busy = actionId === transfer.id;

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => openTransferDetails(transfer)}
          title="View transfer details"
          aria-label="View transfer details"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Eye size={16} />
        </button>

        {status === "PENDING" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => performAction(transfer, "approve")}
            title="Approve transfer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#1597E5] px-3 text-xs font-semibold text-white hover:bg-[#117FC2] disabled:opacity-50"
          >
            {busy ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Approve
          </button>
        )}

        {status === "APPROVED" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => openMoverForm(transfer)}
            title="Assign mover"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#1597E5] bg-[#1597E5] px-3 text-xs font-semibold text-white hover:bg-[#117FC2] disabled:opacity-50 dark:border-[#1597E5] dark:bg-[#1597E5] dark:text-white"
          >
            <UserCheck size={15} />
            Assign mover
          </button>
        )}

        {status === "APPROVED" && getMover(transfer) !== "—" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => performAction(transfer, "start")}
            title="Start transfer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Truck size={15} />
            Start
          </button>
        )}

        {status === "IN_TRANSIT" && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => performAction(transfer, "confirm")}
              title="Confirm mover possession"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300"
            >
              <ShieldCheck size={15} />
              Confirm
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => performAction(transfer, "complete")}
              title="Complete transfer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              Complete
            </button>
          </>
        )}
      </div>
    );
  }

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
                Transfer Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Request, approve, track, and complete ministry asset transfers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadTransfers(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]"
            >
              <Plus size={17} />
              New Transfer
            </button>
          </div>
        </div>

        {/* Feedback */}
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
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Total Transfers</p>
                <p className="mt-3 text-3xl font-bold">
                  {loading ? "—" : transfers.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  All transfer records
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
                  Transfers underway
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
                  Completed transfers
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Transfer directory */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">Transfer Directory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review asset movements and manage the transfer workflow.
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
                  aria-label="Search transfers"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter transfers by status"
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
              Loading transfers...
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <ArrowLeftRight size={27} />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                No transfers found
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Try adjusting your search or filters, or create a new transfer request.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Asset</th>
                      <th className="px-5 py-4 font-semibold">Destination</th>
                      <th className="px-5 py-4 font-semibold">Requester</th>
                      <th className="px-5 py-4 font-semibold">Mover</th>
                      <th className="px-5 py-4 font-semibold">Request Date</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransfers.map((transfer) => (
                      <tr
                        key={transfer.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                              <Package size={19} />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {getAssetTag(transfer)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {getAssetName(transfer)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0 text-[#1597E5]"
                            />
                            <span>{getDestination(transfer)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {getRequester(transfer)}
                        </td>

                        <td className="px-5 py-4">
                          {getMover(transfer)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(
                            transfer.created_at ||
                              transfer.requested_at
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={getStatus(transfer)} />
                        </td>

                        <td className="px-5 py-4">
                          {renderActions(transfer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredTransfers.length} of {transfers.length} transfers
              </div>
            </>
          )}
        </div>

        {/* Create transfer modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForm();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="transfer-form-title"
              className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="transfer-form-title" className="text-lg font-bold">
                    New Transfer Request
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select an asset and enter its intended destination.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleCreateTransfer}>
                <div className="space-y-5 p-5">
                  <div className="space-y-2">
                    <label htmlFor="transfer-asset" className="block text-sm font-semibold">
                      Asset <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="transfer-asset"
                      name="asset_id"
                      value={form.asset_id}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="">Select an asset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.asset_tag || asset.tag || asset.id}
                          {" — "}
                          {asset.name || asset.asset_name || "Unnamed asset"}
                        </option>
                      ))}
                    </select>

                    {assets.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No assets were loaded. Check your assets endpoint and permissions.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="transfer-building" className="block text-sm font-semibold">
                        Destination Building
                      </label>
                      <select
                        id="transfer-building"
                        name="to_building_id"
                        value={form.to_building_id}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">No building selected</option>
                        {buildings.map((building) => (
                          <option key={building.id} value={building.id}>
                            {building.name || building.building_name || building.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="transfer-department" className="block text-sm font-semibold">
                        Destination Department
                      </label>
                      <select
                        id="transfer-department"
                        name="to_department_id"
                        value={form.to_department_id}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">No department selected</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name || department.department_name || department.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label htmlFor="transfer-unit" className="block text-sm font-semibold">
                        Destination Unit
                      </label>
                      <select
                        id="transfer-unit"
                        name="to_unit_id"
                        value={form.to_unit_id}
                        onChange={handleFormChange}
                        disabled={!form.to_department_id}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">No unit selected</option>
                        {availableUnits.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name || unit.unit_name || unit.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="transfer-reason" className="block text-sm font-semibold">
                      Transfer Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="transfer-reason"
                      name="reason"
                      value={form.reason}
                      onChange={handleFormChange}
                      required
                      maxLength={1000}
                      rows={3}
                      placeholder="Explain why the asset needs to be transferred..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="transfer-notes" className="block text-sm font-semibold">
                      Additional Notes
                    </label>
                    <textarea
                      id="transfer-notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      rows={2}
                      maxLength={2000}
                      placeholder="Optional instructions or additional details..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1597E5]/80 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    {saving ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign mover modal */}
        {moverTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mover-form-title"
              className="my-auto max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="mover-form-title" className="text-lg font-bold">
                    Assign Transfer Mover
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Asset: {getAssetTag(moverTransfer)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (actionId !== moverTransfer.id) {
                      setMoverTransfer(null);
                    }
                  }}
                  aria-label="Close mover form"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleAssignMover}>
                <div className="space-y-2 p-5">
                  <label htmlFor="transfer-mover" className="block text-sm font-semibold">
                    Select Mover <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="transfer-mover"
                    value={movedBy}
                    onChange={(event) => setMovedBy(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="">Select a user</option>
                    {users
                      .filter((user) => user.is_active !== false)
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} — {user.role}
                        </option>
                      ))}
                  </select>

                  {users.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No users were loaded. Check your users endpoint and permissions.
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setMoverTransfer(null)}
                    disabled={actionId === moverTransfer.id}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={actionId === moverTransfer.id}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#117FC2] hover:text-white disabled:opacity-60 dark:text-slate-100"
                  >
                    {actionId === moverTransfer.id ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <UserCheck size={17} />
                    )}
                    Assign Mover
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer details modal */}
        {showDetails && selectedTransfer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDetails();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="transfer-details-title"
              className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="transfer-details-title" className="text-lg font-bold">
                    Transfer Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {getAssetTag(selectedTransfer)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close transfer details"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Current status</p>
                    <div className="mt-2">
                      <StatusBadge status={getStatus(selectedTransfer)} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatDate(
                      selectedTransfer.created_at ||
                        selectedTransfer.requested_at
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    ["Asset Tag", getAssetTag(selectedTransfer)],
                    ["Asset Name", getAssetName(selectedTransfer)],
                    ["Requester", getRequester(selectedTransfer)],
                    ["Mover", getMover(selectedTransfer)],
                    ["Destination", getDestination(selectedTransfer)],
                    ["Reason", selectedTransfer.reason || "—"],
                    ["Notes", selectedTransfer.notes || "—"],
                    ["Transfer ID", selectedTransfer.id || "—"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {label}
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-700">
                  {renderActions(selectedTransfer)}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
