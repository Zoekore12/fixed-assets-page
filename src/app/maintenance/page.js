"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Clock,
  Edit3,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);


  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState("PENDING");
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [form, setForm] = useState({
    assetId: "",
    maintenanceType: "",
    description: "",
    serviceProvider: "",
    cost: "",
    notes: "",
  });

  const [requestForm, setRequestForm] = useState({
  assetId: "",
  maintenanceType: "",
  description: "",
  serviceProvider: "",
  estimatedCost: "",
  notes: "",
  });

  const loadMaintenances = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/maintenances/maintenances");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load maintenance records."
        );
      }

      setMaintenances(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load maintenance records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
    useEffect(() => {
    let ignore = false;

    const fetchMaintenances = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/maintenances/maintenances");

        if (!ignore) {
          const result = response?.data ?? response;
          setMaintenances(
            Array.isArray(result?.data) ? result.data : []
          );
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              "Failed to load maintenance records."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchMaintenances();

    return () => {
      ignore = true;
    };
  }, []);


const loadMaintenanceRequests = useCallback(async () => {
  try {
    const params = requestStatus ? { status: requestStatus } : {};

    const response = await api.get("/maintenances/requests", {
      params,
    });

    const result = response?.data ?? response;

    if (result?.success === false) {
      throw new Error(
        result.message || "Unable to load maintenance requests."
      );
    }

    setMaintenanceRequests(
      Array.isArray(result?.data) ? result.data : []
    );
  } catch (err) {
    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to load maintenance requests."
    );
  }
}, [requestStatus]);

useEffect(() => {
  let ignore = false;

  const fetchMaintenanceRequests = async () => {
    try {
      const params = requestStatus ? { status: requestStatus } : {};

      const response = await api.get("/maintenances/requests", { params });
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load maintenance requests."
        );
      }

      if (!ignore) {
        setMaintenanceRequests(
          Array.isArray(result?.data) ? result.data : []
        );
      }
    } catch (err) {
      if (!ignore) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load maintenance requests."
        );
      }
    }
  };

  fetchMaintenanceRequests();

  return () => {
    ignore = true;
  };
}, [requestStatus]);

  const filteredMaintenances = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return maintenances;

    return maintenances.filter((maintenance) =>
      [
        maintenance.asset_tag,
        maintenance.asset_name,
        maintenance.maintenance_type,
        maintenance.description,
        maintenance.service_provider,
        maintenance.status,
        maintenance.notes,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [maintenances, search]);

  function openCreateRequestForm() {
  setRequestForm({
    assetId: "",
    maintenanceType: "",
    description: "",
    serviceProvider: "",
    estimatedCost: "",
    notes: "",
  });

    setError("");
    setNotice("");
    setShowRequestForm(true);
  }

  function openCreateForm() {
    setForm({
      assetId: "",
      maintenanceType: "",
      description: "",
      serviceProvider: "",
      cost: "",
      notes: "",
    });

    setNotice("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setForm({
      assetId: "",
      maintenanceType: "",
      description: "",
      serviceProvider: "",
      cost: "",
      notes: "",
    });
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmitRequest(event) {
    event.preventDefault();

    if (
      !requestForm.assetId.trim() ||
      !requestForm.maintenanceType.trim() ||
      !requestForm.description.trim()
    ) {
      setError(
        "Asset ID, maintenance type and description are required."
      );
      return;
    }

    if (
      requestForm.estimatedCost.trim() !== "" &&
      (!Number.isFinite(Number(requestForm.estimatedCost)) ||
        Number(requestForm.estimatedCost) < 0)
    ) {
      setError("Estimated cost must be a valid non-negative number.");
      return;
    }

    setSavingRequest(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        assetId: requestForm.assetId.trim(),
        maintenanceType: requestForm.maintenanceType.trim(),
        description: requestForm.description.trim(),
        serviceProvider: requestForm.serviceProvider.trim() || null,
        estimatedCost:
          requestForm.estimatedCost.trim() === ""
            ? null
            : Number(requestForm.estimatedCost),
        notes: requestForm.notes.trim() || null,
      };

      await api.post("/maintenances/requests", payload);

      setNotice("Maintenance request submitted successfully.");
      setShowRequestForm(false);

      setRequestForm({
        assetId: "",
        maintenanceType: "",
        description: "",
        serviceProvider: "",
        estimatedCost: "",
        notes: "",
      });

      await loadMaintenanceRequests();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to submit the maintenance request."
      );
    } finally {
      setSavingRequest(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.assetId.trim() ||
      !form.maintenanceType.trim() ||
      !form.description.trim()
    ) {
      setError(
        "Asset ID, maintenance type and description are required."
      );
      return;
    }

    if (
      form.cost.trim() !== "" &&
      (!Number.isFinite(Number(form.cost)) ||
        Number(form.cost) < 0)
    ) {
      setError("Cost must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        assetId: form.assetId.trim(),
        maintenanceType: form.maintenanceType.trim(),
        description: form.description.trim(),
        serviceProvider: form.serviceProvider.trim() || null,
        cost: form.cost.trim() === "" ? null : Number(form.cost),
        notes: form.notes.trim() || null,
      };

      await api.post("/maintenances/maintenances", payload);

      setNotice("Maintenance record created successfully.");
      setShowForm(false);

      setForm({
        assetId: "",
        maintenanceType: "",
        description: "",
        serviceProvider: "",
        cost: "",
        notes: "",
      });

      await loadMaintenances(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create the maintenance record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(maintenance) {
    if (
      String(maintenance.status || "").toUpperCase() === "COMPLETED"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to mark this maintenance record as completed?"
    );

    if (!confirmed) return;

    setCompletingId(maintenance.id);
    setError("");
    setNotice("");

    try {
      await api.post(
        `/maintenances/maintenances/${maintenance.id}/complete`
      );

      setNotice("Maintenance completed successfully.");
      await loadMaintenances(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to complete the maintenance record."
      );
    } finally {
      setCompletingId(null);
    }
  }
  
  async function handleApproveRequest(request) {
  if (request.status !== "PENDING") return;

  const confirmed = window.confirm(
    "Are you sure you want to approve this maintenance request?"
  );

  if (!confirmed) return;

  setProcessingRequestId(request.id);
  setError("");
  setNotice("");

  try {
    await api.patch(
      `/maintenances/requests/${request.id}/approve`
    );

    setNotice("Maintenance request approved successfully.");

    await Promise.all([
      loadMaintenanceRequests(),
      loadMaintenances(true),
    ]);
  } catch (err) {
    setError(
      err?.response?.data?.message ||
        err?.message ||
        "Unable to approve the maintenance request."
    );
  } finally {
    setProcessingRequestId(null);
  }
}

function openRejectRequest(request) {
  if (request.status !== "PENDING") return;

  setError("");
  setNotice("");
  setRejectionReason("");
  setRejectingRequest(request);
}

async function handleRejectRequest(event) {
    event.preventDefault();

    if (!rejectingRequest) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      setError("A rejection reason is required.");
      return;
    }

    setProcessingRequestId(rejectingRequest.id);
    setError("");
    setNotice("");

    try {
      await api.patch(
        `/maintenances/requests/${rejectingRequest.id}/reject`,
        {
          rejectionReason: reason,
        }
      );

      setNotice("Maintenance request rejected successfully.");
      setRejectingRequest(null);
      setRejectionReason("");

      await loadMaintenanceRequests();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to reject the maintenance request."
      );
    } finally {
      setProcessingRequestId(null);
    }
  }

  function getStatusClass(status) {
    switch (String(status || "").toUpperCase()) {
      case "COMPLETED":
        return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
      case "OPEN":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
      case "IN_PROGRESS":
        return "bg-[#1597E5]/100 text-[#1597E5] dark:bg-[#1597E5]/30 dark:text-[#1597E5]/950";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    }
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/30 dark:text-[#1597E5]/950">
              <Wrench size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Maintenance Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage maintenance records for your ministry assets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadMaintenances(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]/80"
            >
              <Plus size={17} />
              Create Maintenance
            </button>

            <button
            type="button"
            onClick={openCreateRequestForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1597E5]/50 bg-white px-4 py-2.5 text-sm font-semibold text-[#1597E5] transition hover:bg-[#1597E5]/10 dark:border-[#1597E5]/50 dark:bg-slate-900 dark:text-[#1597E5]/950"
          >
            <Plus size={17} />
            Create Maintenance Request
          </button>
          </div>
        </div>

        {/* Feedback messages */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0"
            />

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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Total Records
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : maintenances.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Registered maintenance records
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/30 dark:text-[#1597E5]/950
              ">
                <ClipboardList size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Open Maintenance
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading
                    ? "—"
                    : maintenances.filter(
                        (item) =>
                          String(item.status || "").toUpperCase() ===
                          "OPEN"
                      ).length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Awaiting completion
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <Clock size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Completed
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading
                    ? "—"
                    : maintenances.filter(
                        (item) =>
                          String(item.status || "").toUpperCase() ===
                          "COMPLETED"
                      ).length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Completed maintenance records
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300">
                <ShieldCheck size={23} />
              </div>
            </div>
          </div>
        </div>
        {/* Maintenance requests */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Maintenance Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review requests and approve or reject pending maintenance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={requestStatus}
                onChange={(event) => setRequestStatus(event.target.value)}
                aria-label="Filter maintenance requests by status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="">All Requests</option>
              </select>

              <button
                type="button"
                onClick={loadMaintenanceRequests}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>
          </div>

          {maintenanceRequests.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ClipboardList
                size={28}
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-3 font-semibold">
                No maintenance requests found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                There are no requests matching the selected status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Asset</th>
                    <th className="px-5 py-4 font-semibold">Requester</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Rejection Reason</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {maintenanceRequests.map((request) => {
                    const status = String(request.status || "").toUpperCase();
                    const isProcessing =
                      processingRequestId === request.id;

                    return (
                      <tr
                        key={request.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {request.asset_tag ||
                              request.asset_name ||
                              "Asset"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {request.asset_id || "No asset ID"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {[
                            request.requester_first_name,
                            request.requester_last_name,
                          ]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </td>

                        <td className="px-5 py-4">
                          {request.maintenance_type || "—"}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-500">
                          <p className="line-clamp-2">
                            {request.description || "No description"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              status === "APPROVED"
                                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                : status === "REJECTED"
                                  ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {status || "UNKNOWN"}
                          </span>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-500">
                          {request.rejection_reason || "—"}
                        </td>

                        <td className="px-5 py-4">
                          {status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveRequest(request)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-50 dark:border-green-900 dark:text-green-300 dark:hover:bg-green-950"
                              >
                                {isProcessing ? (
                                  <LoaderCircle
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={14} />
                                )}
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() => openRejectRequest(request)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                              >
                                <X size={14} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Reviewed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
            Showing {maintenanceRequests.length} maintenance requests
          </div>
        </div>

        {/* Maintenance table */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Maintenance Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View, search, and complete maintenance records.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search maintenance..."
                aria-label="Search maintenance records"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading maintenance records...
            </div>
          ) : filteredMaintenances.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Wrench size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                {search.trim()
                  ? "No matching maintenance records"
                  : "No maintenance records yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim()
                  ? "Try a different search term."
                  : "Create a maintenance record to begin tracking asset repairs and servicing."}
              </p>

              {!search.trim() && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]/80"
                >
                  <Plus size={17} />
                  Create Maintenance
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Asset
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Maintenance Type
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Description
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Cost
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMaintenances.map((maintenance) => (
                      <tr
                        key={maintenance.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/30 dark:text-white/950">
                              <Package size={19} />
                            </div>

                            <div>
                              <p className="font-semibold">
                                {maintenance.asset_tag ||
                                  maintenance.asset_name ||
                                  "Asset"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {maintenance.asset_id || "No asset ID"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {maintenance.maintenance_type || "—"}
                        </td>

                        <td className="max-w-sm px-5 py-4 text-slate-500">
                          <p className="line-clamp-2">
                            {maintenance.description || "No description"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {maintenance.cost == null
                            ? "—"
                            : `₦${Number(
                                maintenance.cost
                              ).toLocaleString("en-NG")}`}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              maintenance.status
                            )}`}
                          >
                            {maintenance.status || "UNKNOWN"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleComplete(maintenance)}
                              disabled={
                                completingId === maintenance.id ||
                                String(
                                  maintenance.status || ""
                                ).toUpperCase() === "COMPLETED"
                              }
                              title="Mark maintenance as completed"
                              aria-label={`Complete maintenance ${maintenance.id}`}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-green-900 dark:hover:bg-green-950 dark:hover:text-green-300"
                            >
                              {completingId === maintenance.id ? (
                                <LoaderCircle
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Check size={15} />
                              )}

                              Complete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredMaintenances.length} of{" "}
                {maintenances.length} maintenance records
              </div>
            </>
          )}
        </div>
          {/* Create maintenance request modal */}
          {showRequestForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="maintenance-request-form-title"
                className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                  <div>
                    <h2
                      id="maintenance-request-form-title"
                      className="text-lg font-bold"
                    >
                      Create Maintenance Request
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Submit an asset maintenance request for review.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!savingRequest) setShowRequestForm(false);
                    }}
                    disabled={savingRequest}
                    aria-label="Close request form"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                  >
                    <X size={19} />
                  </button>
                </div>

                <form onSubmit={handleSubmitRequest}>
                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label
                        htmlFor="request-asset-id"
                        className="block text-sm font-semibold"
                      >
                        Asset ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="request-asset-id"
                        value={requestForm.assetId}
                        onChange={(event) =>
                          setRequestForm((current) => ({
                            ...current,
                            assetId: event.target.value,
                          }))
                        }
                        placeholder="Enter the asset UUID"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="request-maintenance-type"
                        className="block text-sm font-semibold"
                      >
                        Maintenance Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="request-maintenance-type"
                        value={requestForm.maintenanceType}
                        onChange={(event) =>
                          setRequestForm((current) => ({
                            ...current,
                            maintenanceType: event.target.value,
                          }))
                        }
                        placeholder="e.g. Repair, Servicing"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="request-service-provider"
                        className="block text-sm font-semibold"
                      >
                        Suggested Service Provider
                      </label>
                      <input
                        id="request-service-provider"
                        value={requestForm.serviceProvider}
                        onChange={(event) =>
                          setRequestForm((current) => ({
                            ...current,
                            serviceProvider: event.target.value,
                          }))
                        }
                        placeholder="Optional"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label
                        htmlFor="request-description"
                        className="block text-sm font-semibold"
                      >
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="request-description"
                        value={requestForm.description}
                        onChange={(event) =>
                          setRequestForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Describe the issue and the maintenance required..."
                        rows={4}
                        required
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="request-estimated-cost"
                        className="block text-sm font-semibold"
                      >
                        Estimated Cost (₦)
                      </label>
                      <input
                        id="request-estimated-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={requestForm.estimatedCost}
                        onChange={(event) =>
                          setRequestForm((current) => ({
                            ...current,
                            estimatedCost: event.target.value,
                          }))
                        }
                        placeholder="Optional"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label
                        htmlFor="request-notes"
                        className="block text-sm font-semibold"
                      >
                        Notes
                      </label>
                      <textarea
                        id="request-notes"
                        value={requestForm.notes}
                        onChange={(event) =>
                          setRequestForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Additional information (optional)"
                        rows={3}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      disabled={savingRequest}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={savingRequest}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingRequest ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Plus size={17} />
                      )}
                      {savingRequest ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        {/* Create maintenance modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeForm();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="maintenance-form-title"
              className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="maintenance-form-title"
                    className="text-lg font-bold"
                  >
                    Create Maintenance Record
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the details of the maintenance work.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="maintenance-asset-id"
                      className="block text-sm font-semibold"
                    >
                      Asset ID <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="maintenance-asset-id"
                      name="assetId"
                      type="text"
                      value={form.assetId}
                      onChange={handleFormChange}
                      placeholder="Enter the asset UUID"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />

                    <p className="text-xs text-slate-500">
                      Enter the UUID of the asset requiring maintenance.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="maintenance-type"
                      className="block text-sm font-semibold"
                    >
                      Maintenance Type{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="maintenance-type"
                      name="maintenanceType"
                      type="text"
                      value={form.maintenanceType}
                      onChange={handleFormChange}
                      placeholder="e.g. Repair, Servicing"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="maintenance-provider"
                      className="block text-sm font-semibold"
                    >
                      Service Provider
                    </label>

                    <input
                      id="maintenance-provider"
                      name="serviceProvider"
                      type="text"
                      value={form.serviceProvider}
                      onChange={handleFormChange}
                      placeholder="Name of service provider"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="maintenance-description"
                      className="block text-sm font-semibold"
                    >
                      Description <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      id="maintenance-description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Describe the maintenance issue or work required..."
                      rows={4}
                      required
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="maintenance-cost"
                      className="block text-sm font-semibold"
                    >
                      Cost (₦)
                    </label>

                    <input
                      id="maintenance-cost"
                      name="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cost}
                      onChange={handleFormChange}
                      placeholder="e.g. 75000"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="maintenance-notes"
                      className="block text-sm font-semibold"
                    >
                      Notes
                    </label>

                    <textarea
                      id="maintenance-notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      placeholder="Additional maintenance notes..."
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]/80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={17} />
                    )}

                    {saving ? "Saving..." : "Create Maintenance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Reject maintenance request modal */}
        {rejectingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-request-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="reject-request-title"
                    className="text-lg font-bold"
                  >
                    Reject Maintenance Request
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Asset: {rejectingRequest.asset_tag || rejectingRequest.asset_name || "Asset"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (processingRequestId) return;
                    setRejectingRequest(null);
                    setRejectionReason("");
                  }}
                  disabled={Boolean(processingRequestId)}
                  aria-label="Close rejection form"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleRejectRequest}>
                <div className="space-y-3 p-5">
                  <label
                    htmlFor="rejection-reason"
                    className="block text-sm font-semibold"
                  >
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    placeholder="Explain why this maintenance request is being rejected..."
                    rows={4}
                    required
                    maxLength={2000}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />

                  <p className="text-xs text-slate-500">
                    Provide a clear reason for the decision.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingRequest(null);
                      setRejectionReason("");
                    }}
                    disabled={Boolean(processingRequestId)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      Boolean(processingRequestId) ||
                      !rejectionReason.trim()
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingRequestId ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <X size={17} />
                    )}
                    {processingRequestId ? "Rejecting..." : "Reject Request"}
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