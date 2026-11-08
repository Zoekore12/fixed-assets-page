"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Tag,
  XCircle,
} from "lucide-react";

import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function DepartmentAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDepartmentAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/assets/department-assets");
      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Failed to load department assets."
        );
      }

      const assetList = Array.isArray(result.assets) ? result.assets : [];

      setAssets(assetList);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch department assets error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load department assets."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDepartmentAssets();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchDepartmentAssets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      let result = [...assets];

      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();

        result = result.filter((asset) =>
          [
            asset.asset_tag,
            asset.name,
            asset.serial_number,
            asset.brand,
            asset.model,
            asset.category_name,
            asset.building_name,
            asset.department_name,
            asset.unit_name,
            asset.status,
            asset.condition,
          ].some((value) =>
            String(value ?? "").toLowerCase().includes(search)
          )
        );
      }

      if (statusFilter !== "ALL") {
        result = result.filter(
          (asset) => asset.status === statusFilter
        );
      }

      setFilteredAssets(result);
    }, 0);

    return () => clearTimeout(timer);
  }, [assets, searchTerm, statusFilter]);

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString();
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";

      case "ASSIGNED":
        return "bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white";

      case "IN_TRANSIT":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300";

      case "OUT":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300";

      case "MAINTENANCE":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300";

      case "LOST":
      case "DAMAGED":
        return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";

      case "OBSOLETE":
      case "RETIRED":
      case "DISPOSED":
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Building2 size={17} />
                <span>Department Management</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Department Assets
              </h1>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                View and monitor assets assigned to your department.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDepartmentAssets}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <XCircle
                  size={21}
                  className="mt-0.5 shrink-0 text-red-600 dark:text-red-300"
                />

                <div>
                  <h2 className="font-semibold text-red-800 dark:text-red-300">
                    Unable to Load Department Assets
                  </h2>

                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchDepartmentAssets}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Total Department Assets
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                    {loading ? "—" : assets.length}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                  <Package size={23} />
                </div>
              </div>
            </div>

            <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Available Assets
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                    {loading
                      ? "—"
                      : assets.filter(
                          (asset) => asset.status === "AVAILABLE"
                        ).length}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300">
                  <Tag size={23} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by asset name, tag, brand, model..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT">Out</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="LOST">Lost</option>
                <option value="DAMAGED">Damaged</option>
                <option value="OBSOLETE">Obsolete</option>
                <option value="RETIRED">Retired</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </div>

            <div className="mt-3 flex flex-col justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center">
              <p>
                Showing {filteredAssets.length} of {assets.length} assets
              </p>

              {lastUpdated && (
                <p className="flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  Updated {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="dashboard-card flex min-h-64 flex-col items-center justify-center rounded-2xl border">
              <Loader2 size={35} className="animate-spin text-[#1597E5]" />

              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Loading department assets...
              </p>
            </div>
          ) : error ? null : filteredAssets.length === 0 ? (
            <div className="dashboard-card flex min-h-64 flex-col items-center justify-center rounded-2xl border px-4 text-center">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <Package size={30} className="text-slate-400" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
                {assets.length === 0
                  ? "No Department Assets"
                  : "No Matching Assets"}
              </h2>

              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {assets.length === 0
                  ? "There are currently no active assets recorded for your department."
                  : "Try changing your search term or status filter."}
              </p>

              {(searchTerm || statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-4 rounded-xl bg-[#1597E5] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="dashboard-card hidden overflow-hidden rounded-2xl border shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/70">
                      <tr>
                        <th className="px-5 py-4">Asset</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Brand / Model</th>
                        <th className="px-5 py-4">Location</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Condition</th>
                        <th className="px-5 py-4">Created</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {asset.name || "Unnamed Asset"}
                            </div>

                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {asset.asset_tag || "No asset tag"}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {asset.serial_number || "No serial number"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                            {asset.category_name || "—"}
                          </td>

                          <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                            <div>{asset.brand || "—"}</div>

                            <div className="mt-1 text-xs text-slate-500">
                              {asset.model || "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                              <MapPin
                                size={15}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />

                              <div>
                                <div>
                                  {asset.building_name || "Building not specified"}
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {asset.department_name || "Department"}
                                  {asset.unit_name
                                    ? ` / ${asset.unit_name}`
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                asset.status
                              )}`}
                            >
                              {(asset.status || "UNKNOWN").replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                            {asset.condition || "—"}
                          </td>

                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                            {formatDate(asset.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="dashboard-card rounded-2xl border p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                          <Package size={22} />
                        </div>

                        <div className="min-w-0">
                          <h2 className="break-words font-semibold text-slate-900 dark:text-slate-100">
                            {asset.name || "Unnamed Asset"}
                          </h2>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {asset.asset_tag || "No asset tag"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${getStatusStyle(
                          asset.status
                        )}`}
                      >
                        {(asset.status || "UNKNOWN").replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-700">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 dark:text-slate-400">
                          Category
                        </span>

                        <span className="text-right text-slate-800 dark:text-slate-200">
                          {asset.category_name || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 dark:text-slate-400">
                          Brand / Model
                        </span>

                        <span className="text-right text-slate-800 dark:text-slate-200">
                          {[asset.brand, asset.model].filter(Boolean).join(" / ") || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 dark:text-slate-400">
                          Location
                        </span>

                        <span className="text-right text-slate-800 dark:text-slate-200">
                          {[asset.building_name, asset.department_name, asset.unit_name]
                            .filter(Boolean)
                            .join(" / ") || "Not specified"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 dark:text-slate-400">
                          Condition
                        </span>

                        <span className="text-right text-slate-800 dark:text-slate-200">
                          {asset.condition || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500 dark:text-slate-400">
                          Created
                        </span>

                        <span className="text-right text-slate-800 dark:text-slate-200">
                          {formatDate(asset.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}