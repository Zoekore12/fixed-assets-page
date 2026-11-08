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
  Layers3,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    department_id: "",
    name: "",
    code: "",
    description: "",
  });

  const loadUnits = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/units");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(result.message || "Unable to load units.");
      }

      setUnits(Array.isArray(result?.units) ? result.units : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load units."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(result.message || "Unable to load departments.");
      }

      setDepartments(
        Array.isArray(result?.departments) ? result.departments : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load departments."
      );
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [unitsResponse, departmentsResponse] = await Promise.all([
          api.get("/units"),
          api.get("/departments"),
        ]);

        if (ignore) return;

        const unitsResult = unitsResponse?.data ?? unitsResponse;
        const departmentsResult =
          departmentsResponse?.data ?? departmentsResponse;

        if (unitsResult?.success === false) {
          throw new Error(
            unitsResult.message || "Unable to load units."
          );
        }

        if (departmentsResult?.success === false) {
          throw new Error(
            departmentsResult.message || "Unable to load departments."
          );
        }

        setUnits(
          Array.isArray(unitsResult?.units) ? unitsResult.units : []
        );

        setDepartments(
          Array.isArray(departmentsResult?.departments)
            ? departmentsResult.departments
            : []
        );
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load units."
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

  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return units.filter((unit) => {
      const departmentId =
        unit.department_id ??
        unit.departmentId ??
        unit.department?.id ??
        "";

      const departmentName =
        unit.department_name ??
        unit.departmentName ??
        unit.department?.name ??
        departments.find((department) => department.id === departmentId)
          ?.name ??
        "";

      const matchesDepartment =
        !departmentFilter || departmentId === departmentFilter;

      const matchesSearch =
        !query ||
        [
          unit.name,
          unit.code,
          unit.description,
          departmentName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesDepartment && matchesSearch;
    });
  }, [units, departments, search, departmentFilter]);

  function openCreateForm() {
    setEditingUnit(null);
    setForm({
      department_id: departmentFilter || "",
      name: "",
      code: "",
      description: "",
    });
    setNotice("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(unit) {
    setEditingUnit(unit);
    setForm({
      department_id:
        unit.department_id ??
        unit.departmentId ??
        unit.department?.id ??
        "",
      name: unit.name || "",
      code: unit.code || "",
      description: unit.description || "",
    });
    setNotice("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingUnit(null);
    setForm({
      department_id: "",
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

    const department_id = form.department_id;
    const name = form.name.trim();
    const code = form.code.trim();
    const description = form.description.trim();

    if (!department_id) {
      setError("Please select a department.");
      return;
    }

    if (!name) {
      setError("Unit name is required.");
      return;
    }

    if (!code) {
      setError("Unit code is required.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        department_id,
        name,
        code: code.toUpperCase(),
        description: description || null,
      };

      if (editingUnit) {
        await api.put(`/units/${editingUnit.id}`, payload);

        setNotice("Unit updated successfully.");
      } else {
        await api.post("/units", payload);

        setNotice("Unit created successfully.");
      }

      setShowForm(false);
      setEditingUnit(null);
      setForm({
        department_id: "",
        name: "",
        code: "",
        description: "",
      });

      await Promise.all([loadUnits(true), loadDepartments()]);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save the unit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(unit) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${unit.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(unit.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/units/${unit.id}`);

      setNotice("Unit deleted successfully.");

      await loadUnits(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete the unit."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function getDepartmentName(unit) {
    const departmentId =
      unit.department_id ??
      unit.departmentId ??
      unit.department?.id;

    return (
      unit.department_name ||
      unit.departmentName ||
      unit.department?.name ||
      departments.find((department) => department.id === departmentId)
        ?.name ||
      "Unknown department"
    );
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Layers3 size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Units
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Organize and manage units within your ministry departments.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                Promise.all([loadUnits(true), loadDepartments()])
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
            >
              <Plus size={17} />
              Add Unit
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
                <p className="text-sm text-slate-500">Total Units</p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : units.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Registered organizational units
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white  dark:bg-[#1597E5] dark:text-white">
                <Layers3 size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">
                  Matching Units
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : filteredUnits.length}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Units matching your search and filters
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Search size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Units table */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">Unit Directory</h2>

              <p className="mt-1 text-sm text-slate-500">
                View, search, edit, or remove organizational units.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:max-w-xl sm:flex-row">
              <div className="relative w-full sm:flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search units..."
                  aria-label="Search units"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(event.target.value)
                }
                aria-label="Filter by department"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-[220px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              >
                <option value="">All Departments</option>

                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading units...
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Layers3 size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                {search.trim() || departmentFilter
                  ? "No matching units"
                  : "No units yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim() || departmentFilter
                  ? "Try a different search term or department filter."
                  : "Create your first unit under an existing department."}
              </p>

              {!search.trim() && !departmentFilter && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
                >
                  <FolderPlus size={17} />
                  Create Unit
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Unit Name
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Unit Code
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Department
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
                    {filteredUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]dark:text-white">
                              <Layers3 size={19} />
                            </div>

                            <span className="font-semibold">
                              {unit.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {unit.code}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <Building2
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            {getDepartmentName(unit)}
                          </div>
                        </td>

                        <td className="max-w-md px-5 py-4 text-slate-500">
                          {unit.description || "No description provided"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(unit)}
                              aria-label={`Edit ${unit.name}`}
                              title="Edit unit"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5]/50 hover:bg-[#1597E5] hover:text-[#1597E5] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5] dark:hover:bg-[#1597E5]/950 dark:hover:text-[#1597E5]/950"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(unit)}
                              disabled={deletingId === unit.id}
                              aria-label={`Delete ${unit.name}`}
                              title="Delete unit"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                            >
                              {deletingId === unit.id ? (
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
                Showing {filteredUnits.length} of {units.length} units
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
              aria-labelledby="unit-form-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="unit-form-title"
                    className="text-lg font-bold"
                  >
                    {editingUnit ? "Edit Unit" : "Create Unit"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the unit details below.
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
                      htmlFor="unit-department"
                      className="block text-sm font-semibold"
                    >
                      Department <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="unit-department"
                      name="department_id"
                      value={form.department_id}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    >
                      <option value="">Select a department</option>

                      {departments.map((department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                          {department.code ? ` (${department.code})` : ""}
                        </option>
                      ))}
                    </select>

                    {departments.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        No departments found. Create a department before
                        creating a unit.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="unit-name"
                      className="block text-sm font-semibold"
                    >
                      Unit Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="unit-name"
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
                      htmlFor="unit-code"
                      className="block text-sm font-semibold"
                    >
                      Unit Code <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="unit-code"
                      name="code"
                      type="text"
                      value={form.code}
                      onChange={handleFormChange}
                      placeholder="e.g. IT-001"
                      maxLength={50}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />

                    <p className="text-xs text-slate-400">
                      The unit code will be saved in uppercase.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="unit-description"
                      className="block text-sm font-semibold"
                    >
                      Description
                    </label>

                    <textarea
                      id="unit-description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Describe the responsibilities of this unit..."
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
                    disabled={saving || departments.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Check size={17} />
                    )}

                    {saving
                      ? "Saving..."
                      : editingUnit
                      ? "Save Changes"
                      : "Create Unit"}
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