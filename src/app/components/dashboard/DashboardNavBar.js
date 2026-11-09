"use client";

import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  LogOut,
  Settings,
  UserRound,
  KeyRound,
  Check,
  RefreshCw,
  Inbox,
  CheckCheck,
} from "lucide-react";

import api from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Assets", href: "/assets-management" },
  { label: "Buildings", href: "/buildings" },
  { label: "Departments", href: "/departments" },
  { label: "Units", href: "/units" },
  { label: "Security Stations", href: "/security-station" },
  { label: "Transfers", href: "/transfer" },
  { label: "Maintenance", href: "/maintenance" },
  { label: "Valuation", href: "/valuation" },
  { label: "Reports", href: "/report" },
  { label: "Audit Logs", href: "/audit" },
  { label: "User Management", href: "/user" },
  { label: "Settings", href: "/settings" },
  { label: "My Assets", href: "/myassets" },
  { label: "My Profile", href: "/viewprofile" },
  { label: "Department Assets", href: "/departmentassets" },
  { label: "Department Assignments", href: "/hodassignment" },
  { label: "Transfers", href: "/transfers" },
  { label: "In-Possession", href: "/confirm-possesion" },
  { label: "Maintenance Requests", href: "/usermaintenance" },
  { label: "Unit Assets", href: "/unitassets" },
  { label: "Unit Assignments", href: "/houassignment" },
  { label: "My Assignments", href: "/myassignment" },
  { label: "Exit Requests", href: "/exit-request" },
  { label: "Verify Exit", href: "/exit" },
  { label: "Notification", href: "/notification" },
  { label: "My Valuation", href: "/myvaluation" },
  { label: "Edit Profile", href: "/edit" },
];

export default function DashboardNavbar({
  darkMode,
  setDarkMode,
  onOpenSidebar,
  role = "",
  staffType = "",
  name = "",
}) {
  const pathname = usePathname();
  const router = useRouter();

  const currentPage =
    navigation.find(
      (item) =>
        item.href === pathname ||
        (item.href !== "/" && pathname.startsWith(`${item.href}/`))
    )?.label ||
    (pathname.startsWith("/settings") ? "Settings" : "Overview");

  const normalizedRole = String(role || "").trim().toLowerCase();
  const normalizedStaffType = String(staffType || "")
    .trim()
    .toUpperCase();

  const displayRole =
    normalizedRole === "administrator"
      ? "Administrator"
      : normalizedStaffType === "SECURITY"
        ? "Security Officer"
        : normalizedRole === "staff"
          ? "Staff Member"
          : "User";

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationActionLoading, setNotificationActionLoading] =
    useState(null);

  // --------------------------------------------------
  // EMAIL VERIFICATION STATUS
  // --------------------------------------------------

  useEffect(() => {
    const loadVerificationStatus = () => {
      try {
        const storedUser = sessionStorage.getItem("loggedInUser");

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setIsEmailVerified(parsedUser.is_email_verified === true);
        } else {
          setIsEmailVerified(false);
        }
      } catch (error) {
        console.error("Failed to load user verification status:", error);
        setIsEmailVerified(false);
      }
    };

    loadVerificationStatus();

    window.addEventListener("user-change", loadVerificationStatus);

    return () => {
      window.removeEventListener("user-change", loadVerificationStatus);
    };
  }, []);

  // --------------------------------------------------
  // LOAD NOTIFICATIONS
  // --------------------------------------------------

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      setNotificationError("");

      const [notificationsResponse, countResponse] = await Promise.all([
        api.get("/notification?limit=5&offset=0"),
        api.get("/notification/unread-count"),
      ]);

      const fetchedNotifications =
        notificationsResponse.data.notifications || [];

      setNotifications(fetchedNotifications);
      setUnreadCount(countResponse.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications:", {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data,
        url: error.config?.url,
      });

      setNotificationError(
        error.response?.data?.message ||
          "Unable to load notifications. Please try again."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Load unread count when navbar mounts
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await api.get("/notification/unread-count");
        setUnreadCount(response.data.unreadCount || 0);
      } catch (error) {
        console.error(
          "Failed to load unread notification count:",
          error.response?.data?.message || error.message
        );
      }
    };

    loadUnreadCount();
  }, []);

  // --------------------------------------------------
  // OPEN / CLOSE NOTIFICATION MODAL
  // --------------------------------------------------

  const toggleNotifications = () => {
    const nextState = !notificationsOpen;

    setNotificationsOpen(nextState);

    if (nextState) {
      loadNotifications();
    }
  };

  // --------------------------------------------------
  // MARK NOTIFICATION AS READ
  // --------------------------------------------------

  const handleMarkAsRead = async (notificationId) => {
    try {
      setNotificationActionLoading(notificationId);

      await api.patch(`/notification/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: true }
            : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error.response?.data?.message || error.message
      );
    } finally {
      setNotificationActionLoading(null);
    }
  };

  // --------------------------------------------------
  // MARK ALL NOTIFICATIONS AS READ
  // --------------------------------------------------

  const handleMarkAllAsRead = async () => {
    try {
      setNotificationActionLoading("all");

      await api.patch("/notification/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error.response?.data?.message || error.message
      );
    } finally {
      setNotificationActionLoading(null);
    }
  };

  // --------------------------------------------------
  // OPEN NOTIFICATION
  // --------------------------------------------------

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await api.patch(`/notification/${notification.id}/read`);

        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      setNotificationsOpen(false);

      if (notification.link) {
        router.push(notification.link);
      } else {
        router.push("/notifications");
      }
    } catch (error) {
      console.error(
        "Failed to open notification:",
        error.response?.data?.message || error.message
      );
    }
  };

  // --------------------------------------------------
  // FORMAT NOTIFICATION DATE
  // --------------------------------------------------

  const formatNotificationDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // --------------------------------------------------
  // NAVBAR
  // --------------------------------------------------

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-button mobile-menu-button"
          aria-label="Open navigation menu"
          onClick={onOpenSidebar}
        >
          <Menu size={22} />
        </button>

        <div className="breadcrumb">
          <span className="breadcrumb-root">Workspace</span>
          <span className="breadcrumb-divider">/</span>
          <strong>{currentPage}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        {/* THEME BUTTON */}
        <button
          type="button"
          className="icon-button theme-button"
          onClick={() => {
            const nextTheme = !darkMode;

            setDarkMode(nextTheme);

            localStorage.setItem(
              "dashboard-theme",
              nextTheme ? "dark" : "light"
            );

            document.documentElement.dataset.theme = nextTheme
              ? "dark"
              : "light";

            document.documentElement.classList.toggle("dark", nextTheme);

            window.dispatchEvent(new Event("theme-change"));
          }}
          aria-label={
            darkMode ? "Switch to light mode" : "Switch to dark mode"
          }
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* --------------------------------------------------
            NOTIFICATION BUTTON AND MODAL
        -------------------------------------------------- */}

        <div className="relative">
          <button
            type="button"
            className="icon-button notification-button relative"
            aria-label="Notifications"
            title="Notifications"
            aria-expanded={notificationsOpen}
            onClick={toggleNotifications}
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              {/* Outside click overlay */}
              <button
                type="button"
                aria-label="Close notifications"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setNotificationsOpen(false)}
              />

            {/* Notification modal */}
            <div className="fixed right-2 top-20 z-50 flex max-h-[calc(100dvh-6rem)] w-[calc(100vw-1rem)] max-w-[380px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:absolute sm:right-0 sm:top-full sm:mt-3 sm:w-[380px] sm:max-w-[calc(100vw-2rem)]">

              {/* Modal heading */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 dark:border-slate-700">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Notifications
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount} unread notification
                    {unreadCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                      {unreadCount} New
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={loadNotifications}
                    disabled={notificationsLoading}
                    title="Refresh notifications"
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700"
                  >
                    <RefreshCw
                      size={16}
                      className={notificationsLoading ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>

              {/* Error message */}
              {notificationError && (
                <div className="mx-3 mt-3 shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-300">
                  {notificationError}
                  <button
                    type="button"
                    onClick={loadNotifications}
                    className="ml-2 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Actual notifications */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {notificationsLoading ? (
                  <div className="px-4 py-12 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto animate-spin text-sky-600"
                    />

                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Inbox
                      size={32}
                      className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                    />

                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No notifications yet
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      You&apos;re all caught up.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 border-b border-slate-100 px-4 py-4 transition dark:border-slate-700 ${
                        !notification.is_read
                          ? "bg-sky-50/70 dark:bg-sky-900/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <span
                        className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                          notification.is_read
                            ? "bg-slate-300 dark:bg-slate-600"
                            : "bg-sky-500"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
                            {notification.title}
                          </p>

                          {!notification.is_read && (
                            <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-600 dark:text-slate-300">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {notification.category && (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {notification.category.replaceAll("_", " ")}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400">
                            {formatNotificationDate(notification.created_at)}
                          </span>
                        </div>
                      </button>

                      {!notification.is_read && (
                        <button
                          type="button"
                          title="Mark as read"
                          aria-label="Mark as read"
                          disabled={notificationActionLoading === notification.id}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-sky-100 hover:text-sky-700 disabled:opacity-50 dark:hover:bg-sky-900/50"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Modal footer */}
              <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      unreadCount === 0 ||
                      notificationActionLoading === "all"
                    }
                    onClick={handleMarkAllAsRead}
                    className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-2.5 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <CheckCheck size={15} className="shrink-0" />
                    <span>Mark all read</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      router.push("/notification");
                    }}
                    className="min-w-0 flex-1 rounded-lg bg-sky-50 px-2 py-2.5 text-center text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            </div>

            </>
          )}
        </div>

        <div className="profile-divider" />

        {/*PROFILE MENU*/}

        <div className="relative">
          <button
            type="button"
            className="profile-trigger"
            aria-label="User profile menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <div className="profile-avatar relative">
              {name
                ? name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                : "U"}

              {isEmailVerified && (
                <span
                  title="Email verified"
                  aria-label="Email verified"
                  className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-green-500 text-white dark:border-slate-800"
                >
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>

            <div className="profile-copy">
              <span className="profile-name">{name || displayRole}</span>
              <span className="profile-role">{displayRole}</span>
            </div>

            <ChevronDown
              size={16}
              className={`profile-chevron transition-transform ${
                profileMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setProfileMenuOpen(false)}
              />

              <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                {/* Profile header */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                  <div className="relative shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-bold uppercase text-sky-700 ring-2 ring-white dark:bg-sky-900 dark:text-sky-300 dark:ring-slate-800">
                      {name
                        ? name
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                        : "U"}
                    </div>

                    {isEmailVerified && (
                      <span
                        title="Email verified"
                        aria-label="Email verified"
                        className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-green-500 text-white dark:border-slate-800"
                      >
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {name || displayRole}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {displayRole}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    router.push("/viewprofile");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <UserRound size={17} />
                  View Profile
                </button>

                {/* Settings dropdown */}
                <div>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((previous) => !previous)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <span className="flex items-center gap-3">
                      <Settings size={17} />
                      Settings
                    </span>

                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        settingsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {settingsOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setSettingsOpen(false);
                        router.push("/changepassword");
                      }}
                      className="flex w-full items-center gap-3 py-3 pl-11 pr-4 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <KeyRound size={16} />
                      Change My Password
                    </button>
                  )}
                </div>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                <button
                  type="button"
                  onClick={async () => {
                    setProfileMenuOpen(false);

                    try {
                      const response = await api.post("/auth/logout");

                      if (response.data.success) {
                        sessionStorage.removeItem("loggedInUser");
                        window.dispatchEvent(new Event("user-change"));
                        router.push("/");
                      }
                    } catch (error) {
                      console.error(
                        "Logout failed:",
                        error.response?.data?.message || error.message
                      );
                    }
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut size={17} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
