"use client";

import { useSyncExternalStore } from "react";
import { Landmark, ShieldCheck, Moon, Sun, ArrowLeft } from "lucide-react";
import LoginForm from "./LoginForm";
import Link from "next/link";


const THEME_KEY = "dashboard-theme";

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

export default function LoginLayout() {
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  function toggleTheme() {
    const nextTheme = darkMode ? "light" : "dark";

    localStorage.setItem(THEME_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event("theme-change"));
  }

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-5 transition-colors duration-300 sm:px-6 ${
        darkMode ? "bg-slate-950" : "bg-[#F4F7FB]"
      }`}
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#1597E5]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#1597E5]/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Page header */}
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to Home"
              title="Back to Home"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1597E5] text-white transition hover:bg-[#1177C2] focus:outline-none focus:ring-2 focus:ring-[#1597E5] focus:ring-offset-2 dark:bg-[#1597E5] dark:hover:bg-[#1177C2] dark:focus:ring-[#1597E5]"
            >
              <Landmark size={20} color="white" />
            </Link>

            <div>
              <p
                className={`text-sm font-bold tracking-tight sm:text-base ${
                  darkMode ? "text-white" : "text-[#172B4D]"
                }`}
              >
                Fixed Assets Management System
              </p>

              <p
                className={`text-xs ${
                  darkMode ? "text-slate-400" : "text-[#718096]"
                }`}
              >
                Fixed Assets Management System
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:flex ${
                darkMode
                  ? "border-slate-700 bg-slate-900 text-slate-300"
                  : "border-[#E5EBF2] bg-white text-[#52647A]"
              }`}
            >
              <ShieldCheck size={14} className="text-[#1597E5]" />
              Secure staff access
            </div>



            
            {/* Shared dashboard theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              title={darkMode ? "Light mode" : "Dark mode"}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition ${
                darkMode
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border-[#E5EBF2] bg-white text-[#52647A] hover:bg-slate-50"
              }`}
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>

        {/* Login form */}
        <LoginForm darkMode={darkMode} />

        {/* Footer */}
        <footer
          className={`mt-4 flex flex-col items-center justify-between gap-2 text-center text-xs sm:flex-row sm:text-left ${
            darkMode ? "text-slate-400" : "text-[#718096]"
          }`}
        >
          <p>
            © {new Date().getFullYear()} Fixed Assets Management System
          </p>

          <p className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#1597E5]" />
            Authorized personnel only
          </p>
        </footer>
      </div>
    </main>
  );
}