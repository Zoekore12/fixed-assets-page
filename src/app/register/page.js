"use client";

import { useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  X,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const THEME_KEY = "dashboard-theme";

function subscribeToTheme(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("theme-change", callback);
  };
}

function getThemeSnapshot() {
  return localStorage.getItem(THEME_KEY) === "dark";
}

function getServerThemeSnapshot() {
  return false;
}

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);

  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  function setDarkMode(value) {
    const nextDarkMode =
      typeof value === "function" ? value(darkMode) : value;

    const theme = nextDarkMode ? "dark" : "light";

    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    window.dispatchEvent(new Event("theme-change"));
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
    if (emailAlreadyExists) setEmailAlreadyExists(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setEmailAlreadyExists(false);

    const { name, email, password, phone } = formData;

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || null,
      });

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to create your account."
        );
      }

      setSuccess(
        result?.message || "Your account has been registered successfully."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
      });

      setTimeout(() => {
        router.push("/Login");
      }, 1800);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 409) {
        setEmailAlreadyExists(true);
        setError("This email address is already registered.");
      } else if (status === 400) {
        setError(
          err?.response?.data?.message ||
            "Please provide a valid name, email and password."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-6 transition-colors duration-300 sm:px-6 ${
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-[#F4F7FB] text-slate-900"
      }`}
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#1597E5]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#1597E5]/10 blur-3xl" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setDarkMode((previous) => !previous)}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={darkMode ? "Light mode" : "Dark mode"}
        className={`absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition sm:right-6 sm:top-6 ${
          darkMode
            ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        <span className="hidden sm:inline">
          {darkMode ? "Light Mode" : "Dark Mode"}
        </span>
      </button>

      {/* Centered registration content */}
      <section className="relative z-10 my-auto w-full max-w-2xl space-y-4 pt-10 sm:pt-6">
        {/* Heading */}
        <header className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5]/30 dark:text-white/950">
            <ShieldCheck size={25} />
          </div>

          <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
            Create Your Account
          </h1>

          <p
            className={`mt-1 text-sm ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Register your Staff account to access the Ministry Fixed Assets
            Management System.
          </p>
        </header>

        {/* Back to home */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p>{error}</p>

              {emailAlreadyExists && (
                <Link
                  href="/Login"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#1597E5] px-4 py-2 font-semibold text-white transition hover:bg-[#1597E5]/80"
                >
                  Sign In Instead
                  <ArrowLeft size={15} className="rotate-180" />
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setEmailAlreadyExists(false);
              }}
              aria-label="Dismiss error"
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">{success}</p>
              <p className="mt-1">
                Redirecting you to the sign-in page...
              </p>
            </div>
          </div>
        )}

        {/* Registration card */}
        <div
          className={`dashboard-card rounded-2xl border p-5 shadow-sm sm:p-6 ${
            darkMode
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Staff Registration</h2>
            <p
              className={`mt-1 text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Enter your details below to create an account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Two-column layout on larger screens */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Full name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                    maxLength={150}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:focus:ring-blue-950 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    maxLength={254}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:focus:ring-blue-950 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Phone Number{" "}
                  <span className="font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 08012345678"
                    disabled={loading}
                    maxLength={30}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:focus:ring-blue-950 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    disabled={loading}
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:focus:ring-blue-950 ${
                      darkMode
                        ? "border-slate-700 bg-slate-950"
                        : "border-slate-200 bg-white"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <p
                  className={`mt-1 text-xs ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Use a password that is difficult for others to guess.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || Boolean(success)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1597E5]/80 focus:outline-none focus:ring-2 focus:ring-[#1597E5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={18} />
                  Account Created
                </>
              ) : (
                <>
                  Create Staff Account
                  <ArrowLeft size={16} className="rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div
            className={`mt-4 border-t pt-4 text-center ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            <p
              className={`text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Already have an account?{" "}
              <Link
                href="/Login"
                className="font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Compact security note and footer */}
        <footer
          className={`flex items-center justify-center gap-2 text-center text-xs ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <ShieldCheck size={14} className="shrink-0 text-[#1597E5]" />
          <span>
            Ministry Fixed Assets Management System · Secure Staff Registration
          </span>
        </footer>
      </section>
    </main>
  );
}