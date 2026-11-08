"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

import {
  RefreshCw,
  Search,
  Eye,
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
  CheckCircle2,
  Laptop,
  Building2,
  UserPlus,
  ArrowLeftRight,
  ClipboardList,
} from "lucide-react";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getAssignmentData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.assignments)) return payload.assignments;
  if (Array.isArray(payload?.data)) return payload.data;

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

const getAssetName = (assignment) =>
  assignment?.asset_name || assignment?.name || "Asset";

const getAssetTag = (assignment) => assignment?.asset_tag || "—";

const getAssignmentId = (assignment) =>
  assignment?.assignment_id || assignment?.id;

const getAssetId = (assignment) =>
  assignment?.asset_id || assignment?.id;

const getLocation = (assignment) =>
  [
    assignment?.building_name,
    assignment?.department_name,
    assignment?.unit_name,
  ]
    .filter(Boolean)
    .join(" / ") || "Location not specified";

function StatusBadge({ status }) {
  const normalized = String(status || "ACTIVE").toUpperCase();

  const styles = {
    ACTIVE:
      "bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white",
    ASSIGNED:
      "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    PENDING:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    RETURNED:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    INACTIVE:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        styles[normalized] ||
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
}

function SummaryCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    blue: "bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white",
    green:
      "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300",
  };

  return (
    <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
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

        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="mt-0.5 text-[#1597E5] dark:text-blue-400">
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

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  multiline = false,
}) {
  const commonClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && <span className="ml-1 text-red-500 dark:text-red-400">*</span>}
      </label>

      {multiline ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={3}
          className={commonClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={commonClass}
        />
      )}
    </div>
  );
}

export default function HOUAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("assign");
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    user_id: "",
    reason: "",
    notes: "",
  });

  const pageSize = 10;

  const fetchAssignments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/assignments/unit-assignments");

      setAssignments(getAssignmentData(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssignments();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) =>
      [
        getAssetName(assignment),
        getAssetTag(assignment),
        assignment?.brand,
        assignment?.model,
        assignment?.serial_number,
        assignment?.assigned_to_name,
        assignment?.assigned_to_email,
        assignment?.assigned_by_name,
        getLocation(assignment),
        assignment?.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [assignments, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssignments.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeAssignments = assignments.filter((item) =>
    ["ACTIVE", "ASSIGNED"].includes(
      String(item?.assignment_status || "ACTIVE").toUpperCase()
    )
  ).length;

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedAssignment(null);
  };

  const openDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetails(true);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const openAssignmentForm = (assignment, mode) => {
    setSelectedAssignment(assignment);
    setFormMode(mode);
    setFormData({
      user_id: "",
      reason: "",
      notes: "",
    });
    setError("");
    setSuccess("");
    setShowDetails(false);
    setShowForm(true);
  };

  const closeForm = () => {
    if (submitting) return;

    setShowForm(false);
    setSelectedAssignment(null);
    setFormData({
      user_id: "",
      reason: "",
      notes: "",
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedAssignment) {
      setError("Please select an asset first.");
      return;
    }

    if (!formData.user_id.trim()) {
      setError("Enter the staff user's UUID.");
      return;
    }

    if (formMode === "reassign" && !formData.reason.trim()) {
      setError("A reason for reassignment is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const assetId = getAssetId(selectedAssignment);

      if (!assetId) {
        throw new Error(
          "The asset ID is missing from this assignment record."
        );
      }

      const payload =
        formMode === "assign"
          ? {
              user_id: formData.user_id.trim(),
              notes: formData.notes.trim() || null,
            }
          : {
              user_id: formData.user_id.trim(),
              reason: formData.reason.trim(),
              notes: formData.notes.trim() || null,
            };

      const endpoint =
        formMode === "assign"
          ? `/assignments/assets/${assetId}/assign`
          : `/assignments/assets/${assetId}/reassign`;

      const response = await api.post(endpoint, payload);

      const result = response?.data;

      if (result?.code === "TRANSFER_REQUEST_CREATED") {
        setSuccess(
          result.message ||
            "A transfer request was created. The asset has not yet been assigned."
        );
      } else {
        setSuccess(
          result?.message ||
            (formMode === "assign"
              ? "Asset assigned successfully."
              : "Asset reassigned successfully.")
        );
      }

      setShowForm(false);
      setSelectedAssignment(null);
      setFormData({
        user_id: "",
        reason: "",
        notes: "",
      });

      await fetchAssignments(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                Unit Asset Assignments
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View and manage asset assignments within your unit.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAssignments(true)}
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

        {/* Success message */}
        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="rounded p-1 hover:bg-green-100 dark:hover:bg-green-900/40"
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SummaryCard
            title="Unit Assignments"
            value={assignments.length}
            description="Assignments returned by your unit endpoint"
            icon={FileText}
            color="blue"
          />

          <SummaryCard
            title="Active Assignments"
            value={activeAssignments}
            description="Currently active assignments"
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Assignment directory */}
        <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Unit Assignment Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search and manage assets assigned within your unit.
              </p>
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
                placeholder="Search asset, staff, tag, location..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Asset</th>
                  <th className="px-5 py-4 font-semibold">Brand / Model</th>
                  <th className="px-5 py-4 font-semibold">Assigned To</th>
                  <th className="px-5 py-4 font-semibold">Location</th>
                  <th className="px-5 py-4 font-semibold">Assigned Date</th>
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
                        <p className="text-sm">
                          Loading unit assignments...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          <Package size={30} />
                        </div>

                        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
                          No unit assignments found
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {searchTerm
                            ? "Try a different search term."
                            : "Assignments for your unit will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAssignments.map((assignment, index) => (
                    <tr
                      key={
                        getAssignmentId(assignment) ||
                        `${getAssetTag(assignment)}-${index}`
                      }
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white">
                            <Laptop size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {getAssetName(assignment)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Tag: {getAssetTag(assignment)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                        <p>{assignment?.brand || "—"}</p>

                        <p className="mt-1 text-xs text-slate-500">
                          {assignment?.model || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {assignment?.assigned_to_name || "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {assignment?.assigned_to_email || ""}
                        </p>
                      </td>

                      <td className="max-w-[220px] px-5 py-4">
                        <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <span className="break-words">
                            {getLocation(assignment)}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(assignment?.assigned_at)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={assignment?.assignment_status}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="View assignment"
                            onClick={() => openDetails(assignment)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Assign asset"
                            onClick={() =>
                              openAssignmentForm(assignment, "assign")
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#1597E5] transition hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-[#1597E5]/10"
                          >
                            <UserPlus size={16} />
                          </button>

                          <button
                            type="button"
                            title="Reassign asset"
                            onClick={() =>
                              openAssignmentForm(assignment, "reassign")
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-amber-600 transition hover:bg-amber-50 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-amber-500/10"
                          >
                            <ArrowLeftRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredAssignments.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {Math.min(
                    currentPage * pageSize,
                    filteredAssignments.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {filteredAssignments.length}
                </span>{" "}
                assignments
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Assignment details modal */}
        {showDetails && selectedAssignment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDetails();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="assignment-title"
              className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6 dark:border-slate-700">
                <div>
                  <h2
                    id="assignment-title"
                    className="text-xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    Assignment Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Details of an asset assigned within your unit.
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
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1597E5]/30 bg-[#1597E5]/10 p-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {getAssetName(selectedAssignment)}
                    </p>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Asset tag: {getAssetTag(selectedAssignment)}
                    </p>
                  </div>

                  <StatusBadge
                    status={selectedAssignment?.assignment_status}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={UserRound}
                    label="Assigned to"
                    value={selectedAssignment?.assigned_to_name}
                  />

                  <DetailItem
                    icon={UserRound}
                    label="Staff email"
                    value={selectedAssignment?.assigned_to_email}
                  />

                  <DetailItem
                    icon={Package}
                    label="Asset condition"
                    value={selectedAssignment?.asset_condition}
                  />

                  <DetailItem
                    icon={FileText}
                    label="Asset status"
                    value={selectedAssignment?.asset_status}
                  />

                  <DetailItem
                    icon={Laptop}
                    label="Brand"
                    value={selectedAssignment?.brand}
                  />

                  <DetailItem
                    icon={Laptop}
                    label="Model"
                    value={selectedAssignment?.model}
                  />

                  <DetailItem
                    icon={FileText}
                    label="Serial number"
                    value={selectedAssignment?.serial_number}
                  />

                  <DetailItem
                    icon={CalendarDays}
                    label="Assigned date"
                    value={formatDate(selectedAssignment?.assigned_at)}
                  />

                  <DetailItem
                    icon={UserRound}
                    label="Assigned by"
                    value={selectedAssignment?.assigned_by_name}
                  />

                  <DetailItem
                    icon={Building2}
                    label="Building"
                    value={selectedAssignment?.building_name}
                  />

                  <DetailItem
                    icon={Building2}
                    label="Department"
                    value={selectedAssignment?.department_name}
                  />

                  <DetailItem
                    icon={Building2}
                    label="Unit"
                    value={selectedAssignment?.unit_name}
                  />

                  <DetailItem
                    icon={CalendarDays}
                    label="Returned date"
                    value={formatDate(selectedAssignment?.returned_at)}
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Assignment Notes
                  </h3>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
                    {selectedAssignment?.notes || "No notes provided."}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-5 sm:p-6 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() =>
                    openAssignmentForm(selectedAssignment, "assign")
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117fc2]"
                >
                  <UserPlus size={16} />
                  Assign
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openAssignmentForm(selectedAssignment, "reassign")
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ArrowLeftRight size={16} />
                  Reassign
                </button>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignment form modal */}
        {showForm && selectedAssignment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !submitting
              ) {
                closeForm();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="assignment-form-title"
              className="my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:p-6 dark:border-slate-700">
                <div>
                  <h2
                    id="assignment-form-title"
                    className="text-xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    {formMode === "assign"
                      ? "Assign Asset"
                      : "Reassign Asset"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {getAssetName(selectedAssignment)} ·{" "}
                    {getAssetTag(selectedAssignment)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-5 p-5 sm:p-6">
                  <div className="rounded-xl border border-[#1597E5]/30 bg-[#1597E5]/10 p-4 text-sm text-blue-700 dark:text-blue-300">
                    <div className="flex gap-2">
                      <ClipboardList
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <p>
                        Enter the UUID of the staff member who should
                        receive this asset. The backend validates the
                        target user&#39;s unit and the asset&#39;s location.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{error}</span>
                    </div>
                  )}

                  <FormField
                    label="Staff User ID (UUID)"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleFormChange}
                    placeholder="Enter the staff user's UUID"
                    required
                  />

                  {formMode === "reassign" && (
                    <FormField
                      label="Reason for reassignment"
                      name="reason"
                      value={formData.reason}
                      onChange={handleFormChange}
                      placeholder="Explain why this asset is being reassigned"
                      required
                      multiline
                    />
                  )}

                  <FormField
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Optional assignment notes"
                    multiline
                  />

                  {formMode === "assign" && (
                    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      If the asset is in a different building,
                      department, or unit from the target staff member,
                      your backend may create a transfer request instead
                      of assigning the asset immediately. A transfer
                      reason is required for that workflow.
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:p-6 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={submitting}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117fc2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {formMode === "assign" ? (
                          <UserPlus size={16} />
                        ) : (
                          <ArrowLeftRight size={16} />
                        )}

                        {formMode === "assign"
                          ? "Assign Asset"
                          : "Reassign Asset"}
                      </>
                    )}
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