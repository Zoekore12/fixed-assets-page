"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Building2,
  CircleDollarSign,
  ClipboardList,
  FileBarChart,
  History,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  ScanLine,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Wrench,
  CheckCircle2,
  X,
  Boxes,
  ChevronDown,
   Handshake ,
} from "lucide-react";

// Dashboard destinations by role
const dashboardRoutes = {
  administrator: "/dashboard",
  security: "/dashboard",
  hod: "/dashboard",
  hou: "/dashboard",
  staff: "/dashboard",
};

// Administrator navigation
const administratorNavigation = [
  { label: "Dashboard", href: dashboardRoutes.administrator, icon: LayoutDashboard },
  { label: "Buildings", href: "/buildings", icon: Building2 },
  { label: "Departments", href: "/departments", icon: Building2 },
  { label: "Units", href: "/units", icon: MapPin },
  { label: "Security Stations", href: "/security-station", icon: ShieldCheck },
  { label: "Verify Asset Exit", href: "/exit", icon: CheckCircle2 },
  { label: "Exit Requests", href: "/exit-request", icon: ListChecks },
  { label: "Transfers", href: "/transfer", icon: ArrowLeftRight },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Valuation", href: "/valuation", icon: CircleDollarSign},
  { label: "Reports", href: "/report", icon: FileBarChart },
  { label: "Audit Logs", href: "/audit", icon: History },
  { label: "User Management", href: "/user", icon: Users },  
];

// General staff navigation
const generalStaffNavigation = [
  { label: "Dashboard", href: dashboardRoutes.staff, icon: LayoutDashboard },
  { label: "My Assets", href: "/myassets", icon: Package },
  { label: "My Assignments", href: "/myassignment", icon: ClipboardList },
  { label: "Tracking & Transfers", href: "/transfers", icon: ArrowLeftRight },
  { label: "Exit Requests", href: "/exit-request", icon: ListChecks }, 
  { label: "Collected", href: "/complete", icon: CheckCircle2 },
  { label: "In-Possession", href: "/confirm-possesion", icon:Handshake},
  { label: "Maintenance Requests", href: "/usermaintenance", icon: Wrench },
  { label: "My valuation", href: "/myvaluation", icon: CircleDollarSign},
];

// Security staff navigation
const securityOfficerNavigation = [
  { label: "Dashboard", href: dashboardRoutes.security, icon: LayoutDashboard },
  { label: "Security Scan-In", href: "/scan", icon: ScanLine },
  { label: "Security Scan-Out", href: "/scan-out", icon: ScanLine },
  { label: "Asset Check-in", href: "/checkin", icon: ClipboardList },
  { label: "Asset Check-out", href: "/checkout", icon: ClipboardList },
  { label: "Transfers", href: "/transfers", icon: ArrowLeftRight },
];

// HOD navigation
const hodNavigation = [
  { label: "Dashboard", href: dashboardRoutes.hod, icon: LayoutDashboard },
  { label: "Department Assets", href: "/departmentassets", icon: Package },
  { label: "Department Assignments", href: "/hodassignment", icon: ClipboardList },
  { label: "Transfers", href: "/transfers", icon: ArrowLeftRight },
  { label: "Collected", href: "/complete", icon: CheckCircle2 },
  { label: "In-Possession", href: "/confirm-possesion", icon:Handshake},
  { label: "Maintenance Requests", href: "/usermaintenance", icon: Wrench },
  { label: "Reports", href: "/report", icon: FileBarChart },
  { label: "Department Valuation", href: "/myvaluation", icon: CircleDollarSign},
];

// HOU navigation
const houNavigation = [
  { label: "Dashboard", href: dashboardRoutes.hou, icon: LayoutDashboard },
  { label: "Unit Assets", href: "/unitassets", icon: Package },
  { label: "Unit Assignments", href: "/houassignment", icon: ClipboardList },
  { label: "Transfers", href: "/transfers", icon: ArrowLeftRight },
  { label: "Maintenance Requests", href: "/usermaintenance", icon: Wrench },
  { label: "Unit Valuation", href: "/myvaluation", icon: CircleDollarSign},
];

// Administrator-only asset management submenu
const assetManagementNavigation = [
  { label: "Assets", href: "/assets-management/assets", icon: Package },
  { label: "Asset Categories", href: "/assets-management/categories", icon: Tags },
  { label: "Asset Assignments", href: "/assets-management/assignments", icon: ClipboardList },
];

function normalizeRole(role) {
  const value = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (["administrator", "admin", "system administrator"].includes(value)) {
    return "administrator";
  }

  if (["hod", "head of department"].includes(value)) {
    return "hod";
  }

  if (["hou", "head of unit"].includes(value)) {
    return "hou";
  }

  if (["staff", "general staff", "normal staff", "user"].includes(value)) {
    return "staff";
  }

  return value;
}

export default function DashboardSidebar({
  mobileMenuOpen,
  onClose,
  role = "",
  staffType = "",
}) {
  const pathname = usePathname();

  const normalizedRole = normalizeRole(role);
  const normalizedStaffType = String(staffType ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  // SECURITY is a staff subtype, not a separate role.
  const isSecurityOfficer =
    normalizedRole === "staff" &&
    ["SECURITY", "SECURITY_OFFICER"].includes(normalizedStaffType);

  const effectiveRole = isSecurityOfficer
    ? "security"
    : normalizedRole;

  const navigationByRole = {
    administrator: administratorNavigation,
    security: securityOfficerNavigation,
    hod: hodNavigation,
    hou: houNavigation,
    staff: generalStaffNavigation,
  };

  const navigation = navigationByRole[effectiveRole] ?? [];

  const isAdministrator = effectiveRole === "administrator";

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const isAssetManagementActive = assetManagementNavigation.some(
    ({ href }) => isActive(href)
  );

  const [assetManagementOpen, setAssetManagementOpen] = useState(
    isAssetManagementActive
  );

  const isAssetManagementExpanded =
    assetManagementOpen || isAssetManagementActive;

  // Open the submenu automatically when navigating into Asset Management.
  useEffect(() => {
  const timer = setTimeout(() => {
    if (isAssetManagementActive) {
      setAssetManagementOpen(true);
    }
  }, 0);

  return () => clearTimeout(timer);
}, [isAssetManagementActive]);

  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close navigation menu"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          mobileMenuOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <Building2 size={25} strokeWidth={2} />
          </div>

          <div className="brand-copy">
            <span className="brand-name">FixedAssets</span>
            <span className="brand-subtitle">
              MANAGEMENT
            </span>
          </div>

          <button
            type="button"
            className="icon-button sidebar-close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-section-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {/* Dashboard is always the first navigation item. */}
          {navigation
            .filter(({ href }) =>
              href === dashboardRoutes[effectiveRole]
            )
            .map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${
                  isActive(href) ? "nav-link-active" : ""
                }`}
                onClick={onClose}
              >
                <span className="nav-link-icon">
                  <Icon size={19} strokeWidth={1.9} />
                </span>

                <span className="nav-link-label">{label}</span>

                {isActive(href) && (
                  <span className="active-indicator" />
                )}
              </Link>
            ))}

          {/* Only Administrators see the Asset Management submenu. */}
          {isAdministrator && (
            <div className="asset-management-menu">
              <button
                type="button"
                className={`nav-link w-full ${
                  isAssetManagementActive ? "nav-link-active" : ""
                }`}
                onClick={() =>
                  setAssetManagementOpen((previous) => !previous)
                }
                aria-expanded={isAssetManagementExpanded}
              >
                <span className="nav-link-icon">
                  <Boxes size={19} strokeWidth={1.9} />
                </span>

                <span className="nav-link-label">
                  Asset Management
                </span>

                <ChevronDown
                  size={15}
                  strokeWidth={2}
                  className={`ml-auto shrink-0 transition-transform duration-200 ${
                    isAssetManagementExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isAssetManagementExpanded && (
                <div className="asset-management-submenu">
                  {assetManagementNavigation.map(
                    ({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`nav-link ${
                          isActive(href) ? "nav-link-active" : ""
                        }`}
                        onClick={onClose}
                      >
                        <span className="nav-link-icon">
                          <Icon size={19} strokeWidth={1.9} />
                        </span>

                        <span className="nav-link-label">{label}</span>

                        {isActive(href) && (
                          <span className="active-indicator" />
                        )}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Remaining role-specific navigation items. */}
          {navigation
            .filter(
              ({ href }) => href !== dashboardRoutes[effectiveRole]
            )
            .map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${
                  isActive(href) ? "nav-link-active" : ""
                }`}
                onClick={onClose}
              >
                <span className="nav-link-icon">
                  <Icon size={19} strokeWidth={1.9} />
                </span>

                <span className="nav-link-label">{label}</span>

                {isActive(href) && (
                  <span className="active-indicator" />
                )}
              </Link>
            ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon">
              <ShieldCheck size={20} />
            </div>

            <p className="support-title">Asset security</p>

            <p className="support-text">
              Keep every ministry asset accounted for and traceable.
            </p>
          </div>

          <div className="sidebar-version">
            <span className="sidebar-version-dot" />
            Fixed Assets Management System
          </div>
        </div>
      </aside>
    </>
  );
}
