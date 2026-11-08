"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Activity,
  Check,
  ClipboardList,
  Eye,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const loadAuditLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/audit-logs");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load audit logs."
        );
      }

      setLogs(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/audit-logs");

        if (!ignore) {
          const result = response?.data ?? response;
          setLogs(
            Array.isArray(result?.data) ? result.data : []
          );
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              "Failed to load audit logs."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchAuditLogs();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return logs;

    return logs.filter((log) =>
      [
        log.id,
        log.user_id,
        log.action,
        log.entity_type,
        log.entity_id,
        log.description,
        log.ip_address,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [logs, search]);

  async function openAuditRecord(log) {
    setLoadingRecord(true);
    setError("");
    setNotice("");

    try {
      const response = await api.get(`/audit-logs/${log.id}`);
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load audit record."
        );
      }

      setSelectedLog(result?.data ?? log);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load audit record."
      );
    } finally {
      setLoadingRecord(false);
    }
  }

  function closeRecord() {
    if (loadingRecord) return;
    setSelectedLog(null);
  }

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleString();
  }

  function formatJson(value) {
    if (value === null || value === undefined) {
      return "No data recorded";
    }

    if (typeof value === "string") {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }

    return JSON.stringify(value, null, 2);
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <ClipboardList size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Audit Logs
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Review and investigate activity across your
                  ministry&#39;s asset management system.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadAuditLogs(true)}
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Total Audit Records
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : logs.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Recorded system activities
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Activity size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Matching Records
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : filteredLogs.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Records matching your search
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Search size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Audit logs table */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Audit History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search recorded actions and inspect individual
                audit records.
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
                placeholder="Search audit logs..."
                aria-label="Search audit logs"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <FileSearch size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                {search.trim()
                  ? "No matching audit records"
                  : "No audit records yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim()
                  ? "Try a different search term."
                  : "System activity will appear here when audit events are recorded."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Action
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Entity
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Description
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        IP Address
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                              <Activity size={19} />
                            </div>

                            <span className="font-semibold">
                              {log.action || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {log.entity_type || "—"}
                          </p>

                          <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                            {log.entity_id || "No entity ID"}
                          </p>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-500">
                          <p className="line-clamp-2">
                            {log.description || "No description provided"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {log.ip_address || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(log.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => openAuditRecord(log)}
                              disabled={loadingRecord}
                              aria-label={`View audit record ${log.id}`}
                              title="View audit record"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5] hover:bg-[#1597E5] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5] dark:hover:bg-[#1597E5] dark:hover:text-white"
                            >
                              {loadingRecord ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredLogs.length} of {logs.length} audit records
              </div>
            </>
          )}
        </div>

        {/* Audit record details modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeRecord();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="audit-record-title"
              className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto scrollbar-hide rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="audit-record-title"
                    className="text-lg font-bold"
                  >
                    Audit Record Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Inspect the recorded system activity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRecord}
                  disabled={loadingRecord}
                  aria-label="Close details"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-6 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    ["Record ID", selectedLog.id],
                    ["User ID", selectedLog.user_id],
                    ["Action", selectedLog.action],
                    ["Entity Type", selectedLog.entity_type],
                    ["Entity ID", selectedLog.entity_id],
                    ["IP Address", selectedLog.ip_address],
                    ["Created At", formatDate(selectedLog.created_at)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {label}
                      </p>

                      <p className="mt-2 break-all text-sm font-medium">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Description
                  </h3>

                  <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    {selectedLog.description || "No description provided"}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    User Agent
                  </h3>

                  <div className="break-all rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    {selectedLog.user_agent || "—"}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    Previous Data
                  </h3>

                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {formatJson(selectedLog.old_data)}
                  </pre>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    New Data
                  </h3>

                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {formatJson(selectedLog.new_data)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 p-5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeRecord}
                  disabled={loadingRecord}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
