"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Package,
  ScanLine,
  MapPin,
  Building2,
  Loader2,
  X,
  Info,
  RefreshCw,
  ShieldCheck,
  UserRound,
  ArrowRightLeft,
  Camera,
  CameraOff,
  QrCode,
} from "lucide-react";

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

const getValue = (...values) =>
  values.find(
    (value) => value !== undefined && value !== null && value !== ""
  ) ?? "—";

export default function TransferCheckInPage() {
  const router = useRouter();
  const tagInputRef = useRef(null);
  const scannerRef = useRef(null);
  const processingScanRef = useRef(false);
  const mountedRef = useRef(false);

  const [assets, setAssets] = useState([]);
  const [assetTag, setAssetTag] = useState("");
  const [search, setSearch] = useState("");

  const [loadingAssets, setLoadingAssets] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [checkInResult, setCheckInResult] = useState(null);


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
          setError(
            `${getErrorMessage(err)} Check that your asset-list endpoint is available.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAssets(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

 
  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.error("Unable to stop camera scanner:", err);
      }

      try {
        scanner.clear();
      } catch (err) {
        console.error("Unable to clear camera scanner:", err);
      }

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    }

    if (mountedRef.current) {
      setCameraActive(false);
      setCameraStarting(false);
    }
  }, []);

 
  const handleScan = useCallback(
    async (tagValue) => {
      const tag = String(tagValue || "").trim();

      if (!tag) {
        setError("Scan a QR/barcode or enter the asset tag first.");
        return;
      }

      setError("");
      setNotice("");
      setScanResult(null);
      setCheckInResult(null);
      setAssetTag(tag);
      setScanning(true);

      try {
        const response = await api.get(
          `/scan/scan/${encodeURIComponent(tag)}`
        );

        const data = response?.data;

        if (
          data?.success === false ||
          data?.authorized === false
        ) {
          setError(
            data?.message ||
              "This asset is not authorized for transfer."
          );
          return;
        }

        if (!data?.movement) {
          setError(
            data?.message ||
              "No transfer details were returned for this asset."
          );
          return;
        }

        setScanResult(data);
        setNotice(data?.message || "Authorized asset transfer found.");
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setScanning(false);
      }
    },
    []
  );

 
  const startCamera = useCallback(async () => {
    if (cameraStarting || cameraActive || scanning || submitting) {
      return;
    }

    setCameraError("");
    setError("");
    setNotice("");
    setCameraStarting(true);

    let scanner = null;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!mountedRef.current) return;

      scanner = new Html5Qrcode("transfer-checkin-qr-reader");
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
            await handleScan(decodedText);
          } finally {
            processingScanRef.current = false;
          }
        },
        () => {
          // No QR code detected in this frame. Keep scanning.
        }
      );

      if (mountedRef.current) {
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera scanner error:", err);

      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch {
          // Ignore cleanup errors after camera initialization fails.
        }

        try {
          scanner.clear();
        } catch {
          // Ignore cleanup errors.
        }
      }

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }

      if (mountedRef.current) {
        setCameraActive(false);
        setCameraError(
          err?.message ||
            "Unable to open the camera. Allow camera access and try again."
        );
      }
    } finally {
      if (mountedRef.current) {
        setCameraStarting(false);
      }
    }
  }, [
    cameraStarting,
    cameraActive,
    scanning,
    submitting,
    stopCamera,
    handleScan,
  ]);

 
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const scanner = scannerRef.current;

      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch((err) => {
            console.error("Camera cleanup error:", err);
          });
        }

        try {
          scanner.clear();
        } catch {
          // The scanner may already have been cleared.
        }

        scannerRef.current = null;
      }
    };
  }, []);

 
  const filteredAssets = assets.filter((asset) => {
    const searchable = [
      asset.asset_name,
      asset.name,
      asset.product_name,
      asset.asset_tag,
      asset.tag,
      asset.serial_number,
      asset.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(search.toLowerCase());
  });

  const movement =
    checkInResult?.movement || scanResult?.movement || null;

  const scannedAsset =
    scanResult?.asset ||
    checkInResult?.asset ||
    assets.find(
      (asset) =>
        String(asset.asset_tag || asset.tag || "").toLowerCase() ===
        assetTag.trim().toLowerCase()
    );

  const assetDetails = checkInResult?.asset || scannedAsset || null;
  const station = checkInResult?.station || null;

  const assignedPerson =
    assetDetails?.current_holder_name ||
    assetDetails?.assigned_to_name ||
    assetDetails?.assigned_user_name ||
    assetDetails?.holder_name ||
    assetDetails?.assigned_to?.name ||
    assetDetails?.current_holder?.name ||
    null;

  
  const handleCheckIn = async () => {
    const tag = assetTag.trim();

    setError("");
    setNotice("");

    if (!tag) {
      setError("Scan or enter the asset tag first.");
      return;
    }

    if (!scanResult?.authorized || !scanResult?.movement) {
      setError(
        "Scan and validate the asset transfer before checking it in."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.patch(
        `/scan/scan-in/${encodeURIComponent(tag)}`
      );

      const data = response?.data;

      if (data?.success === false) {
        setError(data?.message || "Asset check-in failed.");
        return;
      }

      setCheckInResult(data);
      setScanResult(null);
      setNotice(
        data?.message || "Asset checked in at the destination building."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

 
  const resetForm = async () => {
    await stopCamera();

    setAssetTag("");
    setSearch("");
    setError("");
    setNotice("");
    setCameraError("");
    setScanResult(null);
    setCheckInResult(null);

    tagInputRef.current?.focus();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page heading */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[#1597E5] transition hover:text-[#117FC2]"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white">
              <ScanLine size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1597E5] sm:text-2xl">
                Transfer Asset Check-In
              </h1>
              <p className="mt-1 text-sm text-slate-700">
                Scan the asset at the destination building and verify its
                arrival.
              </p>
            </div>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded p-1 transition hover:bg-red-500/20"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Success alert */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">{notice}</p>

              {(checkInResult?.asset?.asset_tag ||
                checkInResult?.asset?.tag) && (
                <p className="mt-1 text-xs">
                  Asset tag:{" "}
                  {checkInResult.asset.asset_tag ||
                    checkInResult.asset.tag}
                </p>
              )}

              {station?.building_name && (
                <p className="mt-1 text-xs">
                  Destination: {station.building_name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss success message"
              className="rounded p-1 transition hover:bg-emerald-500/20"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
          {/* Scan and check-in panel */}
          <section className="dashboard-card overflow-hidden rounded-2xl border border-slate-800 shadow-sm xl:col-span-2">
            <div className="border-b border-slate-800 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-[#1597E5]">
                Scan Asset
              </h2>
              <p className="mt-1 text-sm text-slate-700">
                Open your device camera, use a barcode scanner, or enter
                the printed asset tag.
              </p>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* Camera scanner */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={
                        cameraStarting ||
                        scanning ||
                        submitting ||
                        Boolean(scanResult) ||
                        Boolean(checkInResult)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cameraStarting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Camera size={18} />
                      )}
                      {cameraStarting
                        ? "Opening Camera..."
                        : "Open Camera Scanner"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      disabled={scanning || submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#1597E5] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-[#117FC2] disabled:opacity-50"
                    >
                      <CameraOff size={18} />
                      Close Camera
                    </button>
                  )}
                </div>

                <div
                  id="transfer-checkin-qr-reader"
                  className={`overflow-hidden rounded-xl ${
                    cameraActive ? "block" : "hidden"
                  }`}
                />

                {cameraActive && (
                  <p className="text-sm text-blue-300">
                    Point the camera at the asset QR code. When it is
                    recognized, the system will validate the transfer.
                  </p>
                )}

                {cameraError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                  >
                    <p className="font-semibold">Camera unavailable</p>
                    <p className="mt-1">{cameraError}</p>
                    <p className="mt-2">
                      Check your browser camera permissions, or use the
                      barcode scanner/manual input below.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-xs font-medium uppercase tracking-wide text-slate-600">
                  Or scan using a device / enter manually
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* QR/barcode tag input */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleScan(assetTag);
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="asset_tag"
                    className="mb-2 block text-sm font-semibold text-[#1597E5]"
                  >
                    Asset QR/Barcode Tag{" "}
                    <span className="text-red-400">*</span>
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <QrCode
                        size={19}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1597E5]"
                      />

                      <input
                        ref={tagInputRef}
                        id="asset_tag"
                        name="asset_tag"
                        type="text"
                        required
                        autoComplete="off"
                        autoFocus
                        value={assetTag}
                        onChange={(event) => {
                          setAssetTag(event.target.value);
                          setScanResult(null);
                          setCheckInResult(null);
                          setError("");
                          setNotice("");
                        }}
                        disabled={scanning || submitting}
                        placeholder="Scan or enter e.g. MIST-000002"
                        className="w-full rounded-xl border border-slate-700 bg-white py-3 pl-11 pr-4 text-sm text-slate-600 outline-none transition placeholder:text-slate-500 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/20 disabled:opacity-60"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={scanning || submitting || !assetTag.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {scanning ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <ScanLine size={17} />
                      )}
                      {scanning ? "Validating..." : "Validate Asset"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-700">
                    USB and Bluetooth barcode scanners can type the tag
                    into this field. Press Enter to validate it.
                  </p>
                </div>
              </form>

              {/* Asset search helper */}
              <div>
                <label
                  htmlFor="asset-search"
                  className="mb-2 block text-sm font-semibold text-[#1597E5]"
                >
                  Find Asset in Inventory
                </label>

                <input
                  id="asset-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by asset name, tag or serial number"
                  disabled={loadingAssets || submitting}
                  className="w-full rounded-xl border border-[#1597E5] bg-white px-4 py-3 text-sm text-slate-600 outline-none transition placeholder:text-slate-500 focus:border-[#1597E5] focus:ring-2 focus:ring-[#1597E5]/20 disabled:opacity-60"
                />

                {search.trim() && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#1597E5] bg-white scrollbar-hide ">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.slice(0, 8).map((asset) => (
                        <button
                          type="button"
                          key={asset.id}
                          onClick={() => {
                            setAssetTag(
                              asset.asset_tag || asset.tag || ""
                            );
                            setSearch("");
                            setScanResult(null);
                            setCheckInResult(null);
                            setError("");
                            setNotice("");
                            tagInputRef.current?.focus();
                          }}
                          className="flex w-full items-start gap-3 border-b border-[#1597E5] p-3 text-left transition last:border-b-0 hover:bg-slate-100 dark:hover:bg-slate-900 dark:bg-slate-950 dark:text-white"
                        >
                          <Package
                            size={18}
                            className="mt-0.5 shrink-0 text-[#1597E5]"
                          />

                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-slate-700">
                              {getValue(
                                asset.asset_name,
                                asset.name,
                                asset.product_name
                              )}
                            </span>

                            <span className="mt-1 block text-xs text-slate-400">
                              Tag: {getValue(asset.asset_tag, asset.tag)}
                              {" · "}
                              Status: {getValue(asset.status)}
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-sm text-[#1597E5]">
                        No matching assets found.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Scanned asset / transfer details */}
              {(scanResult || checkInResult) && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-[#117FC2] bg-[#1597E5] p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-[#1597E5] p-2.5 text-white">
                        <Package size={22} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-100">
                          {getValue(
                            assetDetails?.asset_name,
                            assetDetails?.name,
                            assetDetails?.product_name,
                            movement?.asset_name,
                            "Scanned Asset"
                          )}
                        </h3>

                        <p className="mt-1 text-sm text-slate-300">
                          Asset tag:{" "}
                          {getValue(
                            assetDetails?.asset_tag,
                            assetDetails?.tag,
                            movement?.asset_tag,
                            assetTag
                          )}
                        </p>

                        {assetDetails?.serial_number && (
                          <p className="mt-1 text-xs text-slate-400">
                            Serial number: {assetDetails.serial_number}
                          </p>
                        )}

                        <p className="mt-2 text-xs font-medium text-blue-300">
                          Status:{" "}
                          {getValue(
                            assetDetails?.status,
                            movement?.movement_status
                          )}
                        </p>
                      </div>

                      {scanResult?.authorized && !checkInResult && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                          <ShieldCheck size={14} />
                          Authorized
                        </span>
                      )}

                      {checkInResult && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#117FC2] bg-[#1597E5] px-2.5 py-1 text-xs font-semibold text-white">
                          <CheckCircle2 size={14} />
                          Checked In
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned user */}
                  {assignedPerson && (
                    <div className="rounded-xl border border-[#1597E5] bg-white p-4">
                      <div className="flex items-center gap-3">
                        <UserRound
                          size={20}
                          className="text-slate-500"
                        />
                        <div>
                          <p className="text-xs text-slate-500">
                            Assigned To
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-100">
                            {assignedPerson}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transfer details */}
                  {movement && (
                    <div className="rounded-xl border border-[#1597E5] bg-white p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <ArrowRightLeft
                          size={19}
                          className="text-[#1597E5]"
                        />
                        <h3 className="font-semibold text-slate-100">
                          Transfer Information
                        </h3>
                      </div>

                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-slate-400">
                            Transfer Reference
                          </dt>
                          <dd className="mt-1 break-all text-sm font-medium text-slate-100">
                            {getValue(movement.id, movement.movement_id)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-slate-400">
                            Transfer Status
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-100">
                            {getValue(movement.movement_status)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-slate-400">
                            From Unit
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-100">
                            {getValue(movement.from_unit_name)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-slate-400">
                            Destination Unit
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-100">
                            {getValue(movement.to_unit_name)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-slate-400">
                            Destination Department
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-100">
                            {getValue(movement.to_department_name)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs text-slate-400">
                            Destination Building
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-100">
                            {getValue(
                              movement.to_building_name,
                              station?.building_name
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Destination station details */}
                  {station && (
                    <div className="rounded-xl border border-[#117FC2] bg-[#1597E5] p-4">
                      <div className="flex items-start gap-3">
                        <Building2
                          size={21}
                          className="mt-0.5 shrink-0 text-[#1597E5]"
                        />

                        <div>
                          <h3 className="font-semibold text-[#1597E5]">
                            Destination Station
                          </h3>
                          <p className="mt-1 text-sm text-[#1597E5]">
                            {getValue(station.name)}
                          </p>
                          <p className="mt-1 text-xs text-[#1597E5]">
                            Station code: {getValue(station.station_code)}
                          </p>
                          <p className="mt-1 text-xs text-[#1597E5]">
                            Building: {getValue(station.building_name)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Check-in action */}
                  {scanResult?.authorized && !checkInResult && (
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={submitting}
                        className="rounded-xl border border-slate-700 bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleCheckIn}
                        disabled={submitting || scanning}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {submitting ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                        {submitting
                          ? "Checking In..."
                          : "Confirm Destination Check-In"}
                      </button>
                    </div>
                  )}

                  {/* Successful check-in */}
                  {checkInResult && (
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
                      >
                        <ScanLine size={17} />
                        Scan Next Asset
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Information panel */}
          <aside className="space-y-5">
            <div className="dashboard-card rounded-2xl border border-slate-800 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1597E5] text-white">
                  <Info size={21} />
                </div>

                <h2 className="font-bold text-slate-100">
                  Check-In Checklist
                </h2>
              </div>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Scan the asset QR code or barcode using the camera or an
                  external scanner.
                </li>

                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Verify the asset and transfer details returned by the
                  system.
                </li>

                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Confirm that the asset physically arrived at the
                  destination building.
                </li>

                <li className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-1 shrink-0 text-[#1597E5]"
                  />
                  Complete check-in only after the backend authorizes it.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={21}
                  className="mt-0.5 shrink-0 text-amber-400"
                />

                <div>
                  <h3 className="font-semibold text-amber-300">
                    Security Reminder
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-amber-200">
                    The backend uses the authenticated security officer and
                    assigned station to validate the destination check-in.
                    Selecting an asset from inventory does not replace that
                    verification.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={scanning || submitting || cameraStarting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#117FC2] bg-[#1597E5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Reset Scanner
            </button>

            {loadingAssets && (
              <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Loading inventory...
              </p>
            )}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}