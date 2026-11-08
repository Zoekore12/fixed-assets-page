"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";

import api from "@/lib/api";

// --------------------------------------------------
// Shared theme configuration
// --------------------------------------------------

const THEME_KEY = "dashboard-theme";

function getSavedTheme() {
  if (typeof window === "undefined") return false;

  return localStorage.getItem(THEME_KEY) === "dark";
}

// Format numbers for dashboard cards
function formatNumber(value) {
  return new Intl.NumberFormat("en-NG").format(Number(value) || 0);
}

// Dashboard summary card
function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color = "blue",
  darkMode,
}) {
  const colorClasses = {
    blue: darkMode
      ? "bg-[#1597E5] text-white"
      : "bg-[#1597E5] text-white",

    green: darkMode
      ? "bg-green-900/40 text-green-400"
      : "bg-green-50 text-green-600",

    orange: darkMode
      ? "bg-orange-900/40 text-orange-400"
      : "bg-orange-50 text-orange-600",

    purple: darkMode
      ? "bg-purple-900/40 text-purple-400"
      : "bg-purple-50 text-purple-600",

    red: darkMode
      ? "bg-red-900/40 text-red-400"
      : "bg-red-50 text-red-600",
  };

  return (
    <div
      className={`dashboard-card rounded-2xl border p-5 shadow-sm transition-colors ${
        darkMode
          ? "border-slate-700 bg-slate-800 text-white"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight">
            {formatNumber(value)}
          </h3>

          {description && (
            <p
              className={`mt-2 text-xs ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            colorClasses[color] || colorClasses.blue
          }`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

// Asset status row
function StatusRow({
  label,
  value,
  color = "bg-[#1597E5]",
  darkMode,
}) {
  const count = Number(value) || 0;

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />

        <span
          className={`text-sm ${
            darkMode ? "text-slate-300" : "text-slate-700"
          }`}
        >
          {label}
        </span>
      </div>

      <span
        className={`text-sm font-semibold ${
          darkMode ? "text-white" : "text-slate-900"
        }`}
      >
        {formatNumber(count)}
      </span>
    </div>
  );
}

// Dashboard summary
export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [role, setRole] = useState("");
  const [staffType, setStaffType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // --------------------------------------------------
  // Read and listen to the theme shared with the navbar
  // --------------------------------------------------

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      const isDark = getSavedTheme();

      setDarkMode(isDark);

      document.documentElement.dataset.theme = isDark
        ? "dark"
        : "light";

      document.documentElement.classList.toggle("dark", isDark);
    };

    updateTheme();

    window.addEventListener("theme-change", updateTheme);
    window.addEventListener("storage", updateTheme);

    return () => {
      window.removeEventListener("theme-change", updateTheme);
      window.removeEventListener("storage", updateTheme);
    };
  }, []);

  // --------------------------------------------------
  // Load dashboard data
  // --------------------------------------------------

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/dashboard/summary");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to load dashboard information."
        );
      }

      // Extract dashboard statistics.
      const payload = result?.data ?? result;
      const dashboardData = payload?.dashboard ?? payload;

      // Extract role and staff type from the top-level API response.
      const userRole = result?.role ?? "";
      const userStaffType = result?.staffType ?? "";

      console.log("Dashboard role:", userRole);
      console.log("Dashboard staff type:", userStaffType);

      setDashboard(dashboardData);
      setRole(userRole);
      setStaffType(userStaffType);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadDashboard]);

  // --------------------------------------------------
  // Normalize possible database/API naming conventions
  // --------------------------------------------------

  const stats =
    dashboard?.stats ?? dashboard?.summary ?? dashboard ?? {};

  const totalAssets =
    stats.totalAssets ?? stats.total_assets ?? 0;

  const availableAssets =
    stats.availableAssets ?? stats.available_assets ?? 0;

  const assignedAssets =
    stats.assignedAssets ?? stats.assigned_assets ?? 0;

  const maintenanceAssets =
    stats.maintenanceAssets ?? stats.maintenance_assets ?? 0;

  const pendingRequests =
    stats.pendingRequests ?? stats.pending_requests ?? 0;

  const assetsInTransit =
    stats.assetsInTransit ?? stats.assets_in_transit ?? 0;

  const normalizedRole = String(role || "").trim().toUpperCase();
  const normalizedStaffType = String(staffType || "")
    .trim()
    .toUpperCase();

  const isAdmin = normalizedRole === "ADMINISTRATOR";
  const isHOD = normalizedRole === "HOD";
  const isHOU = normalizedRole === "HOU";

  const isSecurity =
    normalizedRole === "SECURITY" ||
    (normalizedRole === "STAFF" &&
      normalizedStaffType === "SECURITY");

  const isGeneralStaff =
    normalizedRole === "STAFF" &&
    normalizedStaffType === "GENERAL";

  console.log("Dashboard role:", role);
  console.log("Dashboard staff type:", staffType);
  console.log("Is Admin:", isAdmin);

  // --------------------------------------------------
  // Role-based summary cards
  // --------------------------------------------------

  const summaryCards = isAdmin
    ? [
        {
          title: "Total Assets",
          value: totalAssets,
          description: "Registered organizational assets",
          icon: Package,
          color: "[#1597E5]",
        },
        {
          title: "Available Assets",
          value: availableAssets,
          description: "Assets available for assignment",
          icon: CheckCircle2,
          color: "green",
        },
        {
          title: "Assigned Assets",
          value: assignedAssets,
          description: "Assets currently assigned",
          icon: Building2,
          color: "purple",
        },
        {
          title: "Pending Requests",
          value: pendingRequests,
          description: "Requests awaiting action",
          icon: Clock,
          color: "orange",
        },
      ]
    : isSecurity
    ? [
        {
          title: "Assets to Monitor",
          value: totalAssets,
          description: "Assets available in the dashboard data",
          icon: Package,
          color: "[#1597E5]",
        },
        {
          title: "Pending Requests",
          value: pendingRequests,
          description: "Requests awaiting security action",
          icon: Clock,
          color: "orange",
        },
        {
          title: "Assets in Transit",
          value: assetsInTransit,
          description: "Assets being transferred",
          icon: ArrowDownToLine,
          color: "purple",
        },
        {
          title: "Maintenance",
          value: maintenanceAssets,
          description: "Assets under maintenance",
          icon: Wrench,
          color: "red",
        },
      ]
    : isHOD
    ? [
        {
          title: "Department Assets",
          value: totalAssets,
          description: "Assets in your department",
          icon: Building2,
          color: "[#1597E5]",
        },
        {
          title: "Available Assets",
          value: availableAssets,
          description: "Assets available for assignment",
          icon: CheckCircle2,
          color: "green",
        },
        {
          title: "Pending Requests",
          value: pendingRequests,
          description: "Department requests awaiting action",
          icon: Clock,
          color: "orange",
        },
        {
          title: "Assets in Transit",
          value: assetsInTransit,
          description: "Department assets being transferred",
          icon: ArrowDownToLine,
          color: "purple",
        },
      ]
    : isHOU
    ? [
        {
          title: "Unit Assets",
          value: totalAssets,
          description: "Assets in your unit",
          icon: Building2,
          color: "[#1597E5]",
        },
        {
          title: "Available Assets",
          value: availableAssets,
          description: "Assets available for assignment",
          icon: CheckCircle2,
          color: "green",
        },
        {
          title: "Pending Requests",
          value: pendingRequests,
          description: "Unit requests awaiting action",
          icon: Clock,
          color: "orange",
        },
        {
          title: "Maintenance",
          value: maintenanceAssets,
          description: "Assets under maintenance",
          icon: Wrench,
          color: "red",
        },
      ]
    : [
        {
          title: "My Assigned Assets",
          value: assignedAssets,
          description: "Assets currently assigned to you",
          icon: Package,
          color: "[#1597E5]",
        },
        {
          title: "My Pending Requests",
          value: pendingRequests,
          description: "Your requests awaiting action",
          icon: Clock,
          color: "orange",
        },
        {
          title: "My Assets in Transit",
          value: assetsInTransit,
          description: "Transfers involving your assets",
          icon: ArrowDownToLine,
          color: "purple",
        },
        {
          title: "My Maintenance",
          value: maintenanceAssets,
          description: "Assets under maintenance",
          icon: Wrench,
          color: "red",
        },
      ];

  // --------------------------------------------------
  // Shared styling
  // --------------------------------------------------

  const panelClass = darkMode
    ? "dashboard-card rounded-2xl border border-slate-700 bg-slate-800 text-white shadow-sm"
    : "dashboard-card rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm";

  const headingTextClass = darkMode
    ? "text-white"
    : "text-slate-900";

  const secondaryTextClass = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const quickActionClass = darkMode
    ? "flex items-center justify-between rounded-xl border border-slate-700 p-3 text-slate-200 transition-colors hover:bg-[#293b52] hover:text-blue-300"
    : "flex items-center justify-between rounded-xl border border-slate-200 p-3 text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900";

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <section
        className={`min-h-screen space-y-6 transition-colors ${
          darkMode ? "text-white" : "text-slate-900"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard Overview
          </h1>

          <p className={`mt-1 text-sm ${secondaryTextClass}`}>
            Loading your asset management information...
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`dashboard-card h-36 animate-pulse rounded-2xl border p-5 ${
                darkMode
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`h-4 w-28 rounded ${
                  darkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              />

              <div
                className={`mt-5 h-8 w-20 rounded ${
                  darkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              />

              <div
                className={`mt-3 h-3 w-36 rounded ${
                  darkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // --------------------------------------------------
  // Dashboard content
  // --------------------------------------------------

  return (
    <section
      className={`min-h-screen space-y-8 transition-colors ${
        darkMode ? "text-white" : "text-slate-900"
      }`}
    >
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Dashboard Overview
          </h1>

          <p className={`mt-1 text-sm ${secondaryTextClass}`}>
            Monitor and manage your organization&apos;s fixed assets.
          </p>

          {lastUpdated && (
            <p
              className={`mt-2 text-xs ${
                darkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            darkMode
              ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            darkMode
              ? "border-red-900/60 bg-red-950/40 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />

          <div className="flex-1">
            <p className="font-semibold">
              Unable to load dashboard
            </p>

            <p className="mt-1">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.title}
            {...card}
            darkMode={darkMode}
          />
        ))}
      </div>

      {/* Dashboard panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Asset status */}
        <div className={`${panelClass} p-5 xl:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={`text-lg font-semibold ${headingTextClass}`}>
                Asset Status Overview
              </h2>

              <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                Current status of registered assets
              </p>
            </div>

            <Activity size={21} className="text-blue-500" />
          </div>

          <div
            className={`mt-5 divide-y ${
              darkMode
                ? "divide-slate-700"
                : "divide-slate-100"
            }`}
          >
            <StatusRow
              label="Available"
              value={availableAssets}
              color="bg-green-500"
              darkMode={darkMode}
            />

            <StatusRow
              label="Assigned"
              value={assignedAssets}
              color="bg-[#1597E5]"
              darkMode={darkMode}
            />

            <StatusRow
              label="In Transit"
              value={assetsInTransit}
              color="bg-purple-500"
              darkMode={darkMode}
            />

            <StatusRow
              label="Under Maintenance"
              value={maintenanceAssets}
              color="bg-orange-500"
              darkMode={darkMode}
            />
          </div>

          <div
            className={`mt-5 flex items-center gap-2 rounded-xl p-3 text-sm ${
              darkMode
                ? "bg-[#1597E5]/50 text-[#1597E5]"
                : "bg-[#1597E5] text-white"
            }`}
          >
            <TrendingUp size={18} />

            <span>
              Keep asset records and movement information up to date.
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className={`${panelClass} p-5`}>
          <h2 className={`text-lg font-semibold ${headingTextClass}`}>
            Quick Actions
          </h2>

          <p className={`mt-1 text-sm ${secondaryTextClass}`}>
            Navigate to frequently used sections.
          </p>

          <div className="mt-5 space-y-3">
            {isAdmin && (
              <a
                href="/assets"
                className={quickActionClass}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Package size={18} className="text-[#1597E5]" />
                  Manage Assets
                </span>

                <ArrowRight
                  size={17}
                  className="text-slate-400"
                />
              </a>
            )}

            <a
              href={isAdmin ? "/transfer" : "/transfers"}
              className={quickActionClass}
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <ArrowUpRight size={18} className="text-purple-500" />
                Tracking & Transfers
              </span>

              <ArrowRight
                size={17}
                className="text-slate-400"
              />
            </a>

            {!isSecurity && (
              <a
                href={
                  isAdmin || isHOD || isHOU
                    ? "/maintenance"
                    : "/usermaintenance"
                }
                className={quickActionClass}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Wrench size={18} className="text-orange-500" />
                  Maintenance
                </span>

                <ArrowRight
                  size={17}
                  className="text-slate-400"
                />
              </a>
            )}

            {isAdmin && (
              <a
                href="/valuations"
                className={quickActionClass}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <TrendingUp size={18} className="text-green-500" />
                  Asset Valuation
                </span>

                <ArrowRight
                  size={17}
                  className="text-slate-400"
                />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Administrator information */}
      {isAdmin && (
        <div className={`${panelClass} p-5`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                darkMode
                  ? "bg-[#1597E5] text-white"
                  : "bg-[#1597E5] text-white"
              }`}
            >
              <ShieldCheck size={22} />
            </div>

            <div>
              <h2 className={`text-lg font-semibold ${headingTextClass}`}>
                Administration Overview
              </h2>

              <p className={`mt-1 text-sm ${secondaryTextClass}`}>
                Review outstanding requests and monitor asset records.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div
              className={`rounded-xl p-4 ${
                darkMode ? "bg-slate-700/60" : "bg-slate-50"
              }`}
            >
              <p className={`text-sm ${secondaryTextClass}`}>
                Total registered assets
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(totalAssets)}
              </p>
            </div>

            <div
              className={`rounded-xl p-4 ${
                darkMode ? "bg-slate-700/60" : "bg-slate-50"
              }`}
            >
              <p className={`text-sm ${secondaryTextClass}`}>
                Available for assignment
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(availableAssets)}
              </p>
            </div>

            <div
              className={`rounded-xl p-4 ${
                darkMode ? "bg-slate-700/60" : "bg-slate-50"
              }`}
            >
              <p className={`text-sm ${secondaryTextClass}`}>
                Requests requiring attention
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatNumber(pendingRequests)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`border-t pt-5 text-center text-xs ${
          darkMode
            ? "border-slate-700 text-slate-500"
            : "border-slate-200 text-slate-400"
        }`}
      >
        Fixed Assets Management System
      </footer>
    </section>
  );
}