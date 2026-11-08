"use client";

import { useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import {
  ArrowLeft,
  ArrowRightLeft,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Info,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function ConfirmMoverPossessionPage() {
  const router = useRouter();

  const [movementId, setMovementId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);

  const movement =
    result?.movement ||
    result?.data?.movement ||
    null;

  const asset =
    movement?.asset ||
    result?.asset ||
    null;

  const assetName =
    asset?.asset_name ||
    asset?.name ||
    movement?.asset_name ||
    movement?.asset?.name ||
    "Asset details not returned";

  const assetTag =
    asset?.asset_tag ||
    asset?.tag ||
    movement?.asset_tag ||
    "Not provided";

  const transferStatus =
    movement?.movement_status ||
    movement?.status ||
    "Not provided";

  const moverName =
    movement?.mover_name ||
    movement?.moved_by_name ||
    movement?.mover?.full_name ||
    movement?.mover?.name ||
    "The authenticated mover";

  const destinationBuilding =
    movement?.to_building_name ||
    movement?.destination_building_name ||
    movement?.toBuilding?.name ||
    "Not provided";

  const destinationDepartment =
    movement?.to_department_name ||
    movement?.destination_department_name ||
    movement?.toDepartment?.name ||
    "Not provided";

  const destinationUnit =
    movement?.to_unit_name ||
    movement?.destination_unit_name ||
    movement?.toUnit?.name ||
    "Not provided";

  const handleConfirmPossession = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");
    setResult(null);

    const id = movementId.trim();

    if (!id) {
      setError("Please enter the transfer movement ID.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.patch(
        `/transfers/transfers/${encodeURIComponent(id)}/confirm-possession`
      );

      const data = response?.data;

      if (data?.success === false) {
        setError(
          data?.message || "Unable to confirm possession of the asset."
        );
        return;
      }

      setResult(data);
      setNotice(
        data?.message || "Mover confirmed possession of the asset."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setMovementId("");
    setError("");
    setNotice("");
    setResult(null);
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page Heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1597E5]"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                <Package size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Confirm Mover Possession
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Confirm that you have received the asset for its authorized transfer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

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

        {/* Success Message */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notice}</p>

              {movement?.id && (
                <p className="mt-1 text-xs">
                  Movement ID: {movement.id}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          {/* Main Form */}
          <section className="dashboard-card overflow-hidden rounded-2xl border shadow-sm xl:col-span-2">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700">
              <h2 className="text-lg font-semibold">
                Mover Confirmation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the movement ID assigned to the transfer.
              </p>
            </div>

            <form
              onSubmit={handleConfirmPossession}
              className="space-y-6 p-5"
            >
              {/* Movement ID */}
              <div>
                <label
                  htmlFor="movement_id"
                  className="mb-2 block text-sm font-semibold"
                >
                  Transfer Movement ID{" "}
                  <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <ArrowRightLeft
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="movement_id"
                    name="movement_id"
                    type="text"
                    required
                    value={movementId}
                    onChange={(event) =>
                      setMovementId(event.target.value)
                    }
                    placeholder="Enter the transfer movement ID"
                    disabled={submitting || Boolean(notice)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Use the movement ID provided by your transfer record.
                </p>
              </div>

              {/* Returned Transfer Details */}
              {movement && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                      <Package size={19} />
                    </div>

                    <h3 className="font-semibold">
                      Transfer Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Asset"
                      value={assetName}
                    />

                    <DetailItem
                      label="Asset Tag"
                      value={assetTag}
                    />

                    <DetailItem
                      label="Transfer Status"
                      value={transferStatus}
                    />

                    <DetailItem
                      label="Mover"
                      value={moverName}
                    />

                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:col-span-2">
                      <p className="text-xs font-medium text-slate-500">
                        Destination
                      </p>

                      <div className="mt-3 space-y-3">
                        <DetailItem
                          label="Building"
                          value={destinationBuilding}
                        />

                        <DetailItem
                          label="Department"
                          value={destinationDepartment}
                        />

                        <DetailItem
                          label="Unit"
                          value={destinationUnit}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Information */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={21}
                    className="mt-0.5 shrink-0 text-[#1597E5]"
                  />

                  <div>
                    <h3 className="font-semibold">
                      Confirm possession
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Proceed only if you are the assigned mover and have
                      physically received the asset for transportation.
                      The backend will validate the transfer and your identity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw size={16} />
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    Boolean(notice) ||
                    !movementId.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed "
                >
                  {submitting ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {submitting
                    ? "Confirming..."
                    : "Confirm Possession"}
                </button>
              </div>
            </form>
          </section>

          {/* Information Panel */}
          <aside className="space-y-5">
            {/* Mover Checklist */}
            <div className="dashboard-card rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
                  <ClipboardCheck size={21} />
                </div>

                <h2 className="font-semibold">
                  Mover Checklist
                </h2>
              </div>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-500">
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Verify the transfer movement ID.
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Ensure the asset has been handed over to you.
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Confirm that the destination is correct.
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Keep the asset secure during transportation.
                </li>

                <li className="flex items-start gap-2">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Deliver the asset to the designated receiving location.
                </li>
              </ul>
            </div>

            {/* Important Information */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
              <div className="flex items-start gap-3">
                <Info
                  size={21}
                  className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
                />

                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                    Important
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
                    Confirming possession does not complete the transfer.
                    The receiving process must still take place before
                    the transfer is completed.
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

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold">
        {value == null || value === "" ? "—" : String(value)}
      </p>
    </div>
  );
}