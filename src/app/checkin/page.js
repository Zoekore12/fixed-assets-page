
"use client";

import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import {
  ArrowLeft,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Info,
  ScanLine,
  UserRound,
  Camera,
  ShieldCheck,
  LogIn,
  RotateCcw,
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

const getAssetFromResponse = (response) => {
  const payload = response?.data;

  if (payload?.asset) return payload.asset;
  if (payload?.data?.asset) return payload.data.asset;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
};

const getAssetName = (asset) =>
  asset?.asset_name ||
  asset?.name ||
  asset?.product_name ||
  asset?.productName ||
  "Unnamed asset";

const getAssetTag = (asset) =>
  asset?.asset_tag || asset?.tag || asset?.assetTag || "";

const getAssignedStaff = (asset) => {
  const assignment = asset?.assignment || asset?.current_assignment;
  const holder = asset?.current_holder || asset?.assigned_user || asset?.user;

  return (
    asset?.current_holder_name ||
    asset?.assigned_to_name ||
    asset?.assigned_user_name ||
    asset?.holder_name ||
    asset?.assigned_to?.full_name ||
    asset?.assigned_to?.name ||
    holder?.full_name ||
    holder?.name ||
    holder?.email ||
    assignment?.user?.full_name ||
    assignment?.user?.name ||
    assignment?.user?.email ||
    "Assignment details not returned by the API"
  );
};

export default function CheckinPage() {
  const router = useRouter();
  const scannerRef = useRef(null);
  const scanInProgressRef = useRef(false);

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [search, setSearch] = useState("");
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lookingUpAsset, setLookingUpAsset] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState(null);
  const [scannedAsset, setScannedAsset] = useState(null);

  // Load assets.
  useEffect(() => {
    let cancelled = false;

    api
      .get("/assets")
      .then((response) => {
        if (!cancelled) {
          setAssets(getAssetData(response));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAssets(false);
        }
      });

    return () => {
      cancelled = true;

      const scanner = scannerRef.current;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear().catch(() => {});
          });

        scannerRef.current = null;
      }
    };
  }, []);

  const fetchAssets = async () => {
    setLoadingAssets(true);
    setError("");

    try {
      const response = await api.get("/assets");
      setAssets(getAssetData(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingAssets(false);
    }
  };

  // Only assets that have left the office are eligible for check-in.
  const eligibleAssets = assets.filter((asset) => {
    const status = String(asset.status || "").toUpperCase();

    const searchable = [
      asset.asset_name,
      asset.name,
      asset.product_name,
      asset.asset_tag,
      asset.tag,
      asset.serial_number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      asset.is_active !== false &&
      asset.is_active !== 0 &&
      status === "OUT" &&
      searchable.includes(search.toLowerCase())
    );
  });

  const selectedAsset =
    scannedAsset ||
    assets.find((asset) => String(asset.id) === String(assetId));

  // Find the asset identified by the QR code.
  const handleScan = async (decodedText) => {
    const scannedValue = decodedText.trim();

    if (!scannedValue || scanInProgressRef.current) return;

    scanInProgressRef.current = true;
    setError("");
    setNotice("");
    setResult(null);
    setLookingUpAsset(true);
    setScannedAsset(null);
    setAssetId("");

    try {
      /*
       * Assumes the backend provides:
       * GET /assets/tag/:assetTag
       *
       * Update this URL if your actual lookup route differs.
       */
      const response = await api.get(
        `/assets/tag/${encodeURIComponent(scannedValue)}`
      );

      const asset = getAssetFromResponse(response);

      if (!asset?.id) {
        throw new Error(
          "The QR code was scanned, but no matching asset was returned."
        );
      }

      setScannedAsset(asset);
      setAssetId(String(asset.id));

      const status = String(asset.status || "").toUpperCase();

      if (asset.is_active === false || asset.is_active === 0) {
        setError("This asset is inactive and cannot be checked in.");
      } else if (status !== "OUT") {
        setError(
          `This asset has status "${asset.status || "UNKNOWN"}". Only assets marked OUT can be checked in.`
        );
      } else {
        setNotice(
          "Asset found. Verify its details and assigned staff member before confirming the return."
        );
      }
    } catch (err) {
      setError(
        err?.response?.status === 404
          ? "No asset was found for this QR code. Check the asset tag and try again."
          : getErrorMessage(err)
      );
    } finally {
      setLookingUpAsset(false);
      scanInProgressRef.current = false;
    }
  };

  const startScanner = async () => {
    setError("");
    setNotice("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scannerElement = document.getElementById("checkin-qr-reader");

      if (!scannerElement) {
        throw new Error("The QR scanner area could not be found.");
      }

      const scanner = new Html5Qrcode("checkin-qr-reader");
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
            // Continue with the lookup if the scanner has already stopped.
          }

          if (scannerRef.current === scanner) {
            scannerRef.current = null;
          }

          setScanning(false);
          await handleScan(decodedText);
        },
        () => {
          // Ignore camera frames without a QR code.
        }
      );

      setScanning(true);
    } catch (err) {
      scannerRef.current = null;
      setScanning(false);

      setError(
        err?.message?.toLowerCase().includes("permission") ||
          err?.message?.toLowerCase().includes("camera")
          ? "Unable to access the camera. Allow camera permission and try again."
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
        // The scanner area may already be cleared.
      }
    }
  };

  const handleCheckin = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");
    setResult(null);

    if (!assetId) {
      setError("Please scan or select an asset to check in.");
      return;
    }

    if (
      selectedAsset &&
      String(selectedAsset.status || "").toUpperCase() !== "OUT"
    ) {
      setError("Only assets currently marked OUT can be checked in.");
      return;
    }

    setSubmitting(true);

    try {
      // Existing backend check-in endpoint remains unchanged.
      const response = await api.post(
        `/checkin/assets/${assetId}/exit/return`
      );

      const data = response?.data;

      setResult(data);
      setNotice(data?.message || "Asset checked in successfully.");
      setAssetId("");
      setScannedAsset(null);
      setSearch("");

      await fetchAssets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setAssetId("");
    setSearch("");
    setScannedAsset(null);
    setError("");
    setNotice("");
    setResult(null);
  };

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-slate-300"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <LogIn size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Check In Asset
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Scan a returned asset, verify its details, and record its
                return to the office.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
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
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success message */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notice}</p>

              {result?.asset?.asset_tag && (
                <p className="mt-1 text-xs">
                  Asset tag: {result.asset.asset_tag}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          {/* Main check-in form */}
          <section className="dashboard-card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-2">
            <div className="border-b border-gray-200 p-5 dark:border-slate-700 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Check-in Information
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Scan the asset QR code to retrieve its details and verify
                the return.
              </p>
            </div>

            <form onSubmit={handleCheckin} className="space-y-6 p-5 sm:p-6">
              {/* QR scanner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <ScanLine size={23} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Scan Returned Asset
                    </h3>

                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                      Point the camera at the QR code attached to the asset.
                    </p>
                  </div>
                </div>

                <div
                  id="checkin-qr-reader"
                  className="mx-auto mb-4 w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-slate-950"
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={scanning ? stopScanner : startScanner}
                    disabled={submitting || lookingUpAsset}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {scanning ? <X size={17} /> : <Camera size={17} />}

                    {scanning ? "Stop Camera" : "Open Camera Scanner"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScan(search)}
                    disabled={
                      submitting ||
                      lookingUpAsset ||
                      !search.trim()
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300"
                    title="Look up the entered text as an asset tag"
                  >
                    <Search size={17} />
                    Find by Tag
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-slate-400">
                  Camera access generally requires HTTPS or localhost.
                  You can also search for an asset tag below.
                </p>
              </div>

              {/* Search assets */}
              <div>
                <label
                  htmlFor="asset-search"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200"
                >
                  Search Assets
                </label>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="asset-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by asset name, tag or serial number"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Asset dropdown */}
              <div>
                <label
                  htmlFor="asset_id"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200"
                >
                  Select Asset <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Package
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    id="asset_id"
                    required
                    value={assetId}
                    onChange={(event) => {
                      setAssetId(event.target.value);
                      setScannedAsset(null);
                      setError("");
                      setNotice("");
                    }}
                    disabled={loadingAssets || submitting}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      {loadingAssets
                        ? "Loading assets..."
                        : "Choose an asset marked OUT"}
                    </option>

                    {eligibleAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {getAssetName(asset)} —{" "}
                        {getAssetTag(asset) || "No tag"}
                      </option>
                    ))}
                  </select>
                </div>

                {!loadingAssets && eligibleAssets.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No matching assets currently marked OUT were found
                    in the loaded asset list.
                  </p>
                )}
              </div>

              {/* Lookup loading indicator */}
              {lookingUpAsset && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <Loader2 size={17} className="animate-spin" />
                  Looking up the scanned asset...
                </div>
              )}

              {/* Asset and assigned staff details */}
              {selectedAsset && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <div className="flex items-start gap-3">
                    <Package
                      size={22}
                      className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-300"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {getAssetName(selectedAsset)}
                        </h3>

                        {scannedAsset && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <CheckCircle2 size={13} />
                            QR Scanned
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                        Asset tag: {getAssetTag(selectedAsset) || "—"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                        Serial number: {selectedAsset.serial_number || "—"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                        Current status: {selectedAsset.status || "Unknown"}
                      </p>

                      <div className="mt-4 border-t border-emerald-200 pt-4 dark:border-emerald-900/50">
                        <div className="flex items-start gap-2">
                          <UserRound
                            size={19}
                            className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300"
                          />

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                              Assigned Staff / Current Holder
                            </p>

                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {getAssignedStaff(selectedAsset)}
                            </p>

                            {(selectedAsset.current_holder_email ||
                              selectedAsset.assigned_to?.email ||
                              selectedAsset.current_holder?.email) && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                                {selectedAsset.current_holder_email ||
                                  selectedAsset.assigned_to?.email ||
                                  selectedAsset.current_holder?.email}
                              </p>
                            )}

                            {(selectedAsset.current_holder_id ||
                              selectedAsset.assigned_to?.id ||
                              selectedAsset.current_holder?.id) && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                Staff ID:{" "}
                                {selectedAsset.current_holder_id ||
                                  selectedAsset.assigned_to?.id ||
                                  selectedAsset.current_holder?.id}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck size={15} />
                        Verify the returned asset before confirming check-in.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={submitting || lookingUpAsset}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    loadingAssets ||
                    lookingUpAsset ||
                    !assetId ||
                    !selectedAsset ||
                    String(selectedAsset.status || "").toUpperCase() !== "OUT"
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <LogIn size={17} />
                  )}

                  {submitting ? "Processing..." : "Confirm Check-in"}
                </button>
              </div>
            </form>
          </section>

          {/* Right-side information */}
          <aside className="space-y-5">
            <div className="dashboard-card rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Info size={21} />
                </div>

                <h2 className="font-bold text-gray-900 dark:text-white">
                  Check-in Checklist
                </h2>
              </div>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-gray-600 dark:text-slate-300">
                <li>Scan the QR code attached to the returned asset.</li>
                <li>Verify the asset tag and serial number.</li>
                <li>Confirm the staff member associated with the asset.</li>
                <li>Inspect the physical condition of the returned item.</li>
                <li>Confirm that the asset is actually returning to the office.</li>
                <li>Record the return through the authorized security process.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={21}
                  className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                />

                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                    Security Reminder
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">
                    Scanning identifies the asset but does not record its
                    return. The backend must validate the asset&apos;s current
                    status and record the check-in. Inspect the item before
                    confirming the return.
                  </p>
                </div>
              </div>
            </div>

            <div className="dashboard-card rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gray-100 p-2.5 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                  <RotateCcw size={20} />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Return Process
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    Confirm the physical return before submitting.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchAssets}
              disabled={loadingAssets || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={loadingAssets ? "animate-spin" : ""}
              />
              Refresh Assets
            </button>
          </aside>
        </div>
      </section>
    </DashboardLayout>
  );
}
