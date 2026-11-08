"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Package,
  MapPin,
  CalendarDays,
  FileText,
  Send,
  Loader2,
  X,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const getAssetData = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.assets)) return payload.assets;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
};

export default function NewExitRequestPage() {
  const router = useRouter();

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");

  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const [minReturnDate] = useState(() => {
    const minimumDate = new Date(Date.now() + 60000);
    return minimumDate.toISOString().slice(0, 16);
  });

  useEffect(() => {
    let cancelled = false;

    const fetchAssets = async () => {
      setLoadingAssets(true);
      setError("");

      try {
        const response = await api.get("/assets");
        const assetList = getAssetData(response);

        if (!cancelled) {
          const availableAssets = assetList.filter((asset) => {
            const status = String(asset.status || "")
              .trim()
              .toUpperCase();

            return (
              asset.is_active !== false &&
              asset.is_active !== 0 &&
              ["ASSIGNED"].includes(status)
            );
          });

          setAssets(availableAssets);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            `${getErrorMessage(err)} If necessary, check your asset-list API endpoint.`
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAssets(false);
        }
      }
    };

    fetchAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAsset = assets.find(
    (asset) => String(asset.id) === String(assetId)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");
    setSubmittedRequest(null);

    if (!assetId) {
      setError("Please select an asset.");
      return;
    }

    if (!destination.trim()) {
      setError("Please enter the destination.");
      return;
    }

    if (!reason.trim()) {
      setError(
        "Please explain why you need to take the asset outside the office."
      );
      return;
    }

    if (expectedReturnDate) {
      const selectedDate = new Date(expectedReturnDate);

      if (Number.isNaN(selectedDate.getTime())) {
        setError("Please enter a valid expected return date.");
        return;
      }

      if (selectedDate.getTime() <= Date.now()) {
        setError("The expected return date must be in the future.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        destination: destination.trim(),
        reason: reason.trim(),
        expected_return_date: expectedReturnDate
          ? new Date(expectedReturnDate).toISOString()
          : null,
        notes: notes.trim() || null,
      };

      const response = await api.post(
        `/assets/${assetId}/exit/request`,
        payload
      );

      const responseData = response?.data;
      const requestData = responseData?.data || null;

      setSubmittedRequest(requestData);
      setNotice(
        responseData?.message ||
          "Your checkout request has been submitted successfully."
      );

      setAssetId("");
      setDestination("");
      setReason("");
      setExpectedReturnDate("");
      setNotes("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAssetId("");
    setDestination("");
    setReason("");
    setExpectedReturnDate("");
    setNotes("");
    setError("");
    setNotice("");
    setSubmittedRequest(null);
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-[#1597E5]/20";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition hover:text-[#1597E5] dark:text-slate-300 dark:hover:text-[#1597E5]"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white">
                <FileText size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                  Submit Exit Request
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Request permission to take an assigned asset outside the
                  office.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error alert */}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded p-1 transition hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success alert */}

        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notice}</p>

              {submittedRequest?.id && (
                <p className="mt-1 text-xs">
                  Request reference: {submittedRequest.id}
                </p>
              )}

              <p className="mt-1 text-xs">
                {String(
                  submittedRequest?.authorization_status ||
                    submittedRequest?.status ||
                    ""
                ).toUpperCase() === "APPROVED"
                  ? "Your request has been approved."
                  : "You can check the request status from your exit requests page."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
              className="rounded p-1 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          {/* Request form */}

          <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-2">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Checkout Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Complete the fields below to submit your request.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
              {/* Asset selection */}

              <div>
                <label htmlFor="asset_id" className={labelClass}>
                  Select Asset <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Package
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="asset_id"
                    name="asset_id"
                    required
                    value={assetId}
                    onChange={(event) => setAssetId(event.target.value)}
                    disabled={loadingAssets || submitting}
                    className={`${inputClass} appearance-none pl-10 pr-4`}
                  >
                    <option value="">
                      {loadingAssets
                        ? "Loading assigned assets..."
                        : "Choose an asset"}
                    </option>

                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_name ||
                          asset.name ||
                          asset.product_name ||
                          "Asset"}{" "}
                        — Tag: {asset.asset_tag || asset.tag || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>

                {!loadingAssets && assets.length === 0 && !error && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No assigned assets were returned by the asset API.
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Only assigned assets are shown. The backend will verify that
                  the selected asset is eligible for checkout.
                </p>
              </div>

              {/* Selected asset preview */}

              {selectedAsset && (
                <div className="rounded-xl border border-[#1597E5]/30 bg-sky-50 p-4 dark:border-[#1597E5]/40 dark:bg-slate-800/70">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2.5 text-[#1597E5] dark:bg-slate-900">
                      <Package size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {selectedAsset.asset_name ||
                          selectedAsset.name ||
                          selectedAsset.product_name ||
                          "Asset"}
                      </p>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Asset tag:{" "}
                        {selectedAsset.asset_tag || selectedAsset.tag || "—"}
                      </p>

                      {selectedAsset.serial_number && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Serial number: {selectedAsset.serial_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Destination */}

              <div>
                <label htmlFor="destination" className={labelClass}>
                  Destination <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    id="destination"
                    name="destination"
                    type="text"
                    required
                    maxLength={255}
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    disabled={submitting}
                    placeholder="e.g. Client Office, Abuja"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Reason */}

              <div>
                <label htmlFor="reason" className={labelClass}>
                  Reason for Checkout <span className="text-red-500">*</span>
                </label>

                <textarea
                  id="reason"
                  name="reason"
                  required
                  rows={4}
                  maxLength={2000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={submitting}
                  placeholder="Explain why this asset needs to be taken outside the office..."
                  className={`${inputClass} resize-y`}
                />

                <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
                  {reason.length}/2000
                </p>
              </div>

              {/* Expected return date */}

              <div>
                <label
                  htmlFor="expected_return_date"
                  className={labelClass}
                >
                  Expected Return Date and Time
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    id="expected_return_date"
                    name="expected_return_date"
                    type="datetime-local"
                    value={expectedReturnDate}
                    min={minReturnDate}
                    onChange={(event) =>
                      setExpectedReturnDate(event.target.value)
                    }
                    disabled={submitting}
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Optional. Leave blank if the return date is not yet known.
                </p>
              </div>

              {/* Additional notes */}

              <div>
                <label htmlFor="notes" className={labelClass}>
                  Additional Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  maxLength={2000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={submitting}
                  placeholder="Add any other information relevant to this request..."
                  className={`${inputClass} resize-y`}
                />
              </div>

              {/* Form actions */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={submitting || loadingAssets || assets.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Send size={17} />
                  )}

                  {submitting ? "Submitting Request..." : "Submit Exit Request"}
                </button>
              </div>
            </form>
          </div>

          {/* Information panel */}

          <aside className="space-y-5">
            <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#1597E5] p-2.5 text-white">
                  <Info size={21} />
                </div>

                <h2 className="font-bold text-slate-900 dark:text-slate-100">
                  Before You Submit
                </h2>
              </div>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-emerald-500"
                  />
                  Select the asset assigned to you.
                </li>

                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-emerald-500"
                  />
                  Enter the destination where the asset will be taken.
                </li>

                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-emerald-500"
                  />
                  Provide a clear reason for the checkout.
                </li>

                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-emerald-500"
                  />
                  Provide an expected return date when possible.
                </li>
              </ul>
            </div>

            {/* Approval and security notice */}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={21}
                  className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                />

                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                    Approval and Security
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
                    Staff requests are submitted for review. Your asset must
                    still pass the required checkout and security verification
                    process before it leaves the office.
                  </p>

                  <p className="mt-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                    Administrator requests are automatically approved by your
                    backend.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </DashboardLayout>
  );
}