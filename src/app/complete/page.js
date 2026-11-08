
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Info,
  ShieldCheck,
  ClipboardCheck,
  Camera,
  ScanLine,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function CompleteTransferPage() {
  const router = useRouter();
  const scannerRef = useRef(null);
  const scanInProgressRef = useRef(false);
  const mountedRef = useRef(false);

  const [assetTag, setAssetTag] = useState("");
  const [movementId, setMovementId] = useState("");
  const [movement, setMovement] = useState(null);

  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const asset =
    movement?.asset ||
    movement?.movement?.asset ||
    null;

  const assetName =
    asset?.asset_name ||
    asset?.name ||
    movement?.asset_name ||
    movement?.movement?.asset_name ||
    "Asset details not returned";

  const displayAssetTag =
    asset?.asset_tag ||
    asset?.tag ||
    movement?.asset_tag ||
    assetTag;

  const transferStatus =
    movement?.movement_status ||
    movement?.status ||
    "Not provided";

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

  // Stop the camera when the page is unmounted.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;
      scannerRef.current = null;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear().catch(() => {});
          });
      }
    };
  }, []);

  // Find the transfer associated with the scanned asset.
  const handleScan = useCallback(async (decodedText) => {
    const scannedValue = decodedText.trim();

    if (!scannedValue || scanInProgressRef.current) return;

    scanInProgressRef.current = true;

    setError("");
    setNotice("");
    setMovement(null);
    setMovementId("");
    setAssetTag(scannedValue);
    setLookingUp(true);

    try {
      const response = await api.get(
        `/scan/scan-in/${encodeURIComponent(scannedValue)}`
      );

      if (!mountedRef.current) return;

      const payload = response?.data;

      if (payload?.success === false) {
        throw new Error(payload?.message || "Transfer lookup failed.");
      }

      const transfer =
        payload?.movement ||
        payload?.data?.movement ||
        null;

      if (!transfer) {
        throw new Error(
          "No transfer movement was returned for this asset. Check the destination lookup endpoint."
        );
      }

      const id = transfer.id || transfer.movement_id;

      if (!id) {
        throw new Error(
          "The transfer was found, but its movement ID was not returned."
        );
      }

      setMovement(transfer);
      setMovementId(String(id));
      setNotice(
        "Asset QR code scanned. Verify the asset and destination before confirming receipt."
      );
    } catch (err) {
      if (!mountedRef.current) return;

      setError(
        err?.response?.status === 404
          ? "No matching transfer was found for this asset at the destination."
          : getErrorMessage(err)
      );
    } finally {
      if (mountedRef.current) {
        setLookingUp(false);
      }

      scanInProgressRef.current = false;
    }
  }, []);

  // Open the device camera and scan the QR code.
  const startScanner = async () => {
    setError("");
    setNotice("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scannerElement = document.getElementById(
        "complete-transfer-qr-reader"
      );

      if (!scannerElement) {
        throw new Error("The QR scanner area could not be found.");
      }

      const scanner = new Html5Qrcode(
        "complete-transfer-qr-reader"
      );

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (scanInProgressRef.current) return;

          try {
            await scanner.stop();
          } catch {
            // Continue with lookup if stopping fails.
          }

          if (scannerRef.current === scanner) {
            scannerRef.current = null;
          }

          if (mountedRef.current) {
            setScanning(false);
          }

          await handleScan(decodedText);
        },
        () => {
          // Ignore camera frames without a readable QR code.
        }
      );

      if (mountedRef.current) {
        setScanning(true);
      }
    } catch (err) {
      scannerRef.current = null;
      setScanning(false);

      setError(
        err?.message?.toLowerCase().includes("permission") ||
          err?.message?.toLowerCase().includes("camera")
          ? "Unable to access the camera. Allow camera permission and try again. Camera access generally requires HTTPS or localhost."
          : getErrorMessage(err)
      );
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    scannerRef.current = null;
    setScanning(false);

    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // The scanner may already have stopped.
      }

      try {
        await scanner.clear();
      } catch {
        // The scanner area may already have been cleared.
      }
    }
  };

  // Complete the transfer using the movement ID returned by lookup.
  const handleCompleteTransfer = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!movementId) {
      setError("Scan the asset QR code and verify its transfer first.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.patch(
        `/transfers/transfers/${encodeURIComponent(movementId)}/complete`
      );

      const payload = response?.data;

      if (payload?.success === false) {
        setError(
          payload?.message || "Unable to complete this transfer."
        );
        return;
      }

      const completedMovement =
        payload?.data?.movement ||
        payload?.movement ||
        payload?.data ||
        movement;

      setMovement(completedMovement);
      setNotice(
        payload?.message || "Transfer completed successfully."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    await stopScanner();

    setAssetTag("");
    setMovementId("");
    setMovement(null);
    setError("");
    setNotice("");
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#1597E5] dark:text-slate-300 dark:hover:text-[#1597E5]"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white">
              <CheckCircle2 size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                Complete Asset Transfer
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Scan the arriving asset and confirm receipt at the destination.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
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

        {/* Success / information */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notice}</p>

              {movementId && (
                <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  Movement ID: {movementId}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
              className="rounded p-1 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          {/* Main section */}
          <section className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-2">
            <div className="border-b border-slate-200 p-5 dark:border-slate-700 sm:p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Scan Receiving Asset
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Use your device camera to scan the QR code attached to the asset.
              </p>
            </div>

            <form
              onSubmit={handleCompleteTransfer}
              className="space-y-6 p-5 sm:p-6"
            >
              {/* Camera scanner */}
              <div className="rounded-xl border border-[#1597E5]/30 bg-sky-50 p-4 dark:bg-slate-800/60">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1597E5]/10 text-[#1597E5] dark:bg-[#1597E5]/20 dark:text-sky-300">
                    <ScanLine size={23} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Asset QR Scanner
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Point the camera at the arriving asset&apos;s QR code.
                    </p>
                  </div>
                </div>

                <div
                  id="complete-transfer-qr-reader"
                  className="mx-auto mb-4 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-700"
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={scanning ? stopScanner : startScanner}
                    disabled={submitting || lookingUp}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {scanning ? <X size={17} /> : <Camera size={17} />}

                    {scanning
                      ? "Stop Camera"
                      : "Open Camera Scanner"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScan(assetTag)}
                    disabled={
                      submitting ||
                      lookingUp ||
                      !assetTag.trim()
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <RefreshCw size={17} />
                    Look Up Tag
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Camera access usually requires HTTPS or localhost. Allow
                  camera permission when your browser asks.
                </p>
              </div>

              {/* Scanned asset tag */}
              <div>
                <label
                  htmlFor="asset_tag"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Scanned Asset Tag
                </label>

                <input
                  id="asset_tag"
                  type="text"
                  value={assetTag}
                  onChange={(event) => setAssetTag(event.target.value)}
                  placeholder="Scan a QR code or enter the asset tag"
                  disabled={submitting || lookingUp || Boolean(notice)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-[#1597E5]/20"
                />

                {lookingUp && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#1597E5] dark:text-sky-300">
                    <Loader2 size={16} className="animate-spin" />
                    Looking up the transfer...
                  </p>
                )}
              </div>

              {/* Transfer details */}
              {movement && (
                <div className="rounded-xl border border-[#1597E5]/30 bg-sky-50 p-4 dark:bg-slate-800/60">
                  <div className="mb-4 flex items-center gap-2">
                    <Package
                      size={21}
                      className="text-[#1597E5] dark:text-sky-300"
                    />

                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Transfer Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Asset
                      </p>

                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {assetName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Asset Tag
                      </p>

                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {displayAssetTag}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Movement ID
                      </p>

                      <p className="mt-1 break-all font-semibold text-slate-900 dark:text-slate-100">
                        {movementId}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Transfer Status
                      </p>

                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {transferStatus}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Destination
                      </p>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Building: {destinationBuilding}
                      </p>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Department: {destinationDepartment}
                      </p>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Unit: {destinationUnit}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation warning */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={21}
                    className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                  />

                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                      Confirm Receipt
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
                      Inspect the physical asset and confirm that it has
                      arrived at the intended destination before completing
                      the transfer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={submitting || lookingUp}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50  dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <RefreshCw size={16} />
                  Scan Another Asset
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    lookingUp ||
                    !movementId ||
                    Boolean(notice)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed "
                >
                  {submitting ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {submitting
                    ? "Completing Transfer..."
                    : "Confirm Receipt & Complete"}
                </button>
              </div>
            </form>
          </section>

          {/* Information panel */}
          <aside className="space-y-5">
            {/* Receiving checklist */}
            <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1597E5]/10 text-[#1597E5] dark:bg-[#1597E5]/20 dark:text-sky-300">
                  <ClipboardCheck size={21} />
                </div>

                <h2 className="font-bold text-slate-900 dark:text-slate-100">
                  Receiving Checklist
                </h2>
              </div>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <li>Open the camera scanner.</li>
                <li>Scan the QR code attached to the arriving asset.</li>
                <li>Verify the asset tag and transfer details.</li>
                <li>Confirm the destination building, department, and unit.</li>
                <li>Inspect the asset before confirming receipt.</li>
                <li>Submit the completion confirmation.</li>
              </ul>
            </div>

            {/* Receiving workflow */}
            <div className="rounded-2xl border border-[#1597E5]/30 bg-sky-50 p-5 dark:bg-slate-800/60 sm:p-6">
              <div className="flex items-start gap-3">
                <Info
                  size={21}
                  className="mt-0.5 shrink-0 text-[#1597E5] dark:text-sky-300"
                />

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    Receiving Workflow
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Scanning identifies the asset. The backend must validate
                    the transfer, destination, and authenticated receiving
                    user before allowing completion.
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
