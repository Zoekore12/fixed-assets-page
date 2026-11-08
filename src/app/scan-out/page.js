
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  Camera,
  CameraOff,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MapPin,
  Package,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function TransferScanOutPage() {
  const router = useRouter();

  const [assetTag, setAssetTag] = useState("");
  const [movement, setMovement] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const scannerRef = useRef(null);
  const processingScanRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // DERIVED ASSET AND TRANSFER DETAILS

  const asset = movement?.asset || scanResult?.asset || null;

  const assetName =
    asset?.name ||
    asset?.asset_name ||
    movement?.asset_name ||
    movement?.asset?.name ||
    "Asset";

  const displayAssetTag =
    asset?.asset_tag ||
    asset?.assetTag ||
    movement?.asset_tag ||
    assetTag;

  const movementId = movement?.id || movement?.movement_id;

  const destinationBuilding =
    movement?.to_building_name ||
    movement?.destination_building_name ||
    movement?.toBuilding?.name ||
    movement?.destination_building?.name ||
    "Not provided";

  const destinationDepartment =
    movement?.to_department_name ||
    movement?.destination_department_name ||
    movement?.toDepartment?.name ||
    movement?.destination_department?.name ||
    "Not provided";

  const destinationUnit =
    movement?.to_unit_name ||
    movement?.destination_unit_name ||
    movement?.toUnit?.name ||
    movement?.destination_unit?.name ||
    "Not provided";

  const assignedPerson =
    asset?.current_holder_name ||
    asset?.assigned_to_name ||
    asset?.assigned_user_name ||
    asset?.holder_name ||
    asset?.current_holder?.name ||
    asset?.assigned_to?.name ||
    movement?.current_holder_name ||
    movement?.assigned_to_name ||
    movement?.requested_by_name ||
    "Not provided by the scan response";

  const transferStatus =
    movement?.movement_status ||
    movement?.status ||
    "Not provided";

  // SCAN AND VERIFY TRANSFER

  const scanAsset = useCallback(async (tag) => {
    const cleanedTag = tag.trim();

    if (!cleanedTag) {
      setError("Please scan or enter an asset tag.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setMovement(null);
    setScanResult(null);

    try {
      const response = await api.get(
        `/scan/scan/${encodeURIComponent(cleanedTag)}`
      );

      const result = response?.data;

      if (result?.success === false || result?.authorized === false) {
        setError(
          result?.message ||
            "This transfer is not authorized for scan out."
        );
        return;
      }

      const transfer = result?.movement;

      if (!transfer) {
        setError("No transfer details were returned for this asset.");
        return;
      }

      setScanResult(result);
      setMovement(transfer);
      setAssetTag(cleanedTag);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // SCANNER CAMERA

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (error) {
        console.error("Could not stop camera scanner:", error);
      }

      try {
        scanner.clear();
      } catch (error) {
        console.error("Could not clear camera scanner:", error);
      }

      scannerRef.current = null;
    }

    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scanner = new Html5Qrcode("transfer-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (processingScanRef.current) return;

          processingScanRef.current = true;

          try {
            await stopCamera();
            await scanAsset(decodedText);
          } finally {
            processingScanRef.current = false;
          }
        },
        () => {
          // Ignore individual frames where no QR code is detected.
        }
      );

      setCameraActive(true);
    } catch (error) {
      console.error("Camera scanner error:", error);

      scannerRef.current = null;
      setCameraActive(false);

      setCameraError(
        error?.message ||
          "Unable to open the camera. Check camera permissions and try again."
      );
    }
  }, [scanAsset, stopCamera]);

  // VERIFY EXIT

  const handleScanOut = async () => {
    if (!movementId) {
      setError("The transfer movement ID is missing. Scan the asset again.");
      return;
    }

    setVerifying(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/scan/scan/${encodeURIComponent(movementId)}/verify-exit`
      );

      const result = response?.data;

      if (result?.success === false) {
        setError(
          result?.message ||
            "The asset could not be verified for scan out."
        );
        return;
      }

      setSuccess(
        result?.message || "Asset scan out verified successfully."
      );

      if (result?.movement) {
        setMovement(result.movement);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  // RESET SCANNER

  const handleReset = () => {
    setAssetTag("");
    setMovement(null);
    setScanResult(null);
    setError("");
    setSuccess("");
  };

  // CLEAR NOTICES WHEN THE PAGE IS LEFT

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch((error) => {
            console.error("Camera cleanup error:", error);
          });
        }

        scanner.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <DashboardLayout>
      <section className="space-y-6">

        {/* PAGE HEADER */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[#1597E5] transition hover:text-[#117FC2]"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white">
                <ArrowRightLeft size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Transfer Scan Out
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Verify an authorized asset transfer before it leaves the building.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading || verifying}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Reset Scanner
            </button>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="rounded-xl border border-[#1597E5]/30 bg-[#1597E5]/10 p-4">
          <div className="flex items-start gap-3">
            <ScanLine
              className="mt-0.5 shrink-0 text-[#1597E5]"
              size={21}
            />
            <div>
              <h2 className="font-semibold text-[#1597E5]">
                Security Checkpoint
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Scan the asset barcode or QR code. Confirm that the returned
                transfer and destination are correct before verifying the asset&apos;s exit.
              </p>
            </div>
          </div>
        </div>

        {/* SCANNER INPUT */}
        <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#1597E5] dark:bg-slate-800">
              <QrCode size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Scan Asset Tag
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Use the scanner or enter the asset tag manually.
              </p>
            </div>
          </div>

          <div className="mb-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={loading || verifying}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Camera size={18} />
                  Open Camera Scanner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={loading || verifying}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <CameraOff size={18} />
                  Close Camera
                </button>
              )}
            </div>

            <div
              id="transfer-qr-reader"
              className={`overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 ${
                cameraActive ? "block" : "hidden"
              }`}
            />

            {cameraActive && (
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Point the camera at the asset QR code. Scanning will automatically
                retrieve the transfer details for verification.
              </p>
            )}

            {cameraError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                {cameraError}
              </div>
            )}
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Or use a barcode scanner / enter manually
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              scanAsset(assetTag);
            }}
            className="space-y-4"
          >
            <label
              htmlFor="assetTag"
              className="block text-sm font-semibold"
            >
              Asset Tag
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <QrCode
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1597E5]"
                />

                <input
                  id="assetTag"
                  name="assetTag"
                  type="text"
                  autoComplete="off"
                  autoFocus
                  value={assetTag}
                  onChange={(event) => setAssetTag(event.target.value)}
                  placeholder="Scan or enter asset tag, e.g. MIST-000002"
                  disabled={loading || verifying}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || verifying || !assetTag.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ScanLine size={18} />
                    Verify Transfer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <XCircle size={21} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Verification Failed</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 size={21} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Scan Out Successful</p>
              <p className="mt-1 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* VERIFIED TRANSFER DETAILS */}
        {movement && (
          <div className="space-y-6">

            {/* ASSET SUMMARY */}
            <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1597E5] text-white">
                    <Package size={25} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Verified Asset
                    </p>
                    <h2 className="mt-1 text-xl font-bold">
                      {assetName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Tag: {displayAssetTag || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck size={16} />
                  Transfer Authorized
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <ClipboardCheck size={17} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Movement ID
                    </span>
                  </div>
                  <p className="break-all font-semibold">
                    {movementId || "Not provided"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <ArrowRightLeft size={17} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Transfer Status
                    </span>
                  </div>
                  <p className="font-semibold">
                    {transferStatus}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 dark:border-slate-700 dark:bg-slate-950">
                  <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <UserRound size={17} />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Assigned Person / Responsible User
                    </span>
                  </div>
                  <p className="font-semibold">
                    {assignedPerson}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    The name is shown only if it is included in the API response.
                  </p>
                </div>
              </div>
            </div>

            {/* DESTINATION */}
            <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#1597E5] dark:bg-slate-800">
                  <MapPin size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Transfer Destination
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Confirm the intended receiving location.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <Building2 size={19} className="mb-3 text-[#1597E5]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Building
                  </p>
                  <p className="mt-1 font-semibold">
                    {destinationBuilding}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <Building2 size={19} className="mb-3 text-[#1597E5]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Department
                  </p>
                  <p className="mt-1 font-semibold">
                    {destinationDepartment}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <Building2 size={19} className="mb-3 text-[#1597E5]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Unit
                  </p>
                  <p className="mt-1 font-semibold">
                    {destinationUnit}
                  </p>
                </div>
              </div>
            </div>

            {/* SCAN OUT ACTION */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 transition-colors dark:border-amber-900/50 dark:bg-amber-950/30 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={23}
                  className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                />

                <div className="flex-1">
                  <h2 className="font-bold text-amber-800 dark:text-amber-300">
                    Confirm Asset Exit
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-amber-800/80 dark:text-amber-200">
                    Before proceeding, confirm that the asset tag matches
                    the physical asset and that the displayed transfer
                    destination is correct. This action submits the
                    verification to the server.
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleScanOut}
                      disabled={
                        verifying ||
                        loading ||
                        Boolean(success) ||
                        !movementId
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verifying ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Confirming Exit...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle2 size={18} />
                          Exit Verified
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          Confirm Scan Out
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={verifying}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Scan Another Asset
                      <ArrowRightLeft size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!movement && !loading && !error && (
          <div className="dashboard-card rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[#1597E5] dark:bg-slate-800">
              <ScanLine size={27} />
            </div>

            <h2 className="mt-4 text-lg font-bold">
              Ready to Scan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Scan an asset tag to retrieve and verify its active transfer.
              The transfer details will appear here before you confirm the exit.
            </p>
          </div>
        )}

      </section>
    </DashboardLayout>
  );
}
