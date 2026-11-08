"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  LoaderCircle,
  Plus,
  Wrench,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";
import api from "@/lib/api";

export default function MaintenanceRequestsPage() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    assetId: "",
    maintenanceType: "",
    description: "",
    serviceProvider: "",
    estimatedCost: "",
    notes: "",
  });

  function openForm() {
    setForm({
      assetId: "",
      maintenanceType: "",
      description: "",
      serviceProvider: "",
      estimatedCost: "",
      notes: "",
    });

    setError("");
    setNotice("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (
      !form.assetId.trim() ||
      !form.maintenanceType.trim() ||
      !form.description.trim()
    ) {
      setError(
        "Asset ID, maintenance type and description are required."
      );
      return;
    }

    if (
      form.estimatedCost.trim() !== "" &&
      (!Number.isFinite(Number(form.estimatedCost)) ||
        Number(form.estimatedCost) < 0)
    ) {
      setError(
        "Estimated cost must be a valid non-negative number."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        assetId: form.assetId.trim(),
        maintenanceType: form.maintenanceType.trim(),
        description: form.description.trim(),
        serviceProvider:
          form.serviceProvider.trim() || null,
        estimatedCost:
          form.estimatedCost.trim() === ""
            ? null
            : Number(form.estimatedCost),
        notes: form.notes.trim() || null,
      };

      const response = await api.post(
        "/maintenances/requests",
        payload
      );

      const result = response?.data ?? response;

      if (result?.success === false) {
        throw new Error(
          result.message ||
            "Unable to submit the maintenance request."
        );
      }

      setNotice(
        result?.message ||
          "Maintenance request submitted successfully."
      );

      setShowForm(false);

      setForm({
        assetId: "",
        maintenanceType: "",
        description: "",
        serviceProvider: "",
        estimatedCost: "",
        notes: "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to submit the maintenance request."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
              <Wrench size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Maintenance Requests
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Submit a maintenance request for an asset
                that requires repair or servicing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
          >
            <Plus size={17} />
            New Maintenance Request
          </button>
        </div>

        {/* Error message */}
        {error && !showForm && (
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
            <Check size={19} className="shrink-0" />

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

        {/* Main information card */}
        <div className="dashboard-card rounded-2xl border p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1597E5] text-white dark:bg-[#1597E5] dark:text-white">
              <Wrench size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Request Asset Maintenance
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Use this page to report damaged equipment,
                request repairs, or schedule servicing for
                ministry assets. Provide accurate asset details
                and describe the problem clearly so it can be
                reviewed by the appropriate personnel.
              </p>

              <button
                type="button"
                onClick={openForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2]"
              >
                <Plus size={17} />
                Create Request
              </button>
            </div>
          </div>
        </div>

        {/* Create maintenance request modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeForm();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="maintenance-request-form-title"
              className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
                <div>
                  <h2
                    id="maintenance-request-form-title"
                    className="text-lg font-bold"
                  >
                    Submit Maintenance Request
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the asset and maintenance details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close request form"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                >
                  <X size={19} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <AlertTriangle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />

                      <span>{error}</span>
                    </div>
                  )}

                  {/* Asset ID */}
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="request-asset-id"
                      className="block text-sm font-semibold"
                    >
                      Asset ID{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="request-asset-id"
                      name="assetId"
                      value={form.assetId}
                      onChange={handleFormChange}
                      placeholder="Enter the asset UUID"
                      required
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />

                    <p className="text-xs text-slate-500">
                      Enter the UUID of the asset that requires
                      maintenance.
                    </p>
                  </div>

                  {/* Maintenance type */}
                  <div className="space-y-2">
                    <label
                      htmlFor="request-maintenance-type"
                      className="block text-sm font-semibold"
                    >
                      Maintenance Type{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="request-maintenance-type"
                      name="maintenanceType"
                      value={form.maintenanceType}
                      onChange={handleFormChange}
                      placeholder="e.g. Repair, Servicing"
                      required
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  {/* Service provider */}
                  <div className="space-y-2">
                    <label
                      htmlFor="request-service-provider"
                      className="block text-sm font-semibold"
                    >
                      Suggested Service Provider
                    </label>

                    <input
                      id="request-service-provider"
                      name="serviceProvider"
                      value={form.serviceProvider}
                      onChange={handleFormChange}
                      placeholder="Optional"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="request-description"
                      className="block text-sm font-semibold"
                    >
                      Description{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      id="request-description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Describe the problem and the maintenance required..."
                      rows={4}
                      required
                      disabled={saving}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  {/* Estimated cost */}
                  <div className="space-y-2">
                    <label
                      htmlFor="request-estimated-cost"
                      className="block text-sm font-semibold"
                    >
                      Estimated Cost (₦)
                    </label>

                    <input
                      id="request-estimated-cost"
                      name="estimatedCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.estimatedCost}
                      onChange={handleFormChange}
                      placeholder="Optional"
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="request-notes"
                      className="block text-sm font-semibold"
                    >
                      Additional Notes
                    </label>

                    <textarea
                      id="request-notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      placeholder="Additional information (optional)"
                      rows={3}
                      disabled={saving}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>

                {/* Modal actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end dark:border-slate-700">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#117FC2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Plus size={17} />
                    )}

                    {saving
                      ? "Submitting..."
                      : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
