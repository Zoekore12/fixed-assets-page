"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ClipboardList,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function RoleAssetAssignmentsPage({
  role,
  assignmentsEndpoint,
  pageTitle,
  pageDescription,
  scopeDescription,
}) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState("assign");

  const [form, setForm] = useState({
    asset_id: "",
    user_id: "",
    reason: "",
    notes: "",
  });

  const loadAssignments = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await api.get(assignmentsEndpoint);
        const result = response?.data ?? response;

        if (result?.success === false) {
          throw new Error(
            result.message || "Unable to load asset assignments."
          );
        }

        setAssignments(
          Array.isArray(result?.assignments) ? result.assignments : []
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load asset assignments."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [assignmentsEndpoint]
  );

  useEffect(() => {
  const timer = setTimeout(() => {
    loadAssignments();
  }, 0);

  return () => clearTimeout(timer);
}, [loadAssignments]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) =>
      [
        assignment.asset_tag,
        assignment.asset_name,
        assignment.name,
        assignment.full_name,
        assignment.user_name,
        assignment.assigned_to_name,
        assignment.email,
        assignment.user_email,
        assignment.status,
        assignment.department_name,
        assignment.unit_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [assignments, search]);

  function openForm(mode = "assign", assignment = null) {
    setAssignmentMode(mode);
    setForm({
      asset_id: assignment?.asset_id || "",
      user_id: "",
      reason: "",
      notes: "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setForm({
      asset_id: "",
      user_id: "",
      reason: "",
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

  async function handleSubmit(event) {
    event.preventDefault();

    const assetId = form.asset_id.trim();
    const userId = form.user_id.trim();
    const reason = form.reason.trim();
    const notes = form.notes.trim();

    if (!assetId || !userId) {
      setError("Asset UUID and staff user UUID are required.");
      return;
    }

    if (assignmentMode === "reassign" && !reason) {
      setError("A reason is required for reassignment.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        user_id: userId,
        ...(reason ? { reason } : {}),
        notes: notes || null,
      };

      const endpoint =
        `/assignments/assets/${encodeURIComponent(assetId)}/` +
        (assignmentMode === "reassign" ? "reassign" : "assign");

      const response = await api.post(endpoint, payload);
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(result.message || "The request could not be completed.");
      }

      setNotice(
        result?.message ||
          (assignmentMode === "reassign"
            ? "Asset reassigned successfully."
            : "Asset assignment request submitted successfully.")
      );

      setShowForm(false);
      setForm({
        asset_id: "",
        user_id: "",
        reason: "",
        notes: "",
      });

      await loadAssignments(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to process the asset assignment."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <ClipboardList size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {pageTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {pageDescription}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {scopeDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadAssignments(true)}
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
              onClick={() => openForm("assign")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Assign Asset
            </button>
          </div>
        </div>

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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Active Assignment Records
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : assignments.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Records returned by your role-specific API
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <ClipboardList size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Matching Records</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : filteredAssignments.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Records matching your search
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Search size={23} />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">Assignment Directory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review current holders and reassign assets within your permitted scope.
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
                placeholder="Search assignments..."
                aria-label="Search asset assignments"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading asset assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Package size={27} />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {search.trim()
                  ? "No matching assignments"
                  : "No assignment records found"}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim()
                  ? "Try a different search term."
                  : "Assignments returned by your role-specific API will appear here."}
              </p>
              {!search.trim() && (
                <button
                  type="button"
                  onClick={() => openForm("assign")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Assign Asset
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Asset</th>
                    <th className="px-5 py-4 font-semibold">Assigned Staff</th>
                    <th className="px-5 py-4 font-semibold">Assignment Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAssignments.map((assignment, index) => {
                    const assetId = assignment.asset_id;
                    const assetName =
                      assignment.asset_name ||
                      assignment.asset_tag ||
                      "Asset";
                    const staffName =
                      assignment.assigned_to_name ||
                      assignment.user_name ||
                      assignment.full_name ||
                      assignment.name ||
                      assignment.assigned_to_email ||
                      assignment.user_email ||
                      assignment.email ||
                      "Staff member";
                    const assignmentDate =
                      assignment.assigned_at ||
                      assignment.assignment_date ||
                      assignment.created_at;
                    const status =
                      assignment.status ||
                      (assignment.is_active ? "ACTIVE" : "HISTORICAL");

                    return (
                      <tr
                        key={assignment.id || `${assetId}-${index}`}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                              <Package size={19} />
                            </div>
                            <div>
                              <p className="font-semibold">{assetName}</p>
                              {assignment.asset_tag && assignment.asset_name && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {assignment.asset_tag}
                                </p>
                              )}
                              <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                                ID: {assetId || "Not provided"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <UserRound size={17} className="text-slate-400" />
                            <span>{staffName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {assignmentDate
                            ? new Date(assignmentDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {String(status).replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openForm("reassign", assignment)}
                              disabled={!assetId}
                              aria-label={`Reassign ${assetName}`}
                              title="Reassign asset"
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                            >
                              <ArrowLeftRight size={15} />
                              Reassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredAssignments.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
              Showing {filteredAssignments.length} of {assignments.length} assignment records
            </div>
          )}
        </div>

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForm();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="assignment-form-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="assignment-form-title" className="text-lg font-bold">
                    {assignmentMode === "reassign"
                      ? "Reassign Asset"
                      : "Assign Asset"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {role} asset management
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
                <div className="space-y-5 p-5">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="assignment-asset-id" className="block text-sm font-semibold">
                      Asset UUID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="assignment-asset-id"
                      name="asset_id"
                      value={form.asset_id}
                      onChange={handleFormChange}
                      placeholder="Enter the asset UUID"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="assignment-user-id" className="block text-sm font-semibold">
                      Receiving Staff User UUID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="assignment-user-id"
                      name="user_id"
                      value={form.user_id}
                      onChange={handleFormChange}
                      placeholder="Enter the staff user UUID"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="assignment-reason" className="block text-sm font-semibold">
                      Reason {assignmentMode === "reassign" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <textarea
                      id="assignment-reason"
                      name="reason"
                      value={form.reason}
                      onChange={handleFormChange}
                      placeholder="Explain the assignment or reassignment..."
                      rows={3}
                      required={assignmentMode === "reassign"}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                    {assignmentMode === "assign" && (
                      <p className="text-xs text-slate-500">
                        Required if the asset must be transferred to another location.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="assignment-notes" className="block text-sm font-semibold">
                      Notes
                    </label>
                    <textarea
                      id="assignment-notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      placeholder="Additional information (optional)"
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    {saving
                      ? "Saving..."
                      : assignmentMode === "reassign"
                        ? "Confirm Reassignment"
                        : "Assign Asset"}
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
