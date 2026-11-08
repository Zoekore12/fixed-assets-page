"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Check,
  Edit3,
  FolderPlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function SecurityStationsPage() {
  const [stations, setStations] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    station_code: "",
    name: "",
    building_id: "",
    is_active: true,
  });

  const loadStations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/station/station");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load security stations."
        );
      }

      setStations(
        Array.isArray(result?.stations) ? result.stations : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load security stations."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadBuildings = useCallback(async () => {
    try {
      const response = await api.get("/buildings");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(result.message || "Unable to load buildings.");
      }

      setBuildings(
        Array.isArray(result?.buildings) ? result.buildings : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load buildings."
      );
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [stationsResponse, buildingsResponse] = await Promise.all([
          api.get("/station/station"),
          api.get("/buildings"),
        ]);

        if (ignore) return;

        const stationsResult =
          stationsResponse?.data ?? stationsResponse;
        const buildingsResult =
          buildingsResponse?.data ?? buildingsResponse;

        if (stationsResult?.success === false) {
          throw new Error(
            stationsResult.message || "Unable to load security stations."
          );
        }

        if (buildingsResult?.success === false) {
          throw new Error(
            buildingsResult.message || "Unable to load buildings."
          );
        }

        setStations(
          Array.isArray(stationsResult?.stations)
            ? stationsResult.stations
            : []
        );

        setBuildings(
          Array.isArray(buildingsResult?.buildings)
            ? buildingsResult.buildings
            : []
        );
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load security stations."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredStations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return stations;

    return stations.filter((station) => {
      const buildingName =
        station.building_name ??
        station.buildingName ??
        station.building?.name ??
        buildings.find(
          (building) =>
            building.id ===
            (station.building_id ??
              station.buildingId ??
              station.building?.id)
        )?.name ??
        "";

      return [
        station.station_code,
        station.name,
        buildingName,
        station.is_active ? "active" : "inactive",
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [stations, buildings, search]);

  function openCreateForm() {
    setForm({
      station_code: "",
      name: "",
      building_id: "",
      is_active: true,
    });

    setNotice("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setForm({
      station_code: "",
      name: "",
      building_id: "",
      is_active: true,
    });
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const station_code = form.station_code.trim();
    const name = form.name.trim();
    const building_id = form.building_id;

    if (!station_code) {
      setError("Station code is required.");
      return;
    }

    if (!name) {
      setError("Station name is required.");
      return;
    }

    if (!building_id) {
      setError("Please select a building.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        station_code: station_code.toUpperCase(),
        name,
        building_id,
        is_active: form.is_active,
      };

      await api.post("/station", payload);

      setNotice("Security station created successfully.");

      setShowForm(false);
      setForm({
        station_code: "",
        name: "",
        building_id: "",
        is_active: true,
      });

      await Promise.all([
        loadStations(true),
        loadBuildings(),
      ]);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create the security station."
      );
    } finally {
      setSaving(false);
    }
  }

  function getBuildingName(station) {
    const buildingId =
      station.building_id ??
      station.buildingId ??
      station.building?.id;

    return (
      station.building_name ||
      station.buildingName ||
      station.building?.name ||
      buildings.find((building) => building.id === buildingId)?.name ||
      "Unknown building"
    );
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/80 dark:text-white">
                <ShieldCheck size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Security Stations
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create and manage security stations assigned to ministry
                  buildings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                Promise.all([
                  loadStations(true),
                  loadBuildings(),
                ])
              }
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
              Add Station
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
                  Total Stations
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : stations.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Registered security stations
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/80 dark:text-white">
                <ShieldCheck size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Matching Stations
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : filteredStations.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Stations matching your search
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/80 dark:text-white">
                <Search size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Security stations table */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Security Station Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and search security stations assigned to buildings.
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
                placeholder="Search stations..."
                aria-label="Search security stations"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading security stations...
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <ShieldCheck size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                {search.trim()
                  ? "No matching stations"
                  : "No security stations yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim()
                  ? "Try a different search term."
                  : "Create your first security station and assign it to a building."}
              </p>

              {!search.trim() && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]/80"
                >
                  <FolderPlus size={17} />
                  Create Station
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Station Name
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Station Code
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Building
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStations.map((station) => (
                      <tr
                        key={station.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/80 dark:text-white">
                              <ShieldCheck size={19} />
                            </div>

                            <span className="font-semibold">
                              {station.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {station.station_code ||
                              station.stationCode ||
                              "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Building2
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            {getBuildingName(station)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              station.is_active
                                ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {station.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredStations.length} of {stations.length} stations
              </div>
            </>
          )}
        </div>

        {/* Create Security Station modal */}
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
              aria-labelledby="station-form-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="station-form-title"
                    className="text-lg font-bold"
                  >
                    Create Security Station
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the security station details below.
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
                    <label
                      htmlFor="station-code"
                      className="block text-sm font-semibold"
                    >
                      Station Code <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="station-code"
                      name="station_code"
                      type="text"
                      value={form.station_code}
                      onChange={handleFormChange}
                      placeholder="e.g. SEC-001"
                      maxLength={50}
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />

                    <p className="text-xs text-slate-400">
                      The station code will be saved in uppercase.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="station-name"
                      className="block text-sm font-semibold"
                    >
                      Station Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="station-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="e.g. Main Entrance Security Station"
                      maxLength={100}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="station-building"
                      className="block text-sm font-semibold"
                    >
                      Building <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="station-building"
                      name="building_id"
                      value={form.building_id}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    >
                      <option value="">Select a building</option>

                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name}
                          {building.code ? ` (${building.code})` : ""}
                        </option>
                      ))}
                    </select>

                    {buildings.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No buildings found. Create a building before
                        creating a security station.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div>
                      <label
                        htmlFor="station-active"
                        className="text-sm font-semibold"
                      >
                        Active Station
                      </label>

                      <p className="mt-1 text-xs text-slate-500">
                        Enable this station for use.
                      </p>
                    </div>

                    <input
                      id="station-active"
                      name="is_active"
                      type="checkbox"
                      checked={form.is_active}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded border-slate-300 text-[#1597E5] focus:ring-[#1597E5]"
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
                    disabled={saving || buildings.length === 0}
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

                    {saving ? "Saving..." : "Create Station"}
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