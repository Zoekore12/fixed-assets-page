"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Edit3,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "Staff",
  staff_type: "GENERAL",
  department_id: "",
  unit_id: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [password, setPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/users");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(result.message || "Unable to load users.");
      }

      setUsers(Array.isArray(result?.users) ? result.users : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchUsers() {
      try {
        const response = await api.get("/users");
        const result = response?.data ?? response;

        if (result?.success === false) {
          throw new Error(result.message || "Unable to load users.");
        }

        if (!ignore) {
          setUsers(Array.isArray(result?.users) ? result.users : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load users."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchOrganizationData() {
      try {
        const [departmentResponse, unitResponse] = await Promise.all([
          api.get("/departments"),
          api.get("/units"),
        ]);

        const departmentResult =
          departmentResponse?.data ?? departmentResponse;
        const unitResult = unitResponse?.data ?? unitResponse;

        if (!ignore) {
          setDepartments(
            Array.isArray(departmentResult?.departments)
              ? departmentResult.departments
              : Array.isArray(departmentResult?.data)
              ? departmentResult.data
              : []
          );

          setUnits(
            Array.isArray(unitResult?.units)
              ? unitResult.units
              : Array.isArray(unitResult?.data)
              ? unitResult.data
              : []
          );
        }
      } catch {
        // User management remains usable if organization lists cannot load.
      }
    }

    fetchOrganizationData();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [
          user.name,
          user.email,
          user.phone,
          user.role,
          user.staff_type,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.is_active === true) ||
        (statusFilter === "INACTIVE" && user.is_active === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const availableUnits = useMemo(() => {
    if (!form.department_id) return units;

    return units.filter(
      (unit) => unit.department_id === form.department_id
    );
  }, [units, form.department_id]);

  function openCreateForm(privileged = false) {
    setEditingUser(null);
    setForm({
      ...EMPTY_FORM,
      role: privileged ? "HOD" : "Staff",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function openEditForm(user) {
    setEditingUser(user);
    setForm({
      ...EMPTY_FORM,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "Staff",
      staff_type: user.staff_type || "GENERAL",
      department_id: user.department_id || "",
      unit_id: user.unit_id || "",
    });
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "department_id" ? { unit_id: "" } : {}),
      ...(name === "role" && value === "HOD" ? { unit_id: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }

    if (!editingUser && form.password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    if (!editingUser && form.role === "HOD" && !form.department_id) {
      setError("HOD users must be assigned to a department.");
      return;
    }

    if (
      !editingUser &&
      form.role === "HOU" &&
      (!form.department_id || !form.unit_id)
    ) {
      setError("HOU users must be assigned to a department and unit.");
      return;
    }

    if (
      !editingUser &&
      form.role === "HOD" &&
      form.unit_id
    ) {
      setError("HOD users cannot be assigned to a specific unit.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingUser) {
        const payload = {
          name,
          email,
          phone: form.phone.trim() || null,
          staff_type: form.staff_type,
          department_id: form.department_id || null,
          unit_id: form.unit_id || null,
        };

        await api.put(`/users/${editingUser.id}`, payload);
        setNotice("User updated successfully.");
      } else {
        const payload = {
          name,
          email,
          password: form.password,
          phone: form.phone.trim() || null,
          staff_type: form.staff_type,
          department_id: form.department_id || null,
          unit_id: form.unit_id || null,
        };

        if (form.role === "Staff") {
          await api.post("/users", payload);
          setNotice("Staff user created successfully.");
        } else {
          await api.post("/users/privileged", {
            ...payload,
            role: form.role,
          });
          setNotice(`${form.role} user created successfully.`);
        }
      }

      setShowForm(false);
      setEditingUser(null);
      setForm(EMPTY_FORM);

      await loadUsers(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save the user."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(user) {
    const action = user.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}'s account?`
    );

    if (!confirmed) return;

    setChangingStatusId(user.id);
    setError("");
    setNotice("");

    try {
      await api.patch(`/users/${user.id}/${action}`);

      setNotice(
        `User account ${user.is_active ? "deactivated" : "activated"} successfully.`
      );

      await loadUsers(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Unable to ${action} this account.`
      );
    } finally {
      setChangingStatusId(null);
    }
  }

  function openPasswordForm(user) {
    setPasswordUser(user);
    setPassword("");
    setError("");
    setNotice("");
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setUpdatingPassword(true);
    setError("");
    setNotice("");

    try {
      await api.patch(`/users/${passwordUser.id}/password`, {
        password,
      });

      setNotice(`Password updated successfully for ${passwordUser.name}.`);
      setPasswordUser(null);
      setPassword("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update the password."
      );
    } finally {
      setUpdatingPassword(false);
    }
  }

  const activeCount = users.filter((user) => user.is_active === true).length;
  const inactiveCount = users.filter((user) => user.is_active === false).length;

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/20 dark:text-white">
              <Users size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                User Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage ministry users, roles, organizational assignments, and accounts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadUsers(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => openCreateForm(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
            >
              <UserPlus size={17} />
              Add Staff
            </button>

            <button
              type="button"
              onClick={() => openCreateForm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#1597E5] bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] dark:border-[#1597E5] dark:bg-[#1597E5] dark:text-[#1597E5] dark:hover:bg-[#1597E5]"
            >
              <UserPlus size={17} />
              Add HOD / HOU
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
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
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
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : users.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">Registered accounts</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Users size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Active Accounts</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : activeCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">Accounts enabled</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300">
                <UserCheck size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Inactive Accounts</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : inactiveCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">Accounts disabled</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300">
                <UserX size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* User directory */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">User Directory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search accounts and manage their access.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, role..."
                  aria-label="Search users"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter by role"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">All roles</option>
                <option value="Administrator">Administrator</option>
                <option value="HOD">HOD</option>
                <option value="HOU">HOU</option>
                <option value="Staff">Staff</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by account status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">All account statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Users size={27} />
              </div>
              <h3 className="mt-4 text-base font-semibold">No users found</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">User</th>
                      <th className="px-5 py-4 font-semibold">Role / Type</th>
                      <th className="px-5 py-4 font-semibold">Department / Unit</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                              <UserCog size={19} />
                            </div>
                            <div>
                              <p className="font-semibold">{user.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                              {user.phone && (
                                <p className="mt-1 text-xs text-slate-400">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">{user.role}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {user.staff_type || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>{user.department_name || "—"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {user.unit_name || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              user.is_active
                                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(user)}
                              aria-label={`Edit ${user.name}`}
                              title="Edit user"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5] hover:bg-[#1597E5]/10 hover:text-[#1597E5] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5] dark:hover:bg-[#1597E5] dark:hover:text-[#1597E5]"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openPasswordForm(user)}
                              aria-label={`Update password for ${user.name}`}
                              title="Update password"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5] hover:bg-[#1597E5]/10 hover:text-[#1597E5] dark:border-slate-700 dark:text-slate-300 dark:hover:border-[#1597E5] dark:hover:bg-[#1597E5] dark:hover:text-[#1597E5]"
                            >
                              <KeyRound size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(user)}
                              disabled={changingStatusId === user.id}
                              aria-label={`${user.is_active ? "Deactivate" : "Activate"} ${user.name}`}
                              title={user.is_active ? "Deactivate user" : "Activate user"}
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border disabled:opacity-50 ${
                                user.is_active
                                  ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                                  : "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-300 dark:hover:bg-green-950"
                              }`}
                            >
                              {changingStatusId === user.id ? (
                                <LoaderCircle size={16} className="animate-spin" />
                              ) : user.is_active ? (
                                <UserX size={16} />
                              ) : (
                                <UserCheck size={16} />
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
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </>
          )}
        </div>

        {/* Create / Edit user modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForm();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-form-title"
              className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="user-form-title" className="text-lg font-bold">
                    {editingUser ? "Edit User" : "Create User"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingUser
                      ? "Update the user's account and organizational details."
                      : "Enter the account details and assign the appropriate role."}
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="user-name" className="block text-sm font-semibold">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="user-name"
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        placeholder="e.g. John Doe"
                        maxLength={150}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="user-email" className="block text-sm font-semibold">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="user-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleFormChange}
                        placeholder="user@example.com"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                      />
                    </div>

                    {!editingUser && (
                      <div className="space-y-2 sm:col-span-2">
                        <label htmlFor="user-password" className="block text-sm font-semibold">
                          Initial Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="user-password"
                          name="password"
                          type="password"
                          value={form.password}
                          onChange={handleFormChange}
                          minLength={12}
                          autoComplete="new-password"
                          placeholder="At least 12 characters"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                        />
                        <p className="text-xs text-slate-500">
                          Your backend requires at least 12 characters for new accounts.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="user-phone" className="block text-sm font-semibold">
                        Phone Number
                      </label>
                      <input
                        id="user-phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleFormChange}
                        placeholder="+2348012345678"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="user-role" className="block text-sm font-semibold">
                        Role
                      </label>
                      <select
                        id="user-role"
                        name="role"
                        value={form.role}
                        onChange={handleFormChange}
                        disabled={!!editingUser}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Staff">Staff</option>
                        <option value="HOD">HOD</option>
                        <option value="HOU">HOU</option>
                      </select>
                      {editingUser && (
                        <p className="text-xs text-slate-500">
                          The existing role is preserved by your backend.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="user-staff-type" className="block text-sm font-semibold">
                        Staff Type
                      </label>
                      <select
                        id="user-staff-type"
                        name="staff_type"
                        value={form.staff_type}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="GENERAL">GENERAL</option>
                        <option value="SECURITY">SECURITY</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="user-department" className="block text-sm font-semibold">
                        Department
                        {form.role === "HOD" || form.role === "HOU" ? (
                          <span className="text-red-500"> *</span>
                        ) : null}
                      </label>
                      <select
                        id="user-department"
                        name="department_id"
                        value={form.department_id}
                        onChange={handleFormChange}
                        required={!editingUser && ["HOD", "HOU"].includes(form.role)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">No department selected</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="user-unit" className="block text-sm font-semibold">
                        Unit
                        {form.role === "HOU" ? (
                          <span className="text-red-500"> *</span>
                        ) : null}
                      </label>
                      <select
                        id="user-unit"
                        name="unit_id"
                        value={form.unit_id}
                        onChange={handleFormChange}
                        disabled={form.role === "HOD"}
                        required={!editingUser && form.role === "HOU"}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="">No unit selected</option>
                        {availableUnits.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      : editingUser
                      ? "Save Changes"
                      : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update password modal */}
        {passwordUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="password-form-title"
              className="my-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="password-form-title" className="text-lg font-bold">
                    Update Password
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Account: {passwordUser.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!updatingPassword) {
                      setPasswordUser(null);
                      setPassword("");
                    }
                  }}
                  aria-label="Close password form"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handlePasswordUpdate}>
                <div className="space-y-3 p-5">
                  <label htmlFor="new-user-password" className="block text-sm font-semibold">
                    New Password
                  </label>
                  <input
                    id="new-user-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    required
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                  />
                  <p className="text-xs text-slate-500">
                    Your password endpoint requires at least 8 characters.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      if (!updatingPassword) {
                        setPasswordUser(null);
                        setPassword("");
                      }
                    }}
                    disabled={updatingPassword}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#117FC2] disabled:opacity-60"
                  >
                    {updatingPassword ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <KeyRound size={17} />
                    )}
                    {updatingPassword ? "Updating..." : "Update Password"}
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
