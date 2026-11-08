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

const getAssetTag = (assignment) =>
  assignment?.asset_tag || "—";

const getAssignmentId = (assignment) =>
  assignment?.assignment_id || assignment?.id;

const getLocation = (assignment) =>
  [
    assignment?.building_name,
    assignment?.department_name,
    assignment?.unit_name,
  ]
    .filter(Boolean)
    .join(" / ") || "Location not specified";

const STATUS_STYLES = {
  ACTIVE:
    "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  INACTIVE:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  RETURNED:
    "bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white",
  PENDING:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function StatusBadge({ status }) {
  const normalized = String(status || "ACTIVE").toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[normalized] ||
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized.replaceAll("_", " ")}
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
    <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="mt-0.5 shrink-0 text-[#1597E5]">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
          {value == null || value === "" ? "—" : String(value)}
        </p>
      </div>
    </div>
  );
}

export default function HODAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 10;

  // HOD endpoint: only assignments belonging to the HOD's department.
  const fetchAssignments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get(
        "/assignments/department-assignments"
      );

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

  const openDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedAssignment(null);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const activeAssignments = assignments.filter(
    (item) =>
      String(item?.assignment_status || "ACTIVE").toUpperCase() ===
      "ACTIVE"
  ).length;

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Department Asset Assignments
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View active asset assignments within your department.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchAssignments(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SummaryCard
            title="Department Assignments"
            value={assignments.length}
            description="Assignments returned by your department endpoint"
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
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="border-b border-slate-200 p-5 dark:border-slate-700">
            <div className="relative w-full xl:max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                placeholder="Search asset, staff, tag, location..."
                aria-label="Search assignments"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
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
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <Loader2
                          size={28}
                          className="animate-spin text-[#1597E5]"
                        />

                        <p className="text-sm">
                          Loading department assignments...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          <Package size={30} />
                        </div>

                        <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                          No department assignments found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {searchTerm
                            ? "Try a different search term."
                            : "Active assignments for your department will appear here."}
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
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                            <Laptop size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {getAssetName(assignment)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Tag: {getAssetTag(assignment)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        <p>{assignment?.brand || "—"}</p>

                        <p className="mt-1 text-xs text-slate-500">
                          {assignment?.model || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {assignment?.assigned_to_name || "—"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
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

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(assignment?.assigned_at)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={assignment?.assignment_status}
                        />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          title="View assignment"
                          aria-label="View assignment"
                          onClick={() => openDetails(assignment)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredAssignments.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
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
              <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6">
                <div>
                  <h2
                    id="assignment-title"
                    className="text-xl font-bold text-slate-900 dark:text-white"
                  >
                    Assignment Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Details of an asset assigned within your department.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close details"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
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
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                    Assignment Notes
                  </h3>

                  <div className="rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    {selectedAssignment?.notes || "No notes provided."}
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 p-5 dark:border-slate-700 sm:p-6">
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
      </section>
    </DashboardLayout>
  );
}