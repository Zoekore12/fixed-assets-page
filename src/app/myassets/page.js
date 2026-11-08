
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function MyAssetsPage() {
  const router = useRouter();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // GET PERSONAL ASSETS
  const fetchMyAssets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/assets/my-assets");
      const result = response?.data;

      if (result?.success === false) {
        setError(result?.message || "Unable to retrieve your assets.");
        setAssets([]);
        return;
      }

      setAssets(Array.isArray(result?.assets) ? result.assets : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Get my assets error:", err);
      setError(getErrorMessage(err));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMyAssets();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchMyAssets]);

  // FILTER ASSETS
  const filteredAssets = assets.filter((asset) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    return [
      asset.name,
      asset.asset_tag,
      asset.serial_number,
      asset.brand,
      asset.model,
      asset.category_name,
      asset.building_name,
      asset.department_name,
      asset.unit_name,
      asset.status,
      asset.condition,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // STATUS BADGE
  const getStatusStyle = (status) => {
    const normalizedStatus = String(status || "").toUpperCase();

    switch (normalizedStatus) {
      case "ASSIGNED":
        return "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300";

      case "AVAILABLE":
        return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";

      case "IN_TRANSIT":
        return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";

      case "OUT":
        return "border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300";

      case "MAINTENANCE":
        return "border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300";

      case "LOST":
      case "DAMAGED":
        return "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";

      default:
        return "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white">
                <Package size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                  My Assets
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  View assets currently assigned to you.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMyAssets}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh Assets
          </button>
        </div>

        {/* INFORMATION BANNER */}
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/30">
          <div className="flex items-start gap-3">
            <Package
              className="mt-0.5 shrink-0 text-[#1597E5] dark:text-sky-400"
              size={21}
            />

            <div>
              <h2 className="font-semibold text-sky-900 dark:text-sky-300">
                Your Assigned Equipment
              </h2>

              <p className="mt-1 text-sm leading-6 text-sky-800 dark:text-sky-200">
                This page displays the assets returned by the system for your
                authenticated account. Contact your administrator if an
                assigned asset is missing.
              </p>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  My Assigned Assets
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {loading ? "—" : assets.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white">
                <Package size={24} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Search Results
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {loading ? "—" : filteredAssets.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Search size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label
            htmlFor="asset-search"
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Search Your Assets
          </label>

          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="asset-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by asset name, tag, serial number, or location..."
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-sky-950"
            />
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            <XCircle size={21} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Unable to Load Your Assets</p>
              <p className="mt-1 text-sm">{error}</p>

              <button
                type="button"
                onClick={fetchMyAssets}
                className="mt-3 text-sm font-semibold underline underline-offset-4 hover:text-red-950 dark:hover:text-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ASSET LIST */}
        <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Assigned Asset Records
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Equipment currently associated with your account.
              </p>
            </div>

            {lastUpdated && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Loader2
                size={32}
                className="animate-spin text-[#1597E5]"
              />

              <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
                Loading your assets...
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Please wait while we retrieve your assigned equipment.
              </p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <Package
                size={32}
                className="mx-auto text-slate-300 dark:text-slate-600"
              />

              <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">
                Your assets could not be displayed.
              </p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Package size={27} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
                {assets.length === 0
                  ? "No Assigned Assets"
                  : "No Matching Assets"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {assets.length === 0
                  ? "There are currently no active assets assigned to your account."
                  : "No assets match your search. Try another asset name, tag, serial number, or location."}
              </p>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-sm font-semibold text-[#1597E5] hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Asset</th>
                      <th className="px-6 py-4 font-semibold">Asset Tag</th>
                      <th className="px-6 py-4 font-semibold">Location</th>
                      <th className="px-6 py-4 font-semibold">Assigned Date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Condition</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1597E5] text-white">
                              <Package size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {asset.name || "Unnamed Asset"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {[asset.brand, asset.model]
                                  .filter(Boolean)
                                  .join(" ") || "No brand/model provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                            <Tag size={15} className="text-slate-400" />
                            {asset.asset_tag || "Not available"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin
                              size={16}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />

                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {asset.building_name || "Building not provided"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {[
                                  asset.department_name,
                                  asset.unit_name,
                                ]
                                  .filter(Boolean)
                                  .join(" / ") || "No department or unit"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />
                            {formatDate(asset.assigned_at)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              asset.status
                            )}`}
                          >
                            {asset.status || "Unknown"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {asset.condition || "Not specified"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="space-y-4 p-4 md:hidden">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-950/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1597E5] text-white">
                        <Package size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-bold text-slate-900 dark:text-slate-100">
                          {asset.name || "Unnamed Asset"}
                        </h3>

                        <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">
                          {asset.asset_tag || "No asset tag"}
                        </p>

                        <span
                          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            asset.status
                          )}`}
                        >
                          {asset.status || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm dark:border-slate-700">
                      <div className="flex items-start gap-2">
                        <Building2
                          size={17}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Location
                          </p>

                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {asset.building_name || "Building not provided"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {[
                              asset.department_name,
                              asset.unit_name,
                            ]
                              .filter(Boolean)
                              .join(" / ") || "No department or unit"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <CalendarDays
                          size={17}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Assigned Date
                          </p>

                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {formatDate(asset.assigned_at)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Condition
                        </p>

                        <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                          {asset.condition || "Not specified"}
                        </p>
                      </div>

                      {(asset.brand || asset.model) && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Brand / Model
                          </p>

                          <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                            {[asset.brand, asset.model]
                              .filter(Boolean)
                              .join(" ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TABLE FOOTER */}
          {!loading && !error && filteredAssets.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 sm:px-6">
              Showing{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {filteredAssets.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {assets.length}
              </span>{" "}
              assigned assets
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
