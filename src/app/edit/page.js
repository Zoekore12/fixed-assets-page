"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function EditProfilePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [initialData, setInitialData] = useState({
    name: "",
    phone: "",
  });

  // Load the authenticated user's current profile.
  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/users/view");
        const result = response?.data ?? response;

        if (result?.success === false) {
          throw new Error(
            result.message || "Unable to load your profile."
          );
        }

        if (!result?.user) {
          throw new Error("Profile information was not returned.");
        }

        const profile = {
          name: result.user.name || "",
          phone: result.user.phone || "",
        };

        if (!cancelled) {
          setFormData(profile);
          setInitialData(profile);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load your profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setNotice("");
  }

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function handleReset() {
    setFormData(initialData);
    clearMessages();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearMessages();

    const name = formData.name.trim();
    const phone = formData.phone.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (name.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    if (!phone) {
      setError("Phone number is required.");
      return;
    }

    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.patch("/users/edit", {
        name,
        phone,
      });

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to update your profile."
        );
      }

      const updatedProfile = {
        name: result?.user?.name ?? name,
        phone: result?.user?.phone ?? phone,
      };

      setFormData(updatedProfile);
      setInitialData(updatedProfile);

      setNotice(
        result?.message ||
          "Your profile has been updated successfully."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    formData.name.trim() !== initialData.name.trim() ||
    formData.phone.trim() !== initialData.phone.trim();

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-3xl space-y-6">
        {/* Page heading */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/950 dark:text-white">
            <Pencil size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Edit My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update your personal information and contact details.
            </p>
          </div>
        </div>

        {/* Back to profile */}
        <Link
          href="/viewprofile"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft size={16} />
          Back to My Profile
        </Link>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0"
            />

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
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span className="flex-1">{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="dashboard-card flex min-h-64 items-center justify-center rounded-2xl border p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <LoaderCircle
                size={30}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm">Loading your profile...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Edit form */}
            <form
              onSubmit={handleSubmit}
              className="dashboard-card overflow-hidden rounded-2xl border shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50/80 p-6 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/950 dark:text-white">
                    <UserRound size={25} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Personal Information
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Edit your name and phone number below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {/* Full name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold"
                  >
                    Full Name
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <UserRound
                      size={19}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      maxLength={100}
                      autoComplete="name"
                      required
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Maximum 100 characters.
                  </p>
                </div>

                {/* Phone number */}
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold"
                  >
                    Phone Number
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <Phone
                      size={19}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+2348012345678"
                      autoComplete="tel"
                      required
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Include your country code when applicable.
                  </p>
                </div>

                {/* Read-only information */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-sm font-semibold">
                    Profile update permissions
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    This page only updates your name and phone number.
                    Your email address, role, staff type, and other
                    account permissions cannot be changed here.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving || !hasChanges}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Reset Changes
                  </button>

                  <button
                    type="submit"
                    disabled={saving || loading || !hasChanges}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={18} />
                    )}

                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>

            {/* Security information */}
            <div className="rounded-2xl border border-blue-100 bg-[#1597E5]/70 p-5 dark:border-blue-900 dark:bg-[#1597E5]/30">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-[#1597E5] dark:text-[#1597E5]/950"
                />

                <div>
                  <h3 className="font-semibold text-white dark:text-white/90">
                    Your Account Security
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-white dark:text-white/90">
                    Your changes apply only to your authenticated
                    account. Never share your login credentials with
                    another person.
                  </p>
                </div>
              </div>
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
