"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  ClipboardList,
  Download,
  FileClock,
  FileText,
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

const REPORTS = [
  { id: "assets", label: "Assets", endpoint: "/reports/assets", icon: Boxes },
  { id: "movements", label: "Movements", endpoint: "/reports/movements", icon: Truck },
  { id: "checkouts", label: "Checkouts", endpoint: "/reports/checkouts", icon: ClipboardList },
  { id: "maintenance", label: "Maintenance", endpoint: "/reports/maintenance", icon: Wrench },
  { id: "audit", label: "Audit Logs", endpoint: "/reports/audit", icon: ShieldCheck },
];


const FILTERS = {
  assets: [
    { name: "buildingId", label: "Building", type: "select", options: [] },
    { name: "departmentId", label: "Department", type: "select", options: [] },
    { name: "unitId", label: "Unit", type: "select", options: [] },
    { name: "categoryId", label: "Asset Category", type: "select", options: [] },
    {
      name: "status",
      label: "Asset Status",
      type: "select",
      options: [
        "AVAILABLE", "ASSIGNED", "IN_TRANSIT", "OUT", "MAINTENANCE",
        "LOST", "DAMAGED", "OBSOLETE", "RETIRED", "DISPOSED",
      ],
    },
    {
      name: "condition",
      label: "Condition",
      type: "select",
      options: ["GOOD", "FAIR", "POOR", "DAMAGED"],
    },
    {
      name: "isActive",
      label: "Active Status",
      type: "select",
      options: ["true", "false"],
    },
  ],
  movements: [
    { name: "buildingId", label: "Building", type: "select", options: [] },
    { name: "departmentId", label: "Department", type: "select", options: [] },
    { name: "unitId", label: "Unit", type: "select", options: [] },
    {
      name: "movementStatus",
      label: "Movement Status",
      type: "select",
      options: ["PENDING", "APPROVED", "IN_TRANSIT", "COMPLETED", "REJECTED"],
    },
    {
      name: "movementType",
      label: "Movement Type",
      type: "select",
      options: ["TRANSFER", "CHECKOUT", "CHECKIN"],
    },
    { name: "fromDate", label: "From Date", type: "date" },
    { name: "toDate", label: "To Date", type: "date" },
  ],
  checkouts: [
    { name: "buildingId", label: "Building", type: "select", options: [] },
    {
      name: "status",
      label: "Checkout Status",
      type: "select",
      options: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
    },
    { name: "fromDate", label: "From Date", type: "date" },
    { name: "toDate", label: "To Date", type: "date" },
  ],
  maintenance: [
    { name: "buildingId", label: "Building", type: "select", options: [] },
    { name: "departmentId", label: "Department", type: "select", options: [] },
    { name: "unitId", label: "Unit", type: "select", options: [] },
    {
      name: "maintenanceStatus",
      label: "Maintenance Status",
      type: "select",
      options: ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    },
    {
      name: "maintenanceType",
      label: "Maintenance Type",
      type: "select",
      options: ["REPAIR", "PREVENTIVE", "CORRECTIVE", "INSPECTION"],
    },
    { name: "fromDate", label: "From Date", type: "date" },
    { name: "toDate", label: "To Date", type: "date" },
  ],
  audit: [
    { name: "userId", label: "User ID", type: "text" },
    { name: "action", label: "Action", type: "text", placeholder: "e.g. CREATE" },
    { name: "entityType", label: "Entity Type", type: "text", placeholder: "e.g. ASSET" },
    { name: "entityId", label: "Entity ID", type: "text" },
    { name: "fromDate", label: "From Date", type: "date" },
    { name: "toDate", label: "To Date", type: "date" },
  ],
};

const EMPTY_FILTERS = {
  buildingId: "",
  departmentId: "",
  unitId: "",
  categoryId: "",
  status: "",
  condition: "",
  isActive: "",
  movementStatus: "",
  movementType: "",
  maintenanceStatus: "",
  maintenanceType: "",
  fromDate: "",
  toDate: "",
  userId: "",
  action: "",
  entityType: "",
  entityId: "",
};

function formatLabel(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }

  return String(value);
}

function getStatusClass(value) {
  const status = String(value || "").toUpperCase();

  if (["COMPLETED", "APPROVED", "AVAILABLE", "ACTIVE", "GOOD"].includes(status)) {
    return "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300";
  }

  if (
    ["PENDING", "OPEN", "IN_TRANSIT", "IN_PROGRESS", "MAINTENANCE"].includes(status)
  ) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (
    ["REJECTED", "LOST", "DAMAGED", "DISPOSED", "CANCELLED", "INACTIVE"].includes(status)
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("assets");
  const [reportsData, setReportsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);

  const currentReport = REPORTS.find((report) => report.id === activeReport);
  const currentData = reportsData[activeReport] || { count: 0, data: [] };
  const currentFilters = useMemo(() => FILTERS[activeReport] || [],[activeReport]);

  const reportFilters = useMemo(() => {
  const namedOptions = {
    buildingId: buildings.map((item) => ({
      value: item.id,
      label: item.name,
    })),
    departmentId: departments.map((item) => ({
      value: item.id,
      label: item.name,
    })),
    unitId: units.map((item) => ({
      value: item.id,
      label: item.name,
    })),
    categoryId: categories.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  };

  return currentFilters.map((filter) => ({
    ...filter,
    options: namedOptions[filter.name] ?? filter.options,
  }));
}, [currentFilters, buildings, departments, units, categories]);

  const loadReport = useCallback(
    async (isRefresh = false, selectedFilters = {}) => {
      const report = REPORTS.find((item) => item.id === activeReport);

      if (!report) return;

      try {
        const params = Object.fromEntries(
          Object.entries(selectedFilters).filter(
            ([, value]) => value !== "" && value !== null && value !== undefined
          )
        );

        const response = await api.get(report.endpoint, { params });
        const result = response?.data ?? response;

        if (result?.success === false) {
          throw new Error(result.message || "Unable to generate report.");
        }

        const rows = Array.isArray(result?.data) ? result.data : [];

        setReportsData((previous) => ({
          ...previous,
          [activeReport]: {
            count: typeof result?.count === "number" ? result.count : rows.length,
            data: rows,
          },
        }));

        if (isRefresh) setNotice("Report refreshed successfully.");
        setError("");
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to generate the report."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeReport]
  );

  // Fetch the report whenever the selected report changes.
  // Loading and message state are initialized by event handlers, not here.
  useEffect(() => {
    let cancelled = false;

    const fetchReport = async () => {
      const report = REPORTS.find((item) => item.id === activeReport);
      if (!report) return;

      try {
        const response = await api.get(report.endpoint, { params: {} });
        const result = response?.data ?? response;

        if (result?.success === false) {
          throw new Error(result.message || "Unable to generate report.");
        }

        const rows = Array.isArray(result?.data) ? result.data : [];

        if (!cancelled) {
          setReportsData((previous) => ({
            ...previous,
            [activeReport]: {
              count: typeof result?.count === "number" ? result.count : rows.length,
              data: rows,
            },
          }));
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to generate the report."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [activeReport]);

  useEffect(() => {
  let cancelled = false;

    async function loadFilterOptions() {
        try {
        const [buildingRes, departmentRes, unitRes, categoryRes] =
            await Promise.all([
            api.get("/buildings"),
            api.get("/departments"),
            api.get("/units"),
            api.get("/asset-categories"),
            ]);

        const buildingData = buildingRes?.data ?? buildingRes;
        const departmentData = departmentRes?.data ?? departmentRes;
        const unitData = unitRes?.data ?? unitRes;
        const categoryData = categoryRes?.data ?? categoryRes;

        if (cancelled) return;

        setBuildings(
            Array.isArray(buildingData?.buildings)
            ? buildingData.buildings
            : Array.isArray(buildingData?.data)
                ? buildingData.data
                : []
        );

        setDepartments(
            Array.isArray(departmentData?.departments)
            ? departmentData.departments
            : Array.isArray(departmentData?.data)
                ? departmentData.data
                : []
        );

        setUnits(
            Array.isArray(unitData?.units)
            ? unitData.units
            : Array.isArray(unitData?.data)
                ? unitData.data
                : []
        );

        setCategories(
            Array.isArray(categoryData?.categories)
            ? categoryData.categories
            : Array.isArray(categoryData?.data)
                ? categoryData.data
                : []
        );
        } catch (err) {
        if (!cancelled) {
            console.error("Unable to load report filter options:", err);
        }
        }
    }

    loadFilterOptions();

    return () => {
        cancelled = true;
    };
    }, []);

  const handleReportChange = (reportId) => {
    if (reportId === activeReport) {
      setLoading(true);
      setRefreshing(false);
      setError("");
      setNotice("");
      loadReport(false, appliedFilters);
      return;
    }

    setLoading(true);
    setRefreshing(false);
    setActiveReport(reportId);
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({});
    setSearch("");
    setNotice("");
    setError("");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setError("");
    setNotice("");
    loadReport(true, appliedFilters);
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = currentData.data;

    if (!query) return rows;

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        formatValue(value).toLowerCase().includes(query)
      )
    );
  }, [currentData.data, search]);

    const columns = useMemo(() => {
    if (!filteredRows.length) return [];

    const preferredColumns = {
        assets: [
        "asset_tag", "name", "status", "condition", "building_name",
        "department_name", "unit_name", "is_active",
        ],
        movements: [
        "asset_tag", "movement_type", "movement_status",
        "from_building_name", "to_building_name", "created_at",
        ],
        checkouts: [
        "asset_tag", "status", "destination", "date_out",
        "expected_return_date", "actual_return_date",
        ],
        maintenance: [
        "asset_tag", "maintenance_type", "status", "description",
        "service_provider", "started_at", "completed_at",
        ],
        audit: [
        "created_at", "user_name", "action", "entity_type", "entity_id",
        "description",
        ],
    };

    const allKeys = [...new Set(filteredRows.flatMap((row) => Object.keys(row)))];
    const preferred = preferredColumns[activeReport] || [];

    return [
        ...preferred.filter((key) => allKeys.includes(key)),
        ...allKeys.filter((key) => !preferred.includes(key)),
    ];
    }, [filteredRows, activeReport]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleApplyFilters(event) {
    event.preventDefault();

    const nextFilters = Object.fromEntries(
      currentFilters
        .map(({ name }) => [name, filters[name]])
        .filter(([, value]) => value !== "")
    );

    setAppliedFilters(nextFilters);
    setLoading(true);
    setError("");
    setNotice("");
    await loadReport(false, nextFilters);
  }

  async function handleResetFilters() {
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({});
    setSearch("");
    setLoading(true);
    setError("");
    setNotice("");
    await loadReport(false, {});
  }

  function exportCsv() {
    if (!filteredRows.length || !columns.length) {
      setError("There are no report records to export.");
      return;
    }

    const escapeCsv = (value) =>
      `"${formatValue(value).replace(/"/g, '""')}"`;

    const csv = [
      columns.map((column) => escapeCsv(formatLabel(column))).join(","),
      ...filteredRows.map((row) =>
        columns.map((column) => escapeCsv(row[column])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${activeReport}-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setNotice("Report exported successfully.");
    setError("");
  }

  const Icon = currentReport.icon;

  return (
    <DashboardLayout>
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/30 dark:text-white/950">
              <FileText size={23} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
              <p className="mt-1 text-sm text-slate-500">
                Generate, filter, review, and export ministry asset reports.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={loading || !filteredRows.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed"
            >
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </div>

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

        <div className="dashboard-card rounded-2xl border p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {REPORTS.map((report) => {
              const ReportIcon = report.icon;
              const selected = activeReport === report.id;

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => handleReportChange(report.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    selected
                      ? "bg-[#1597E5] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <ReportIcon size={17} />
                  {report.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Report Type</p>
                <p className="mt-3 text-xl font-bold">{currentReport.label}</p>
                <p className="mt-2 text-xs text-slate-500">Currently selected report</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/30 dark:text-white/950">
                <Icon size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Total Records</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : currentData.count}
                </p>
                <p className="mt-2 text-xs text-slate-500">Records returned by the API</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5]/100 text-white dark:bg-[#1597E5]/30 dark:text-white/950">
                <FileClock size={23} />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Matching Records</p>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {loading ? "—" : filteredRows.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">Records matching your search</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <Search size={23} />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">{currentReport.label} Filters</h2>
            <p className="mt-1 text-sm text-slate-500">
              Narrow the report using the available filters.
            </p>
          </div>

          <form onSubmit={handleApplyFilters}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reportFilters.map((filter) => (
                <div key={filter.name} className="space-y-2">
                  <label
                    htmlFor={`filter-${filter.name}`}
                    className="block text-sm font-semibold"
                  >
                    {filter.label}
                  </label>

                  {filter.type === "select" ? (
                    <select
                      id={`filter-${filter.name}`}
                      name={filter.name}
                      value={filters[filter.name]}
                      onChange={handleFilterChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    >
                      <option value="">All</option>
                      {filter.options.map((option) => {
                        const isObject = typeof option === "object";

                        return (
                            <option
                            key={isObject ? option.value : option}
                            value={isObject ? option.value : option}
                            >
                            {isObject ? option.label : formatLabel(option)}
                            </option>
                        );
                        })}
                    </select>
                  ) : (
                    <input
                      id={`filter-${filter.name}`}
                      name={filter.name}
                      type={filter.type}
                      value={filters[filter.name]}
                      onChange={handleFilterChange}
                      placeholder={filter.placeholder || ""}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search size={16} />
                Apply Filters
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <X size={16} />
                Reset Filters
              </button>
            </div>
          </form>
        </div>

        <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold">{currentReport.label} Report</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the records returned for your selected report.
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
                placeholder="Search report records..."
                aria-label="Search report records"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <LoaderCircle size={20} className="animate-spin" />
              Generating {currentReport.label.toLowerCase()} report...
            </div>
          ) : error && !currentData.data.length ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <AlertTriangle size={28} className="text-red-500" />
              <h3 className="mt-4 text-base font-semibold">Unable to load report</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Check your access permissions and try refreshing the report.
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1597E5]/80"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Package size={27} />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {search.trim() || Object.keys(appliedFilters).length
                  ? "No matching records"
                  : `No ${currentReport.label.toLowerCase()} records`}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {search.trim() || Object.keys(appliedFilters).length
                  ? "Try changing your search or resetting your filters."
                  : "There are no records available for this report yet, or your current access scope has no matching records."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-5 py-4 font-semibold"
                        >
                          {formatLabel(column)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.map((row, index) => (
                      <tr
                        key={row.id || `${activeReport}-${index}`}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        {columns.map((column) => {
                          const value = row[column];
                          const isStatus = /status|condition|is_active/i.test(column);

                          return (
                            <td
                              key={column}
                              className="max-w-sm px-5 py-4 text-slate-600 dark:text-slate-300"
                            >
                              {isStatus && value !== null && value !== undefined ? (
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(value)}`}
                                >
                                  {formatValue(value)}
                                </span>
                              ) : (
                                <span className="break-words">{formatValue(value)}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-700">
                Showing {filteredRows.length} matching records out of{" "}
                {currentData.count} records returned by the API.
              </div>
            </>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
