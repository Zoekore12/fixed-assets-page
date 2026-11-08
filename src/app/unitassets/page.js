"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Package,
  RefreshCw,
  Search,
  Boxes,
} from "lucide-react";

import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function UnitAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/assets/unit-assets");

      setAssets(
        Array.isArray(response.data?.assets)
          ? response.data.assets
          : []
      );
    } catch (err) {
      console.error("Failed to load unit assets:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load assets for your unit. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter((asset) =>
        [
          asset.asset_tag,
          asset.name,
          asset.category_name,
          asset.serial_number,
          asset.brand,
          asset.model,
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

    return result;
  }, [assets, searchTerm, statusFilter]);

  const summary = useMemo(
    () => ({
      total: assets.length,
      assigned: assets.filter(
        (asset) => asset.status === "ASSIGNED"
      ).length,
      available: assets.filter(
        (asset) => asset.status === "AVAILABLE"
      ).length,
      maintenance: assets.filter(
        (asset) => asset.status === "MAINTENANCE"
      ).length,
    }),
    [assets]
  );

  const getStatusStyle = (status) => {
    const styles = {
      AVAILABLE:
        "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",

      ASSIGNED:
        "bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white",

      IN_TRANSIT:
        "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",

      OUT:
        "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",

      MAINTENANCE:
        "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",

      LOST:
        "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",

      DAMAGED:
        "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",

      RETIRED:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",

      DISPOSED:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",

      OBSOLETE:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    };

    return (
      styles[status] ||
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    );
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Unit Assets
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and monitor assets belonging to your unit.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAssets}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-medium">
                Unable to retrieve unit assets
              </p>

              <p className="mt-1">{error}</p>
            </div>

            <button
              type="button"
              onClick={loadAssets}
              className="text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Unit Assets"
            value={loading ? "—" : summary.total}
            icon={<Package size={23} />}
            iconStyle="bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white"
          />

          <SummaryCard
            title="Assigned"
            value={loading ? "—" : summary.assigned}
            icon={<Boxes size={23} />}
            iconStyle="bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white"
          />

          <SummaryCard
            title="Available"
            value={loading ? "—" : summary.available}
            icon={<Package size={23} />}
            iconStyle="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
          />

          <SummaryCard
            title="Under Maintenance"
            value={loading ? "—" : summary.maintenance}
            icon={<AlertTriangle size={23} />}
            iconStyle="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
          />
        </div>

        {/* Asset List */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          {/* Inventory Header and Filters */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Unit Asset Inventory
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredAssets.length}{" "}
                  {filteredAssets.length === 1 ? "asset" : "assets"} found
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
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search unit assets..."
                    aria-label="Search unit assets"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-72"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  aria-label="Filter assets by status"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="ALL">All statuses</option>
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
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <RefreshCw size={20} className="animate-spin" />
              Loading unit assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Package size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No assets found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {assets.length === 0
                  ? "There are currently no assets associated with your unit."
                  : "No assets match your search or selected status."}
              </p>

              {(searchTerm || statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                  }}
                  className="mt-4 text-sm font-medium text-[#1597E5] transition hover:text-[#117FC2]"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <TableHeading>Asset</TableHeading>
                      <TableHeading>Category</TableHeading>
                      <TableHeading>Serial Number</TableHeading>
                      <TableHeading>Location</TableHeading>
                      <TableHeading>Status</TableHeading>
                      <TableHeading>Condition</TableHeading>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                              <Package size={19} />
                            </div>

                            <div>
                              <p className="font-semibold">
                                {asset.name || "Unnamed asset"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Tag: {asset.asset_tag || "N/A"}
                              </p>

                              {(asset.brand || asset.model) && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {[asset.brand, asset.model]
                                    .filter(Boolean)
                                    .join(" ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {asset.category_name || "N/A"}
                        </td>

                        <td className="px-5 py-4">
                          {asset.serial_number || "N/A"}
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <p>{asset.building_name || "N/A"}</p>

                          <p className="mt-1 text-xs text-slate-500">
                            {asset.department_name || "No department"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {asset.unit_name || "No unit"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                              getStatusStyle(asset.status)
                            }`}
                          >
                            {(asset.status || "UNKNOWN").replaceAll(
                              "_",
                              " "
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {asset.condition || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="grid grid-cols-1 gap-4 p-5 md:hidden">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                          <Package size={19} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="break-words font-semibold">
                            {asset.name || "Unnamed asset"}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {asset.asset_tag || "No asset tag"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          getStatusStyle(asset.status)
                        }`}
                      >
                        {(asset.status || "UNKNOWN").replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <MobileDetail
                        label="Category"
                        value={asset.category_name}
                      />

                      <MobileDetail
                        label="Serial Number"
                        value={asset.serial_number}
                      />

                      <MobileDetail
                        label="Building"
                        value={asset.building_name}
                      />

                      <MobileDetail
                        label="Department"
                        value={asset.department_name}
                      />

                      <MobileDetail
                        label="Unit"
                        value={asset.unit_name}
                      />

                      <MobileDetail
                        label="Condition"
                        value={asset.condition}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Inventory Footer */}
          {!loading && filteredAssets.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
              Showing {filteredAssets.length} of {assets.length} unit assets
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

function SummaryCard({ title, value, icon, iconStyle }) {
  return (
    <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Unit asset records
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHeading({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-4 font-semibold">
      {children}
    </th>
  );
}

function MobileDetail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-slate-500">
        {label}
      </span>

      <span className="break-words text-right font-medium">
        {value || "N/A"}
      </span>
    </div>
  );
}