"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  Download,
  Edit3,
  LoaderCircle,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  X,
  Building2,
  MapPin,
  Tag,
  CircleDollarSign,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import QRCode from "qrcode";
import Image from "next/image";

const PRIMARY_BLUE = "#1597E5";

const ASSET_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "IN_TRANSIT",
  "OUT",
  "MAINTENANCE",
  "LOST",
  "DAMAGED",
  "OBSOLETE",
  "RETIRED",
  "DISPOSED",
];

const ASSET_CONDITIONS = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "DAMAGED",
  "OBSOLETE",
];

const emptyForm = {
  name: "",
  category_id: "",
  serial_number: "",
  brand: "",
  model: "",
  description: "",
  purchase_date: "",
  purchase_cost: "",
  supplier: "",
  building_id: "",
  department_id: "",
  unit_id: "",
  condition: "GOOD",
  status: "AVAILABLE",
};

function getLocationName(asset) {
  return [
    asset.building_name || asset.building || "",
    asset.department_name || asset.department || "",
    asset.unit_name || asset.unit || "",
  ]
    .filter(Boolean)
    .join(" / ") || "Location not specified";
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusClasses(status) {
  const value = String(status || "").toUpperCase();

  if (value === "AVAILABLE" || value === "ASSIGNED") {
    return "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300";
  }

  if (value === "IN_TRANSIT" || value === "OUT") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
  }

  if (["DAMAGED", "LOST", "OBSOLETE"].includes(value)) {
    return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function getApiResult(response) {
  return response?.data ?? response;
}

function getCreatedAsset(result) {
  return (
    result?.asset ??
    result?.data?.asset ??
    result?.data ??
    (result?.asset_tag ? result : null)
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showStatusForm, setShowStatusForm] = useState(false);
  const [statusAsset, setStatusAsset] = useState(null);
  const [newStatus, setNewStatus] = useState("AVAILABLE");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [qrAsset, setQrAsset] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generatingQR, setGeneratingQR] = useState(false);

  const [form, setForm] = useState(emptyForm);

  // Load assets
  const loadAssets = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/assets");
      const result = getApiResult(response);

      if (result?.success === false) {
        throw new Error(result.message || "Unable to load assets.");
      }

      setAssets(Array.isArray(result?.assets) ? result.assets : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load assets."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load form dropdown options
  const loadFormOptions = useCallback(async () => {
    const requests = [
      api.get("/asset-categories"),
      api.get("/buildings"),
      api.get("/departments"),
      api.get("/units"),
    ];

    const results = await Promise.allSettled(requests);

    const [categoryResult, buildingResult, departmentResult, unitResult] =
      results;

    if (categoryResult.status === "fulfilled") {
      const result = getApiResult(categoryResult.value);
      setCategories(
        Array.isArray(result?.categories) ? result.categories : []
      );
    }

    if (buildingResult.status === "fulfilled") {
      const result = getApiResult(buildingResult.value);
      setBuildings(
        Array.isArray(result?.buildings) ? result.buildings : []
      );
    }

    if (departmentResult.status === "fulfilled") {
      const result = getApiResult(departmentResult.value);
      setDepartments(
        Array.isArray(result?.departments) ? result.departments : []
      );
    }

    if (unitResult.status === "fulfilled") {
      const result = getApiResult(unitResult.value);
      setUnits(Array.isArray(result?.units) ? result.units : []);
    }

    if (results.some((result) => result.status === "rejected")) {
      setError(
        "Some form options could not be loaded. Check that the category, building, department, and unit API endpoints are available."
      );
    }
  }, []);

  // Initial asset loading
  useEffect(() => {
  const timer = setTimeout(() => {
    loadAssets();
  }, 0);

  return () => clearTimeout(timer);
}, [loadAssets]);

  // Close the topmost modal with Escape
  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key !== "Escape") return;

      if (saving || updatingStatus) return;

      if (qrAsset) {
        closeQRCode();
        return;
      }

      if (showStatusForm) {
        closeStatusForm();
        return;
      }

      if (showForm) {
        closeForm();
      }
    }

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [
    qrAsset,
    showStatusForm,
    showForm,
    saving,
    updatingStatus,
  ]);

  // Search and status filtering
  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        [
          asset.name,
          asset.asset_tag,
          asset.serial_number,
          asset.brand,
          asset.model,
          asset.category_name || asset.category,
          asset.building_name || asset.building,
          asset.department_name || asset.department,
          asset.unit_name || asset.unit,
          asset.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "ALL" ||
        String(asset.status || "").toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  const availableCount = useMemo(
    () =>
      assets.filter(
        (asset) => String(asset.status || "").toUpperCase() === "AVAILABLE"
      ).length,
    [assets]
  );

  const assignedCount = useMemo(
    () =>
      assets.filter(
        (asset) => String(asset.status || "").toUpperCase() === "ASSIGNED"
      ).length,
    [assets]
  );

  const totalPurchaseValue = useMemo(
    () =>
      assets.reduce((total, asset) => {
        const cost = Number(asset.purchase_cost);
        return total + (Number.isFinite(cost) ? cost : 0);
      }, 0),
    [assets]
  );

  // Filter departments according to selected building
  const filteredDepartments = useMemo(() => {
    if (!form.building_id) return departments;

    return departments.filter(
      (department) =>
        String(department.building_id || department.buildingId) ===
        String(form.building_id)
    );
  }, [departments, form.building_id]);

  // Filter units according to selected department
  const filteredUnits = useMemo(() => {
    if (!form.department_id) return [];

    return units.filter(
      (unit) =>
        String(unit.department_id || unit.departmentId) ===
        String(form.department_id)
    );
  }, [units, form.department_id]);

  async function openCreateForm() {
    setEditingAsset(null);
    setForm({ ...emptyForm });
    setNotice("");
    setError("");
    setShowForm(true);

    await loadFormOptions();
  }

  async function openEditForm(asset) {
    setEditingAsset(asset);

    setForm({
      name: asset.name || "",
      category_id: asset.category_id || "",
      serial_number: asset.serial_number || "",
      brand: asset.brand || "",
      model: asset.model || "",
      description: asset.description || "",
      purchase_date: asset.purchase_date
        ? String(asset.purchase_date).slice(0, 10)
        : "",
      purchase_cost:
        asset.purchase_cost === null || asset.purchase_cost === undefined
          ? ""
          : String(asset.purchase_cost),
      supplier: asset.supplier || "",
      building_id: asset.building_id || "",
      department_id: asset.department_id || "",
      unit_id: asset.unit_id || "",
      condition: asset.condition || "GOOD",
      status: asset.status || "AVAILABLE",
    });

    setNotice("");
    setError("");
    setShowForm(true);

    await loadFormOptions();
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingAsset(null);
    setForm({ ...emptyForm });
    setError("");
  }

  function closeStatusForm() {
    if (updatingStatus) return;

    setShowStatusForm(false);
    setStatusAsset(null);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "building_id") {
        next.department_id = "";
        next.unit_id = "";
      }

      if (name === "department_id") {
        next.unit_id = "";
      }

      return next;
    });
  }

  // Generate QR code
  async function showAssetQRCode(asset) {
    if (!asset?.asset_tag) {
      setError(
        "The asset was saved, but the server did not return an asset tag. Check the POST /assets response."
      );
      return;
    }

    setGeneratingQR(true);
    setError("");

    try {
      const dataUrl = await QRCode.toDataURL(String(asset.asset_tag), {
        errorCorrectionLevel: "H",
        type: "image/png",
        width: 320,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrAsset(asset);
      setQrDataUrl(dataUrl);
    } catch (err) {
      setError(err?.message || "Unable to generate the asset QR code.");
    } finally {
      setGeneratingQR(false);
    }
  }

  function closeQRCode() {
    setQrAsset(null);
    setQrDataUrl("");
    setGeneratingQR(false);
  }

  function downloadQRCode() {
    if (!qrDataUrl || !qrAsset?.asset_tag) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${qrAsset.asset_tag}-QR.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function printQRCode() {
    if (!qrDataUrl || !qrAsset) return;

    const printWindow = window.open("", "_blank", "width=600,height=700");

    if (!printWindow) {
      setError(
        "The print window was blocked. Allow pop-ups for this site and try again."
      );
      return;
    }

    const escapeHTML = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };

        return entities[character];
      });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHTML(qrAsset.asset_tag)} QR Tag</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
              color: #111;
            }
            .tag {
              display: inline-block;
              border: 1px solid #ddd;
              border-radius: 12px;
              padding: 24px;
              max-width: 360px;
            }
            img {
              width: 240px;
              height: 240px;
            }
            h2 {
              margin-bottom: 8px;
              overflow-wrap: anywhere;
            }
            p {
              color: #555;
            }
            @media print {
              body { padding: 0; }
              .tag { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="tag">
            <h2>${escapeHTML(qrAsset.name)}</h2>
            <img
              src="${qrDataUrl}"
              alt="QR code for ${escapeHTML(qrAsset.asset_tag)}"
            />
            <h2>${escapeHTML(qrAsset.asset_tag)}</h2>
            <p>Ministry Fixed Assets Management System</p>
          </div>
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  // Create or update asset
  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Asset name is required.");
      return;
    }

    if (!form.category_id) {
      setError("Please select an asset category.");
      return;
    }

    if (!form.building_id) {
      setError("Please select a building.");
      return;
    }

    if (form.unit_id && !form.department_id) {
      setError("A department is required when selecting a unit.");
      return;
    }

    if (
      form.purchase_cost !== "" &&
      (!Number.isFinite(Number(form.purchase_cost)) ||
        Number(form.purchase_cost) < 0)
    ) {
      setError("Purchase cost must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id,
        serial_number: form.serial_number.trim() || null,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        description: form.description.trim() || null,
        purchase_date: form.purchase_date || null,
        purchase_cost:
          form.purchase_cost === "" ? null : Number(form.purchase_cost),
        supplier: form.supplier.trim() || null,
        building_id: form.building_id,
        department_id: form.department_id || null,
        unit_id: form.unit_id || null,
        condition: form.condition,
        status: form.status,
      };

      let newlyCreatedAsset = null;

      if (editingAsset) {
        await api.put(`/assets/${editingAsset.id}`, payload);
        setNotice("Asset updated successfully.");
      } else {
        const response = await api.post("/assets", payload);
        const result = getApiResult(response);

        if (result?.success === false) {
          throw new Error(result.message || "Unable to register asset.");
        }

        newlyCreatedAsset = getCreatedAsset(result);

        if (newlyCreatedAsset?.asset_tag) {
          setNotice(
            `Asset ${newlyCreatedAsset.asset_tag} registered successfully.`
          );
        } else {
          setNotice(
            "Asset registered, but the response did not include its asset tag. Check the API response."
          );
        }
      }

      setShowForm(false);
      setEditingAsset(null);
      setForm({ ...emptyForm });

      await loadAssets(true);

      if (newlyCreatedAsset?.asset_tag) {
        await showAssetQRCode(newlyCreatedAsset);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save the asset."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete asset
  async function handleDelete(asset) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${asset.name}" (${asset.asset_tag || "no tag"})? This is only allowed when the asset has no transaction history.`
    );

    if (!confirmed) return;

    setDeletingId(asset.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/assets/${asset.id}`);
      setNotice("Asset deleted successfully.");
      await loadAssets(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete the asset."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // Open status form
  function openStatusForm(asset) {
    setStatusAsset(asset);
    setNewStatus(asset.status || "AVAILABLE");
    setError("");
    setNotice("");
    setShowStatusForm(true);
  }

  // Update asset status
  async function handleStatusSubmit(event) {
    event.preventDefault();

    if (!statusAsset) return;

    setUpdatingStatus(true);
    setError("");
    setNotice("");

    try {
      await api.patch(`/assets/${statusAsset.id}/status`, {
        status: newStatus,
      });

      setNotice(`Asset status changed to ${newStatus}.`);
      setShowStatusForm(false);
      setStatusAsset(null);

      await loadAssets(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update the asset status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: PRIMARY_BLUE }}
            >
              <Boxes size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Asset Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Register, search, and manage your ministry&apos;s fixed assets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadAssets(true)}
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
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
              style={{ backgroundColor: PRIMARY_BLUE }}
            >
              <Plus size={17} />
              Register Asset
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Total Assets</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : assets.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Registered ministry assets
                </p>
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: PRIMARY_BLUE }}
              >
                <Package size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Available Assets</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : availableCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Ready for assignment
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300">
                <Check size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Assigned Assets</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : assignedCount}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Currently assigned
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                <Building2 size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Purchase Value</p>
                <p className="mt-3 break-words text-2xl font-bold tracking-tight">
                  {loading ? "—" : formatCurrency(totalPurchaseValue)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Total recorded purchase cost
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <CircleDollarSign size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Assets table */}
        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">Asset Directory</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search assets, edit their details, update status, or remove
                assets that have no transaction history.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-64">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search assets..."
                  aria-label="Search assets"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by asset status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="ALL">All statuses</option>
                {ASSET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Loading assets...
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Package size={27} />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                {search.trim() || statusFilter !== "ALL"
                  ? "No matching assets"
                  : "No assets registered yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim() || statusFilter !== "ALL"
                  ? "Try changing your search or status filter."
                  : "Register your first asset to begin managing ministry equipment."}
              </p>

              {!search.trim() && statusFilter === "ALL" && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                  style={{ backgroundColor: PRIMARY_BLUE }}
                >
                  <Plus size={17} />
                  Register Asset
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Asset</th>
                      <th className="px-5 py-4 font-semibold">Category</th>
                      <th className="px-5 py-4 font-semibold">Location</th>
                      <th className="px-5 py-4 font-semibold">Purchase Cost</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
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
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                              style={{ backgroundColor: PRIMARY_BLUE }}
                            >
                              <Package size={19} />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold">
                                {asset.name || "Unnamed asset"}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <Tag size={12} />
                                {asset.asset_tag || "Tag not available"}
                              </p>

                              {asset.serial_number && (
                                <p className="mt-1 text-xs text-slate-500">
                                  S/N: {asset.serial_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {asset.category_name || asset.category || "—"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {[asset.brand, asset.model]
                              .filter(Boolean)
                              .join(" ") || "No model details"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex max-w-xs items-start gap-2 text-slate-600 dark:text-slate-300">
                            <MapPin
                              size={15}
                              className="mt-0.5 shrink-0 text-slate-400"
                            />
                            <span>{getLocationName(asset)}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {formatCurrency(asset.purchase_cost)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(asset.status)}`}
                            >
                              {(asset.status || "UNKNOWN").replaceAll("_", " ")}
                            </span>

                            <button
                              type="button"
                              onClick={() => openStatusForm(asset)}
                              className="text-xs font-medium hover:underline"
                              style={{ color: PRIMARY_BLUE }}
                            >
                              Change status
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(asset)}
                              aria-label={`Edit ${asset.name}`}
                              title="Edit asset"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5]/30 hover:bg-[#1597E5]/10 hover:text-[#1597E5] dark:border-slate-700 dark:text-slate-300"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => showAssetQRCode(asset)}
                              disabled={generatingQR || !asset.asset_tag}
                              aria-label={`Generate QR code for ${asset.name}`}
                              title="Generate QR code"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#1597E5]/30 hover:bg-[#1597E5]/10 hover:text-[#1597E5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                            >
                              {generatingQR ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <QrCode size={16} />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(asset)}
                              disabled={deletingId === asset.id}
                              aria-label={`Delete ${asset.name}`}
                              title="Delete asset"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
                            >
                              {deletingId === asset.id ? (
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
                Showing {filteredAssets.length} of {assets.length} assets
              </div>
            </>
          )}
        </div>

        {/* Create / Edit modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeForm();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="asset-form-title"
              className="my-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="asset-form-title" className="text-lg font-bold">
                    {editingAsset ? "Edit Asset" : "Register Asset"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the asset details and its building location.
                    The backend generates the asset tag.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 md:col-span-2"
                    >
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="asset-name" className="block text-sm font-semibold">
                      Asset Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="asset-name"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="e.g. Office Laptop"
                      maxLength={150}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/20 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-category" className="block text-sm font-semibold">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="asset-category"
                      name="category_id"
                      value={form.category_id}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-serial" className="block text-sm font-semibold">
                      Serial Number
                    </label>
                    <input
                      id="asset-serial"
                      name="serial_number"
                      value={form.serial_number}
                      onChange={handleFormChange}
                      placeholder="e.g. SN-LAP-1001"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-brand" className="block text-sm font-semibold">
                      Brand
                    </label>
                    <input
                      id="asset-brand"
                      name="brand"
                      value={form.brand}
                      onChange={handleFormChange}
                      placeholder="e.g. Dell"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-model" className="block text-sm font-semibold">
                      Model
                    </label>
                    <input
                      id="asset-model"
                      name="model"
                      value={form.model}
                      onChange={handleFormChange}
                      placeholder="e.g. Latitude 5440"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-supplier" className="block text-sm font-semibold">
                      Supplier
                    </label>
                    <input
                      id="asset-supplier"
                      name="supplier"
                      value={form.supplier}
                      onChange={handleFormChange}
                      placeholder="Supplier name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-purchase-date" className="block text-sm font-semibold">
                      Purchase Date
                    </label>
                    <input
                      id="asset-purchase-date"
                      name="purchase_date"
                      type="date"
                      value={form.purchase_date}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-purchase-cost" className="block text-sm font-semibold">
                      Purchase Cost (NGN)
                    </label>
                    <input
                      id="asset-purchase-cost"
                      name="purchase_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchase_cost}
                      onChange={handleFormChange}
                      placeholder="e.g. 1250000"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="asset-description" className="block text-sm font-semibold">
                      Description
                    </label>
                    <textarea
                      id="asset-description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Describe the asset and its intended use..."
                      rows={3}
                      maxLength={1000}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-building" className="block text-sm font-semibold">
                      Building <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="asset-building"
                      name="building_id"
                      value={form.building_id}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">Select building</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name ||
                            building.building_name ||
                            building.code ||
                            building.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-department" className="block text-sm font-semibold">
                      Department
                    </label>
                    <select
                      id="asset-department"
                      name="department_id"
                      value={form.department_id}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">No department</option>
                      {filteredDepartments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name ||
                            department.department_name ||
                            department.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-unit" className="block text-sm font-semibold">
                      Unit
                    </label>
                    <select
                      id="asset-unit"
                      name="unit_id"
                      value={form.unit_id}
                      onChange={handleFormChange}
                      disabled={!form.department_id}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">No unit</option>
                      {filteredUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name || unit.unit_name || unit.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-condition" className="block text-sm font-semibold">
                      Condition
                    </label>
                    <select
                      id="asset-condition"
                      name="condition"
                      value={form.condition}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    >
                      {ASSET_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-status" className="block text-sm font-semibold">
                      Status
                    </label>
                    <select
                      id="asset-status"
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                    >
                      {ASSET_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">
                      Choose the lifecycle status appropriate for this asset.
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: PRIMARY_BLUE }}
                  >
                    {saving ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    {saving
                      ? "Saving..."
                      : editingAsset
                        ? "Save Changes"
                        : "Register Asset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update status modal */}
        {showStatusForm && statusAsset && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeStatusForm();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="asset-status-title"
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="asset-status-title" className="text-lg font-bold">
                    Update Asset Status
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {statusAsset.name} ({statusAsset.asset_tag || "No tag"})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeStatusForm}
                  disabled={updatingStatus}
                  aria-label="Close status form"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleStatusSubmit}>
                <div className="space-y-2 p-5">
                  <label htmlFor="new-asset-status" className="block text-sm font-semibold">
                    New Status
                  </label>
                  <select
                    id="new-asset-status"
                    value={newStatus}
                    onChange={(event) => setNewStatus(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1597E5] dark:border-slate-700 dark:bg-slate-950"
                  >
                    {ASSET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeStatusForm}
                    disabled={updatingStatus}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: PRIMARY_BLUE }}
                  >
                    {updatingStatus ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    {updatingStatus ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generated QR code modal */}
        {qrAsset && qrDataUrl && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeQRCode();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="asset-qr-title"
              className="my-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2 id="asset-qr-title" className="text-lg font-bold">
                    Asset QR Tag
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    QR code for your registered asset.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeQRCode}
                  aria-label="Close QR code"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="p-6 text-center">
                <div className="mx-auto flex max-w-[280px] flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700">
                  <Image
                    src={qrDataUrl}
                    alt={`QR code for asset ${qrAsset.asset_tag}`}
                    width={240}
                    height={240}
                    unoptimized
                    className="h-60 w-60 max-w-full object-contain"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                    }}
                  />

                  <h3 className="mt-4 break-words text-lg font-bold text-slate-900">
                    {qrAsset.asset_tag}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {qrAsset.name}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    Scan this code to identify the asset.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={downloadQRCode}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
                    style={{ backgroundColor: PRIMARY_BLUE }}
                  >
                    <Download size={17} />
                    Download QR
                  </button>

                  <button
                    type="button"
                    onClick={printQRCode}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <QrCode size={17} />
                    Print Tag
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeQRCode}
                  className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
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