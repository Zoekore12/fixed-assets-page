"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function ChangeMyPasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function togglePasswordVisibility(field) {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Your new password exceeds the maximum supported length.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "Your new password must be different from your current password."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.patch("/users/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Failed to change your password."
        );
      }

      setSuccess(
        result?.message ||
          "Your password has been changed successfully."
      );

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to change your password."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderPasswordField(name, label, placeholder) {
    return (
      <div>
        <label
          htmlFor={name}
          className="mb-2 block text-sm font-medium"
        >
          {label}
        </label>

        <div className="relative">
          <input
            id={name}
            name={name}
            type={showPasswords[name] ? "text" : "password"}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            autoComplete={
              name === "currentPassword"
                ? "current-password"
                : "new-password"
            }
            required
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-950"
          />

          <button
            type="button"
            onClick={() => togglePasswordVisibility(name)}
            aria-label={
              showPasswords[name] ? "Hide password" : "Show password"
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
          >
            {showPasswords[name] ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-3xl space-y-6">
        {/* Page heading */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
            <KeyRound size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Change My Password
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update your password to help keep your account secure.
            </p>
          </div>
        </div>

        {/* Back navigation */}
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

        {/* Success message */}
        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

            <span className="flex-1">{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Password form */}
        <div className="dashboard-card rounded-2xl border p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2 className="font-semibold">Password Security</h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Enter your current password, then choose and confirm
                your new password.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {renderPasswordField(
              "currentPassword",
              "Current Password",
              "Enter your current password"
            )}

            <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
              <p className="mb-4 text-xs leading-5 text-slate-500">
                Your new password must be at least 8 characters long
                and different from your current password.
              </p>

              <div className="space-y-5">
                {renderPasswordField(
                  "newPassword",
                  "New Password",
                  "Enter your new password"
                )}

                {renderPasswordField(
                  "confirmPassword",
                  "Confirm New Password",
                  "Re-enter your new password"
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <KeyRound size={17} />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-[#1597E5]/70 p-4 dark:border-blue-900 dark:bg-[#1597E5]/70">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#1597E5] dark:[#1597E5]/300"
          />

          <p className="text-sm leading-6 text-white-600 dark:text-slate-300">
            Your current password is verified by the server before
            your new password is saved. Keep your password private
            and do not share it with anyone.
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400 dark:border-slate-700">
          Ministry Fixed Assets Management System
        </footer>
      </section>
    </DashboardLayout>
  );
}
