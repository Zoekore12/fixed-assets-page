"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import DashboardLayout from "@/app/components/dashboard/DashboardLayout";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const offset = (currentPage - 1) * PAGE_SIZE;

      const isRead =
        activeFilter === "unread"
          ? "false"
          : activeFilter === "read"
            ? "true"
            : undefined;

      const params = {
        limit: PAGE_SIZE,
        offset,
      };

      if (isRead !== undefined) {
        params.isRead = isRead;
      }

      const [notificationsResponse, countResponse] = await Promise.all([
        api.get("/notification", { params }),
        api.get("/notification/unread-count"),
      ]);

      const data = notificationsResponse.data;

      setNotifications(data.notifications || []);
      setTotalCount(data.count || 0);
      setUnreadCount(countResponse.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotifications();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadNotifications]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setActionLoading(notificationId);

      await api.patch(`/notification/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));

      if (activeFilter === "unread") {
        await loadNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading("all");

      await api.patch("/notification/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);

      if (activeFilter === "unread") {
        await loadNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setActionLoading(notificationId);

      const notification = notifications.find(
        (item) => item.id === notificationId
      );

      await api.delete(`/notification/${notificationId}`);

      setNotifications((previous) =>
        previous.filter((item) => item.id !== notificationId)
      );

      setTotalCount((previous) => Math.max(0, previous - 1));

      if (notification && !notification.is_read) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete notification."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) return "";

    return notificationDate.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const firstItem =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const lastItem = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <DashboardLayout>
      <section className="space-y-6">
        {/* Page heading */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white">
              <Bell size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Notifications
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Stay updated on activities and important events.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={17} />
              Back to Dashboard
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || actionLoading === "all"}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1597E5] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1285ca] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Summary cards */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total notifications
              </p>

              <Inbox size={20} className="text-[#1597E5]" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalCount}
            </p>
          </div>

          <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Unread notifications
              </p>

              <Bell size={20} className="text-orange-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {unreadCount}
            </p>
          </div>

          <div className="dashboard-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Read notifications
              </p>

              <Check size={20} className="text-green-600 dark:text-green-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {Math.max(0, totalCount - unreadCount)}
            </p>
          </div>
        </div>

        {/* Notifications container */}

        <div className="dashboard-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Filters */}

          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center dark:border-slate-700">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Recent notifications
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Review and manage your notifications.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "All", value: "all" },
                { label: "Unread", value: "unread" },
                { label: "Read", value: "read" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleFilterChange(filter.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeFilter === filter.value
                      ? "bg-[#1597E5] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}

          {error && (
            <div className="m-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle size={18} />

              <span>{error}</span>

              <button
                type="button"
                onClick={loadNotifications}
                className="ml-auto font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw
                size={28}
                className="animate-spin text-[#1597E5]"
              />

              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            /* Empty state */

            <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Inbox size={30} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No notifications found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {activeFilter === "unread"
                  ? "You are all caught up. You have no unread notifications."
                  : activeFilter === "read"
                    ? "You do not have any read notifications yet."
                    : "There are currently no notifications in your account."}
              </p>
            </div>
          ) : (
            /* Notification list */

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group flex gap-3 px-5 py-5 transition sm:gap-4 ${
                    !notification.is_read
                      ? "bg-sky-50/70 hover:bg-sky-50 dark:bg-sky-950/20 dark:hover:bg-sky-950/40"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        notification.is_read
                          ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-[#1597E5] text-white"
                      }`}
                    >
                      <Bell size={19} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenNotification(notification)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm ${
                          notification.is_read
                            ? "font-medium text-slate-700 dark:text-slate-300"
                            : "font-bold text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {notification.title}
                      </h3>

                      {!notification.is_read && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {notification.message}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                      {notification.category && (
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {notification.category.replaceAll("_", " ")}
                        </span>
                      )}

                      <span>{formatDate(notification.created_at)}</span>
                    </div>
                  </button>

                  <div className="flex flex-shrink-0 items-start gap-1">
                    {!notification.is_read && (
                      <button
                        type="button"
                        title="Mark as read"
                        aria-label="Mark as read"
                        disabled={actionLoading === notification.id}
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-sky-100 hover:text-sky-700 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-sky-900/40 dark:hover:text-sky-300"
                      >
                        <Check size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Delete notification"
                      aria-label="Delete notification"
                      disabled={actionLoading === notification.id}
                      onClick={() => handleDelete(notification.id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}

          {!loading && totalCount > 0 && (
            <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {firstItem}-{lastItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {totalCount}
                </span>{" "}
                notifications
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="px-2 text-sm text-slate-600 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}