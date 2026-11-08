"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function ViewMyProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/users/view ");
      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to retrieve your profile."
        );
      }

      if (!result?.user) {
        throw new Error("Profile information was not returned.");
      }

      setUser(result.user);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to retrieve your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
     const timer =setTimeout(()=>{
      fetchProfile();
    },0);

    return ()=>clearTimeout(timer);  
  }, []);

  // Supports common email-verification field names without
  // assuming that the backend returns one specific field.
  const emailVerified =
    user?.email_verified ??
    user?.is_email_verified ??
    user?.emailVerified ??
    null;

  const displayValue = (value) =>
    value !== null && value !== undefined && String(value).trim()
      ? value
      : "Not provided";

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-4xl space-y-6">
        {/* Page heading */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1597E5]/10 text-[#1597E5] dark:bg-[#1597E5]/20 dark:text-[#1597E5]">
            <UserRound size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              View My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View your personal information and account details.
            </p>
          </div>
        </div>

        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1597E5] transition hover:text-[#117FC2] dark:text-[#1597E5] dark:hover:text-[#117FC2]"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="dashboard-card flex min-h-64 items-center justify-center rounded-2xl border p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <LoaderCircle
                size={30}
                className="animate-spin text-blue-600"
              />
              <p className="text-sm">Loading your profile...</p>
            </div>
          </div>
        )}

        {/* Profile content */}
        {!loading && user && (
          <>
            {/* Profile overview */}
            <div className="dashboard-card overflow-hidden rounded-2xl border shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50/80 p-6 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                      <UserRound size={32} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        {displayValue(user.name)}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {displayValue(user.email)}
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.is_active === true
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : user.is_active === false
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {user.is_active === true
                          ? "Active Account"
                          : user.is_active === false
                            ? "Inactive Account"
                            : "Account Status Unavailable"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/edit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
                  >
                    <Pencil size={16} />
                    Edit Profile
                  </Link>
                </div>
              </div>

              {/* Personal information */}
              <div className="p-6">
                <div className="mb-5">
                  <h3 className="text-base font-semibold">
                    Personal Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your registered contact details.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <ProfileField
                    icon={<UserRound size={19} />}
                    label="Full Name"
                    value={displayValue(user.name)}
                  />

                  <ProfileField
                    icon={<Mail size={19} />}
                    label="Email Address"
                    value={displayValue(user.email)}
                  />

                  <ProfileField
                    icon={<Phone size={19} />}
                    label="Phone Number"
                    value={displayValue(user.phone)}
                  />
                </div>
              </div>
            </div>

            {/* Account information */}
            <div className="dashboard-card rounded-2xl border p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1597E5]/10 text-[#1597E5] dark:bg-[#1597E5]/20 dark:text-[#1597E5]">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <h3 className="font-semibold">Account Information</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Your system role and account details.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <ProfileField
                  label="Role"
                  value={displayValue(user.role)}
                />

                <ProfileField
                  label="Staff Type"
                  value={displayValue(user.staff_type)}
                />

                {user.building_name !== undefined && (
                  <ProfileField
                    label="Building"
                    value={displayValue(user.building_name)}
                  />
                )}

                {user.department_name !== undefined && (
                  <ProfileField
                    label="Department"
                    value={displayValue(user.department_name)}
                  />
                )}

                {user.unit_name !== undefined && (
                  <ProfileField
                    label="Unit"
                    value={displayValue(user.unit_name)}
                  />
                )}

                {user.station_name !== undefined && (
                  <ProfileField
                    label="Security Station"
                    value={displayValue(user.station_name)}
                  />
                )}
              </div>
            </div>

            {/* Email verification */}
            <div className="dashboard-card rounded-2xl border p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1597E5]/10 text-[#1597E5] dark:bg-[#1597E5]/20 dark:text-[#1597E5]">
                    <Mail size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Email Verification
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Verify your registered email address to help
                      confirm ownership of your account email.
                    </p>

                    <div className="mt-3">
                      {emailVerified === true ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                          <CheckCircle2 size={14} />
                          Verified
                        </span>
                      ) : emailVerified === false ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <Clock size={14} />
                          Not Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Clock size={14} />
                          Check Verification Status
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href="/verification"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#1597E5] px-4 py-2.5 text-sm font-semibold text-[#1597E5] transition hover:bg-[#1597E5]/10 dark:border-[#1597E5] dark:text-[#1597E5] dark:hover:bg-[#1597E5]/20"
                >
                  <ShieldCheck size={17} />
                  {emailVerified === true
                    ? "View Verification"
                    : "Verify Email"}
                </Link>
              </div>
            </div>

            {/* Refresh profile */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={fetchProfile}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw size={16} />
                Refresh Profile
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400 dark:border-slate-700">
          Ministry Fixed Assets Management System
        </footer>
      </section>
    </DashboardLayout>
  );
}

function ProfileField({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {icon && (
        <div className="mt-0.5 shrink-0 text-slate-400">
          {icon}
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}
