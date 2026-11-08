"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Check,
  Edit3,
  FolderPlus,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    description: "",
  });

  const loadBuildings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/buildings");

        if (!ignore) {
          const result = response?.data ?? response;
          setBuildings(
            Array.isArray(result?.buildings) ? result.buildings : []
          );
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load buildings."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchBuildings();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredBuildings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return buildings;

    return buildings.filter((building) =>
      [
        building.name,
        building.code,
        building.address,
        building.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [buildings, search]);

  function openCreateForm() {
    setEditingBuilding(null);
    setForm({
      name: "",
      code: "",
      address: "",
      description: "",
    });
    setNotice("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(building) {
    setEditingBuilding(building);
    setForm({
      name: building.name || "",
      code: building.code || "",
      address: building.address || "",
      description: building.description || "",
    });
    setNotice("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingBuilding(null);
    setForm({
      name: "",
      code: "",
      address: "",
      description: "",
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

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const address = form.address.trim();
    const description = form.description.trim();

    if (!name || !code) {
      setError("Building name and code are required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        name,
        code,
        address: address || null,
        description: description || null,
      };

      if (editingBuilding) {
        await api.put(`/buildings/${editingBuilding.id}`, payload);
        setNotice("Building updated successfully.");
      } else {
        await api.post("/buildings", payload);
        setNotice("Building created successfully.");
      }

      setShowForm(false);
      setEditingBuilding(null);
      setForm({
        name: "",
        code: "",
        address: "",
        description: "",
      });

      await loadBuildings(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save the building."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(building) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${building.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(building.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/buildings/${building.id}`);

      setNotice("Building deleted successfully.");

      await loadBuildings(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete the building."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Building2 size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Buildings
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create and manage buildings across your ministry.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadBuildings(true)}
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] dark:bg-[#1597E5] dark:hover:bg-[#117FC2]"
            >
              <Plus size={17} />
              Add Building
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
                <p className="text-sm text-slate-500">Total Buildings</p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : buildings.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Registered ministry buildings
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Building2 size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Matching Buildings</p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : filteredBuildings.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Buildings matching your search
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Search size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Buildings table */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">Building Directory</h2>

              <p className="mt-1 text-sm text-slate-500">
                View, search, edit, or remove ministry buildings.
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
                placeholder="Search buildings..."
                aria-label="Search buildings"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading buildings...
            </div>
          ) : filteredBuildings.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Building2 size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                {search.trim()
                  ? "No matching buildings"
                  : "No buildings yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim()
                  ? "Try a different search term."
                  : "Create your first building to begin organizing ministry departments and units."}
              </p>

              {!search.trim() && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] dark:bg-[#1597E5] dark:hover:bg-[#117FC2]"
                >
                  <FolderPlus size={17} />
                  Create Building
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Building</th>
                      <th className="px-5 py-4 font-semibold">Building Code</th>
                      <th className="px-5 py-4 font-semibold">Address</th>
                      <th className="px-5 py-4 font-semibold">Description</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBuildings.map((building) => (
                      <tr
                        key={building.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                              <Building2 size={19} />
                            </div>

                            <span className="font-semibold">
                              {building.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {building.code}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {building.address ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={14} className="shrink-0" />
                              {building.address}
                            </span>
                          ) : (
                            "No address provided"
                          )}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-500">
                          {building.description || "No description provided"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(building)}
                              aria-label={`Edit ${building.name}`}
                              title="Edit building"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5] hover:bg-[#1597E5] hover:text-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5] dark:hover:bg-[#1597E5] dark:hover:text-white"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(building)}
                              disabled={deletingId === building.id}
                              aria-label={`Delete ${building.name}`}
                              title="Delete building"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                            >
                              {deletingId === building.id ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={16} />
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
                Showing {filteredBuildings.length} of {buildings.length} buildings
              </div>
            </>
          )}
        </div>

        {/* Create / Edit modal */}
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
              aria-labelledby="building-form-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="building-form-title"
                    className="text-lg font-bold"
                  >
                    {editingBuilding ? "Edit Building" : "Create Building"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the building details below.
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
                      htmlFor="building-name"
                      className="block text-sm font-semibold"
                    >
                      Building Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="building-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="e.g. Ministry Headquarters"
                      maxLength={150}
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="building-code"
                      className="block text-sm font-semibold"
                    >
                      Building Code <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="building-code"
                      name="code"
                      type="text"
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="e.g. HQ-001"
                      maxLength={30}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />

                    <p className="text-xs text-slate-500">
                      Building codes are saved in uppercase and must be unique.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="building-address"
                      className="block text-sm font-semibold"
                    >
                      Address
                    </label>

                    <input
                      id="building-address"
                      name="address"
                      type="text"
                      value={form.address}
                      onChange={handleFormChange}
                      placeholder="e.g. Central Business District, Abuja"
                      maxLength={300}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="building-description"
                      className="block text-sm font-semibold"
                    >
                      Description
                    </label>

                    <textarea
                      id="building-description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Describe this building..."
                      rows={3}
                      maxLength={500}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />

                    <p className="text-right text-xs text-slate-400">
                      {form.description.length}/500 characters
                    </p>
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}

                    {saving
                      ? "Saving..."
                      : editingBuilding
                      ? "Save Changes"
                      : "Create Building"}
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