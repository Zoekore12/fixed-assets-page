"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function EmailVerificationPage() {
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function clearMessages() {
    setError("");
    setNotice("");
  }

  async function handleSendCode() {
    clearMessages();
    setSending(true);

    try {
      const response = await api.post(
        "/email-verification/send-code"
      );

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Unable to send the verification code."
        );
      }

      setCodeSent(true);
      setCode("");
      setNotice(
        result?.message ||
          "A verification code has been sent to your registered email address."
      );
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to send the verification code.";

      setError(message);

      if (message.toLowerCase().includes("already verified")) {
        setVerified(true);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyEmail(event) {
    event.preventDefault();
    clearMessages();

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code sent to your email.");
      return;
    }

    setVerifying(true);

    try {
      const response = await api.post(
        "/email-verification/verify-email",
        { code }
      );

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message || "Email verification failed."
        );
      }

      setVerified(true);
      setCodeSent(false);
      setCode("");
      setNotice(
        result?.message || "Your email has been verified successfully."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to verify your email. Check the code and try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  function handleCodeChange(event) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError("");
  }

  return (
    <DashboardLayout>
      <section className="mx-auto max-w-3xl space-y-6">
        {/* Page heading */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
            <ShieldCheck size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Email Verification
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Verify your registered email address to help confirm
              ownership of your account email.
            </p>
          </div>
        </div>

        {/* Back to settings */}
        <Link
          href="/viewprofile"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1597E5] transition hover:text-[#1177C2] dark:text-white dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Profile
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
              className="text-red-600 transition hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
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
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />

            <span className="flex-1">{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
              className="text-green-600 transition hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Verification status */}
        <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Mail size={24} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Registered Email Address
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Request a verification code and enter it below to
                  confirm ownership of your email address.
                </p>
              </div>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                verified
                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {verified ? (
                <CheckCircle2 size={14} />
              ) : (
                <Clock size={14} />
              )}

              {verified ? "Verified" : "Not verified"}
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {verified
                ? "Your email address is verified."
                : "Email verification is optional."}
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {verified
                ? "Your email verification has been completed successfully."
                : "You can continue using the system without verifying your email. Verification codes expire after 10 minutes."}
            </p>
          </div>

          {!verified && (
            <>
              {/* Send verification code */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending || verifying}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1177C2] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {sending ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : codeSent ? (
                    <RefreshCw size={18} />
                  ) : (
                    <Mail size={18} />
                  )}

                  {sending
                    ? "Sending Code..."
                    : codeSent
                    ? "Resend Verification Code"
                    : "Send Verification Code"}
                </button>
              </div>

              {/* Enter verification code */}
              {codeSent && (
                <form
                  onSubmit={handleVerifyEmail}
                  className="mt-7 space-y-5 border-t border-slate-200 pt-6 dark:border-slate-700"
                >
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Enter Verification Code
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Check your registered email inbox and enter the
                      six-digit code. If you cannot find it, check your
                      spam or junk folder.
                    </p>
                  </div>

                  <div className="max-w-sm space-y-2">
                    <label
                      htmlFor="verification-code"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Six-digit code
                    </label>

                    <input
                      id="verification-code"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={code}
                      onChange={handleCodeChange}
                      placeholder="000000"
                      required
                      disabled={verifying}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                    />

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      The code expires 10 minutes after it is created.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={verifying || sending || code.length !== 6}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifying ? (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <ShieldCheck size={18} />
                      )}

                      {verifying ? "Verifying..." : "Verify Email"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCode("");
                        clearMessages();
                        setCodeSent(false);
                      }}
                      disabled={verifying}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {verified && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>
                Email verification complete. No further action is required.
              </span>
            </div>
          )}
        </div>

        {/* Security information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-[#1597E5] dark:text-[#1597E5]"
            />

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Account Security
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Never share your verification code with anyone. Only enter
                it on the official Ministry Fixed Assets Management System.
                Your code is temporary and expires after 10 minutes.
              </p>
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-200 pt-5 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Ministry Fixed Assets Management System
        </footer>
      </section>
    </DashboardLayout>
  );
}
