"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import DashboardNavbar from "./DashboardNavBar";
import DashboardSidebar from "./DashboardSideBar";

const THEME_KEY = "dashboard-theme";
const USER_CHANGE_EVENT = "user-change";

// ---------- USER STORE ----------
let cachedUserString;
let cachedUser = null;

function subscribeToUser(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(USER_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(USER_CHANGE_EVENT, callback);
  };
}

function getUserSnapshot() {
  const storedUser = sessionStorage.getItem("loggedInUser");

  // Return the same object while the stored value hasn't changed.
  if (storedUser === cachedUserString) {
    return cachedUser;
  }

  cachedUserString = storedUser;

  if (!storedUser) {
    cachedUser = null;
    return cachedUser;
  }

  try {
    cachedUser = JSON.parse(storedUser);
  } catch {
    cachedUser = null;
  }

  return cachedUser;
}

function getServerUserSnapshot() {
  return null;
}

// ---------- THEME STORE ----------
function subscribeToTheme(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("theme-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("theme-change", callback);
  };
}

function getThemeSnapshot() {
  return localStorage.getItem(THEME_KEY) === "dark";
}

function getServerThemeSnapshot() {
  return false;
}

export default function DashboardLayout({ children }) {
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const user = useSyncExternalStore(
    subscribeToUser,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply the saved theme when the component mounts.
  useEffect(() => {
    const theme = localStorage.getItem(THEME_KEY) || "light";

    document.documentElement.dataset.theme = theme;

    window.dispatchEvent(new Event("theme-change"));
    window.dispatchEvent(new Event(USER_CHANGE_EVENT));
  }, []);

  // Toggle between light and dark themes.
  const setDarkMode = (value) => {
    const nextDarkMode =
      typeof value === "function" ? value(darkMode) : value;

    const theme = nextDarkMode ? "dark" : "light";

    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;

    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <div className="dashboard-shell">
      <DashboardSidebar
        mobileMenuOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        role={user?.role || ""}
        staffType={user?.staff_type || user?.staffType || ""}
      />

      <main className="dashboard-main">
        <DashboardNavbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenSidebar={() => setMobileMenuOpen(true)}
          role={user?.role || ""}
          staffType={user?.staff_type || user?.staffType || ""}
          name={user?.name || ""}
        />

        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}