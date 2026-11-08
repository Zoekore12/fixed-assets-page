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
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    building_id: "",
    name: "",
    code: "",
    description: "",
  });

  const loadDepartments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [departmentResponse, buildingResponse] = await Promise.all([
        api.get("/departments"),
        api.get("/buildings"),
      ]);

      const departmentResult =
        departmentResponse?.data ?? departmentResponse;
      const buildingResult = buildingResponse?.data ?? buildingResponse;

      if (departmentResult?.success === false) {
        throw new Error(
          departmentResult.message || "Unable to load departments."
        );
      }

      if (buildingResult?.success === false) {
        throw new Error(
          buildingResult.message || "Unable to load buildings."
        );
      }

      setDepartments(
        Array.isArray(departmentResult?.departments)
          ? departmentResult.departments
          : []
      );

      setBuildings(
        Array.isArray(buildingResult?.buildings)
          ? buildingResult.buildings
          : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load departments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError("");

        const [departmentResponse, buildingResponse] = await Promise.all([
          api.get("/departments"),
          api.get("/buildings"),
        ]);

        if (!ignore) {
          const departmentResult =
            departmentResponse?.data ?? departmentResponse;
          const buildingResult = buildingResponse?.data ?? buildingResponse;

          setDepartments(
            Array.isArray(departmentResult?.departments)
              ? departmentResult.departments
              : []
          );

          setBuildings(
            Array.isArray(buildingResult?.buildings)
              ? buildingResult.buildings
              : []
          );
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load departments and buildings."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return departments;

    return departments.filter((department) => {
      const building = buildings.find(
        (item) =>
          String(item.id) ===
          String(department.building_id ?? department.buildingId)
      );

      return [
        department.name,
        department.code,
        department.description,
        department.building_name,
        building?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [departments, buildings, search]);

  function getBuildingName(department) {
    if (department.building_name) return department.building_name;

    const buildingId =
      department.building_id ?? department.buildingId;

    const building = buildings.find(
      (item) => String(item.id) === String(buildingId)
    );

    return building?.name || "Unknown building";
  }

  function openCreateForm() {
    setEditingDepartment(null);
    setForm({
      building_id: "",
      name: "",
      code: "",
      description: "",
    });
    setNotice("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(department) {
    setEditingDepartment(department);
    setForm({
      building_id: String(
        department.building_id ?? department.buildingId ?? ""
      ),
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
    });
    setNotice("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingDepartment(null);
    setForm({
      building_id: "",
      name: "",
      code: "",
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

    const building_id = form.building_id;
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const description = form.description.trim();

    if (!building_id || !name || !code) {
      setError(
        "Building, department name, and department code are required."
      );
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        building_id,
        name,
        code,
        description: description || null,
      };

      if (editingDepartment) {
        await api.put(
          `/departments/${editingDepartment.id}`,
          payload
        );

        setNotice("Department updated successfully.");
      } else {
        await api.post("/departments", payload);

        setNotice("Department created successfully.");
      }

      setShowForm(false);
      setEditingDepartment(null);
      setForm({
        building_id: "",
        name: "",
        code: "",
        description: "",
      });

      await loadDepartments(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save the department."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(department) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(department.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/departments/${department.id}`);

      setNotice("Department deleted successfully.");

      await loadDepartments(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete the department."
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
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-blue-950 dark:text-blue-300">
                <Building2 size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Departments
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Organize and manage departments within buildings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadDepartments(true)}
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
            >
              <Plus size={17} />
              Add Department
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
                  Total Departments
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : departments.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Registered departments
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-blue-950 dark:text-blue-300">
                <Building2 size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Matching Departments
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : filteredDepartments.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Departments matching your search
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/950 dark:text-white">
                <Search size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Departments table */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">
                Department Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View, search, edit, or remove departments.
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
                placeholder="Search departments..."
                aria-label="Search departments"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading departments...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Building2 size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                {search.trim()
                  ? "No matching departments"
                  : "No departments yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim()
                  ? "Try a different search term."
                  : "Create your first department and assign it to an existing  building."}
              </p>

              {!search.trim() && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
                >
                  <FolderPlus size={17} />
                  Create Department
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Department Name
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Department Code
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Building
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Description
                      </th>

                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDepartments.map((department) => (
                      <tr
                        key={department.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/950 dark:text-white">
                              <Building2 size={19} />
                            </div>

                            <span className="font-semibold">
                              {department.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {department.code}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-500">
                          {getBuildingName(department)}
                        </td>

                        <td className="max-w-md px-5 py-4 text-slate-500">
                          {department.description || "No description provided"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(department)}
                              aria-label={`Edit ${department.name}`}
                              title="Edit department"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-900 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(department)}
                              disabled={deletingId === department.id}
                              aria-label={`Delete ${department.name}`}
                              title="Delete department"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                            >
                              {deletingId === department.id ? (
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
                Showing {filteredDepartments.length} of {departments.length} departments
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
              aria-labelledby="department-form-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="department-form-title"
                    className="text-lg font-bold"
                  >
                    {editingDepartment
                      ? "Edit Department"
                      : "Create Department"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the department details below.
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
                      htmlFor="department-building"
                      className="block text-sm font-semibold"
                    >
                      Building <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="department-building"
                      name="building_id"
                      value={form.building_id}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    >
                      <option value="">Select a building</option>

                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name} ({building.code})
                        </option>
                      ))}
                    </select>

                    {buildings.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No buildings available. Create a building before
                        creating a department.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="department-name"
                      className="block text-sm font-semibold"
                    >
                      Department Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="department-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="e.g. Information Technology"
                      maxLength={100}
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="department-code"
                      className="block text-sm font-semibold"
                    >
                      Department Code <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="department-code"
                      name="code"
                      type="text"
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="e.g. IT"
                      maxLength={30}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />

                    <p className="text-xs text-slate-500">
                      The code is saved in uppercase and must be unique within
                      the selected building.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="department-description"
                      className="block text-sm font-semibold"
                    >
                      Description
                    </label>

                    <textarea
                      id="department-description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Describe the department's responsibilities..."
                      rows={4}
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
                    disabled={saving || buildings.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}

                    {saving
                      ? "Saving..."
                      : editingDepartment
                      ? "Save Changes"
                      : "Create Department"}
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