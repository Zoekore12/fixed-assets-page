"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  Landmark,
  ShieldCheck,
  PackageCheck,
  ArrowLeftRight,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api";

export default function LoginForm({ darkMode = false }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stationCode, setStationCode] = useState("");

  const textPrimary = darkMode ? "text-slate-100" : "text-[#172B4D]";

  const textSecondary = darkMode
    ? "text-slate-400"
    : "text-[#718096]";

  const cardStyle = darkMode
    ? "border-slate-800 bg-slate-900"
    : "border-[#E5EBF2] bg-white";

  const inputContainer = darkMode
    ? "border-slate-700 bg-slate-950 focus-within:border-[#1597E5] focus-within:ring-2 focus-within:ring-[#1597E5]/20"
    : "border-slate-200 bg-white focus-within:border-[#1597E5] focus-within:ring-2 focus-within:ring-[#1597E5]/10";

  const inputText = darkMode
    ? "text-slate-100 placeholder:text-slate-500"
    : "text-slate-900 placeholder:text-slate-400";

  const featureIconStyle = darkMode
    ? "bg-slate-800 text-[#1597E5]"
    : "bg-[#1597E5] text-white";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
        ...(stationCode.trim() && {
          station_code: stationCode.trim(),
        }),
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Login failed.");
      }

      sessionStorage.setItem(
        "loggedInUser",
        JSON.stringify(response.data.user)
      );

      window.dispatchEvent(new Event("user-change"));
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`w-full overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${cardStyle}`}
      >
        <div className="grid md:grid-cols-[1fr_0.85fr]">
          {/* Login form */}
          <section className="flex items-center justify-center px-5 py-7 sm:px-8 sm:py-8">
            <div className="w-full max-w-sm">
              {/* Brand */}
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-[#1597E5] text-white"
                      : "bg-[#1597E5] text-white"
                  }`}
                >
                  <Landmark size={22} />
                </div>

                <div>
                  <p className={`text-base font-bold ${textPrimary}`}>
                    FIXED ASSETS
                  </p>

                  <p
                    className={`text-[9px] font-bold tracking-[1.3px] ${textSecondary}`}
                  >
                   MANAGEMENT SYSTEM
                  </p>
                </div>
              </div>

              {/* Heading */}
              <div className="mb-5">
                <p className="mb-2 text-xs font-bold tracking-wider text-[#1597E5]">
                  SECURE STAFF PORTAL
                </p>

                <h1
                  className={`text-2xl font-bold tracking-tight ${textPrimary}`}
                >
                  Welcome back
                </h1>

                <p className={`mt-2 text-sm leading-5 ${textSecondary}`}>
                  Sign in to manage your assets.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className={`mb-1.5 block text-sm font-semibold ${textPrimary}`}
                  >
                    Email address
                  </label>

                  <div
                    className={`flex items-center gap-3 rounded-xl border px-3 transition-colors ${inputContainer}`}
                  >
                    <Mail
                      size={17}
                      className={`shrink-0 ${textSecondary}`}
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      disabled={loading}
                      className={`h-10 w-full bg-transparent text-sm outline-none disabled:opacity-60 ${inputText}`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className={`mb-1.5 block text-sm font-semibold ${textPrimary}`}
                  >
                    Password
                  </label>

                  <div
                    className={`flex items-center gap-3 rounded-xl border px-3 transition-colors ${inputContainer}`}
                  >
                    <LockKeyhole
                      size={17}
                      className={`shrink-0 ${textSecondary}`}
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      disabled={loading}
                      className={`h-10 w-full bg-transparent text-sm outline-none disabled:opacity-60 ${inputText}`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      disabled={loading}
                      className={`shrink-0 transition-colors ${
                        darkMode
                          ? "text-slate-400 hover:text-[#1597E5]"
                          : "text-slate-500 hover:text-[#1597E5]"
                      }`}
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional station code */}
                <div>
                  <label
                    htmlFor="stationCode"
                    className={`mb-1.5 flex flex-wrap gap-1.5 text-sm font-semibold ${textPrimary}`}
                  >
                    Station code
                    <span className={`font-normal ${textSecondary}`}>
                      (Optional)
                    </span>
                  </label>

                  <div
                    className={`flex items-center gap-3 rounded-xl border px-3 transition-colors ${inputContainer}`}
                  >
                    <Landmark
                      size={17}
                      className={`shrink-0 ${textSecondary}`}
                    />

                    <input
                      id="stationCode"
                      name="station_code"
                      type="text"
                      autoComplete="off"
                      placeholder="Enter station code"
                      value={stationCode}
                      onChange={(event) =>
                        setStationCode(event.target.value)
                      }
                      disabled={loading}
                      className={`h-10 w-full bg-transparent text-sm outline-none disabled:opacity-60 ${inputText}`}
                    />
                  </div>

                  <p className={`mt-1 text-xs leading-5 ${textSecondary}`}>
                    Enter your station code if your account requires station
                    access.
                  </p>
                </div>

                {/* Login error */}
                {error && (
                  <div
                    role="alert"
                    className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
                      darkMode
                        ? "border-red-900 bg-red-950/50 text-red-300"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 text-sm font-semibold text-white transition hover:bg-[#1085CC] focus:outline-none focus:ring-2 focus:ring-[#1597E5] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight size={17} />}
                </button>

                {/* Security notice */}
                <div
                  className={`flex items-center justify-center gap-2 pt-1 text-xs ${textSecondary}`}
                >
                  <ShieldCheck size={15} className="text-[#1597E5]" />
                  Authorized personnel only
                </div>
              </form>
            </div>
          </section>

          {/* Information panel */}
          <aside
            className={`hidden flex-col justify-between border-l p-7 transition-colors duration-300 md:flex ${
              darkMode
                ? "border-slate-800 bg-slate-950"
                : "border-slate-200 bg-[#F4F7FB]"
            }`}
          >
            <div>
              <div
                className={`mb-6 flex h-11 w-11 items-center justify-center rounded-xl ${
                  darkMode
                    ? "bg-slate-900 text-[#1597E5]"
                    : "bg-blue-50 text-[#1597E5]"
                }`}
              >
                <ShieldCheck size={24} />
              </div>

              <h2
                className={`text-2xl font-bold leading-tight ${textPrimary}`}
              >
                Every asset.
                <br />
                <span className="text-[#1597E5]">Accounted for.</span>
              </h2>

              <p className={`mt-3 text-sm leading-6 ${textSecondary}`}>
                Manage equipment, track movements, and maintain reliable
                asset records in one place.
              </p>
            </div>

            {/* Features */}
            <div className="my-7 space-y-3">
              {[
                {
                  icon: PackageCheck,
                  title: "Asset accountability",
                  description: "Keep equipment registered and traceable.",
                },
                {
                  icon: ArrowLeftRight,
                  title: "Movement tracking",
                  description: "Monitor transfers and checkouts.",
                },
                {
                  icon: ClipboardCheck,
                  title: "Reliable records",
                  description: "Support reporting and audits.",
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${cardStyle}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${featureIconStyle}`}
                  >
                    <Icon size={19} />
                  </div>

                  <div>
                    <p className={`text-sm font-semibold ${textPrimary}`}>
                      {title}
                    </p>

                    <p className={`mt-0.5 text-xs leading-5 ${textSecondary}`}>
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p
              className={`border-t pt-4 text-xs ${
                darkMode
                  ? "border-slate-800 text-slate-400"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              Fixed Assets Management System
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}