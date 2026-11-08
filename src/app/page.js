"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  ShieldCheck,
  Moon,
  Sun,
  ArrowRight,
  Menu,
  X,
  Package,
  ScanLine,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  LockKeyhole,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Asset Registry",
    description:
      "Maintain a centralized record of organizational equipment, asset tags, categories, and assigned locations.",
    number: "01",
  },
  {
    icon: ScanLine,
    title: "Barcode Tracking",
    description:
      "Identify assets through their tags and support controlled exit verification and return check-in.",
    number: "02",
  },
  {
    icon: ArrowLeftRight,
    title: "Asset Transfers",
    description:
      "Coordinate movements between buildings, departments, and units with approvals and accountability.",
    number: "03",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description:
      "Manage maintenance requests, approvals, service records, and the condition of organizational assets.",
    number: "04",
  },
  {
    icon: ClipboardCheck,
    title: "Accountability",
    description:
      "Keep track of asset assignments, exit requests, movement history, and responsible personnel.",
    number: "05",
  },
  {
    icon: BarChart3,
    title: "Reports & Valuation",
    description:
      "Access asset reports, movement records, maintenance summaries, audit trails, and valuation information.",
    number: "06",
  },
];

const workflow = [
  {
    icon: Package,
    title: "Register",
    description:
      "Record an asset and associate it with its category and organizational location.",
  },
  {
    icon: ScanLine,
    title: "Track",
    description:
      "Use asset tags and authorized scanning stations to support controlled asset movements.",
  },
  {
    icon: ShieldCheck,
    title: "Verify",
    description:
      "Apply the appropriate authorization and verification steps to asset movements.",
  },
  {
    icon: ClipboardCheck,
    title: "Account",
    description:
      "Maintain records of assignments, returns, maintenance, and asset history.",
  },
];

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Synchronize the landing page with the dashboard theme.
  useEffect(() => {
    const updateTheme = () => {
      const isDark = localStorage.getItem("dashboard-theme") === "dark";

      setDarkMode(isDark);
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
      document.documentElement.classList.toggle("dark", isDark);
    };

    updateTheme();

    window.addEventListener("theme-change", updateTheme);
    window.addEventListener("storage", updateTheme);

    return () => {
      window.removeEventListener("theme-change", updateTheme);
      window.removeEventListener("storage", updateTheme);
    };
  }, []);

  // Save and broadcast theme changes.
  const toggleTheme = () => {
    setDarkMode((current) => {
      const nextTheme = !current;

      localStorage.setItem(
        "dashboard-theme",
        nextTheme ? "dark" : "light"
      );

      document.documentElement.dataset.theme = nextTheme
        ? "dark"
        : "light";

      document.documentElement.classList.toggle("dark", nextTheme);

      window.dispatchEvent(new Event("theme-change"));

      return nextTheme;
    });
  };

  const theme = darkMode
    ? {
        page: "bg-slate-950 text-slate-100",
        nav: "border-slate-800 bg-slate-950/85",
        muted: "text-slate-400",
        heading: "text-white",
        panel: "border-slate-800 bg-slate-900",
        softPanel: "border-slate-800 bg-slate-900/60",
        section: "bg-slate-900/40",
        input: "border-slate-700 bg-slate-900",
        line: "border-slate-800",
        iconPanel: "bg-slate-800 text-[#1597E5]",
        footer: "border-slate-800 bg-slate-950",
      }
    : {
        page: "bg-[#F4F7FB] text-[#172B4D]",
        nav: "border-[#E5EBF2] bg-white/85",
        muted: "text-[#718096]",
        heading: "text-[#172B4D]",
        panel: "border-[#E5EBF2] bg-white",
        softPanel: "border-[#E5EBF2] bg-white/80",
        section: "bg-white",
        input: "border-[#E5EBF2] bg-white",
        line: "border-[#E5EBF2]",
        iconPanel: "bg-[#EAF5FE] text-[#1597E5]",
        footer: "border-[#E5EBF2] bg-white",
      };

  const closeMenu = () => setMenuOpen(false);

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-300 ${theme.page}`}
    >
      {/* Navigation */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${theme.nav}`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Fixed Assets Management System"
            onClick={closeMenu}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1597E5] text-white shadow-lg shadow-blue-500/20">
              <Landmark size={23} />
            </div>

            <div>
              <p
                className={`text-sm font-extrabold tracking-tight sm:text-base ${theme.heading}`}
              >
                Asset Portal
              </p>

              <p
                className={`mt-0.5 text-[10px] font-medium tracking-[0.14em] sm:text-xs ${theme.muted}`}
              >
                FIXED ASSETS MANAGEMENT
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className={`text-sm font-medium transition-colors hover:text-[#1597E5] ${theme.muted}`}
            >
              Home
            </a>

            <a
              href="#features"
              className={`text-sm font-medium transition-colors hover:text-[#1597E5] ${theme.muted}`}
            >
              Features
            </a>

            <a
              href="#workflow"
              className={`text-sm font-medium transition-colors hover:text-[#1597E5] ${theme.muted}`}
            >
              How it works
            </a>

            <a
              href="#about"
              className={`text-sm font-medium transition-colors hover:text-[#1597E5] ${theme.muted}`}
            >
              About
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition hover:border-[#1597E5] ${theme.line}`}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/Login"
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:border-[#1597E5] ${theme.line}`}
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-[#087FC5]"
            >
              Create Account
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${theme.line}`}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${theme.line}`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className={`border-t px-5 py-5 md:hidden ${theme.line}`}>
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              {[
                ["Home", "#home"],
                ["Features", "#features"],
                ["How it works", "#workflow"],
                ["About", "#about"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className={`py-1 text-sm font-medium hover:text-[#1597E5] ${theme.muted}`}
                >
                  {label}
                </a>
              ))}

              <Link
                href="/Login"
                onClick={closeMenu}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-5 py-3 text-sm font-semibold text-white"
              >
                Staff Sign In <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative isolate">
        <div className="pointer-events-none absolute -left-40 top-10 -z-10 h-96 w-96 rounded-full bg-[#1597E5]/10 blur-[100px]" />

        <div className="pointer-events-none absolute -right-40 top-32 -z-10 h-96 w-96 rounded-full bg-sky-400/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-28">
          {/* Decorative side lines */}
          <div
            className={`pointer-events-none absolute bottom-0 left-10 top-0 hidden w-px lg:block ${theme.line}`}
          />

          <div
            className={`pointer-events-none absolute bottom-0 right-10 top-0 hidden w-px lg:block ${theme.line}`}
          />

          <div className="hero-content mx-auto flex max-w-4xl flex-col items-center text-center">
            <div
              className={`mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold sm:text-sm ${theme.softPanel}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1597E5] opacity-40" />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1597E5]" />
              </span>

              A centralized approach to asset management
            </div>

            <h1
              className={`max-w-4xl text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl ${theme.heading}`}
            >
              Every asset.
              <br />

              <span className="bg-gradient-to-r from-[#1597E5] via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                Accounted for.
              </span>
            </h1>

            <p
              className={`hero-description mx-auto mt-7 max-w-2xl text-base leading-8 sm:text-lg ${theme.muted}`}
            >
              A centralized platform for managing assets, monitoring
              equipment movements, coordinating maintenance, and improving
              accountability across buildings, departments, and units.
            </p>

            <div className="hero-buttons mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/Login"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1597E5] px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#087FC5]"
              >
                Access Staff Portal

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#features"
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-bold transition hover:-translate-y-1 hover:border-[#1597E5] ${theme.panel}`}
              >
                Explore Features
                <ChevronRight size={17} />
              </a>
            </div>

            <div
              className={`mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-medium sm:text-sm ${theme.muted}`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#1597E5]" />
                Controlled access
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-400 sm:block" />

              <span className="flex items-center gap-2">
                <ScanLine size={16} className="text-[#1597E5]" />
                Tag-based tracking
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-400 sm:block" />

              <span className="flex items-center gap-2">
                <Building2 size={16} className="text-[#1597E5]" />
                Structured locations
              </span>
            </div>
          </div>

          {/* Dashboard-inspired preview */}
          <div
            className={`hero-preview relative mx-auto mt-16 max-w-5xl rounded-2xl border p-2 shadow-2xl shadow-slate-900/10 sm:mt-20 sm:rounded-3xl sm:p-3 ${theme.panel}`}
          >
            <div
              className={`overflow-hidden rounded-xl border sm:rounded-2xl ${theme.line}`}
            >
              <div
                className={`flex items-center justify-between border-b px-4 py-3 sm:px-6 ${theme.line} ${theme.section}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1597E5] text-white">
                    <Landmark size={19} />
                  </div>

                  <div>
                    <p className={`text-xs font-bold sm:text-sm ${theme.heading}`}>
                      Asset Portal
                    </p>

                    <p className={`text-[10px] sm:text-xs ${theme.muted}`}>
                      Asset management overview
                    </p>
                  </div>
                </div>

                <div
                  className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex ${theme.line}`}
                >
                  <ShieldCheck size={14} className="text-[#1597E5]" />
                  <span className={theme.muted}>Secure workspace</span>
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div>
                    <p className={`text-xs font-medium ${theme.muted}`}>
                      ASSET OVERSIGHT
                    </p>

                    <h2
                      className={`mt-1 text-xl font-bold sm:text-2xl ${theme.heading}`}
                    >
                      Manage with confidence.
                    </h2>

                    <p
                      className={`mt-2 max-w-md text-xs leading-6 sm:text-sm ${theme.muted}`}
                    >
                      Keep asset records, locations, assignments, and movements
                      organized in one system.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Asset Registry", icon: Package },
                      { label: "Asset Transfers", icon: ArrowLeftRight },
                      { label: "Maintenance", icon: Wrench },
                      { label: "Reports & Audit", icon: BarChart3 },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 ${theme.softPanel}`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.iconPanel}`}
                        >
                          <item.icon size={18} />
                        </div>

                        <span
                          className={`text-xs font-semibold sm:text-sm ${theme.heading}`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`flex flex-col justify-between rounded-xl border p-4 sm:p-5 ${theme.softPanel}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold ${theme.heading}`}>
                        Built for accountability
                      </p>

                      <ShieldCheck
                        size={20}
                        className="text-[#1597E5]"
                      />
                    </div>

                    <p className={`mt-2 text-xs leading-6 ${theme.muted}`}>
                      Support consistent asset management procedures from
                      registration to movement and maintenance.
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    {[
                      "Centralized asset information",
                      "Structured location hierarchy",
                      "Controlled movement workflows",
                      "Traceable activity records",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2.5"
                      >
                        <CheckCircle2
                          size={17}
                          className="mt-0.5 shrink-0 text-[#1597E5]"
                        />

                        <span
                          className={`text-xs leading-5 sm:text-sm ${theme.muted}`}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/Login"
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1597E5] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#087FC5] sm:text-sm"
                  >
                    Enter the portal
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mx-auto mt-5 flex max-w-5xl items-center justify-center gap-2 text-center text-xs ${theme.muted}`}
          >
            <LockKeyhole size={14} className="shrink-0 text-[#1597E5]" />

            <span>
              Public information on this page. Operational access requires
              sign-in.
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className={`border-y py-20 sm:py-24 ${theme.line} ${theme.section}`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1597E5]">
              Platform capabilities
            </p>

            <h2
              className={`mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl ${theme.heading}`}
            >
              Everything in its right place.
            </h2>

            <p
              className={`mt-5 text-sm leading-7 sm:text-base ${theme.muted}`}
            >
              Organize the asset lifecycle with connected records, structured
              processes, and visibility into day-to-day operations.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.number}
                className={`group rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 hover:border-[#1597E5]/50 hover:shadow-xl hover:shadow-blue-500/5 sm:p-7 ${theme.panel}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:bg-[#1597E5] group-hover:text-white ${theme.iconPanel}`}
                  >
                    <feature.icon size={23} />
                  </div>

                  <span
                    className={`text-xs font-bold tracking-widest ${theme.muted}`}
                  >
                    {feature.number}
                  </span>
                </div>

                <h3 className={`mt-6 text-lg font-bold ${theme.heading}`}>
                  {feature.title}
                </h3>

                <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                  {feature.description}
                </p>

                <div className="mt-5 h-0.5 w-8 rounded-full bg-[#1597E5]/40 transition-all duration-300 group-hover:w-16 group-hover:bg-[#1597E5]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="relative py-20 sm:py-24">
        <div className="pointer-events-none absolute -right-40 top-10 h-80 w-80 rounded-full bg-[#1597E5]/5 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1597E5]">
                A structured workflow
              </p>

              <h2
                className={`mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl ${theme.heading}`}
              >
                From registration to accountability.
              </h2>

              <p
                className={`mt-5 text-sm leading-7 sm:text-base ${theme.muted}`}
              >
                Follow a structured approach to asset management, with
                processes that help authorized personnel record, verify, and
                track important asset activities.
              </p>

              <Link
                href="/Login"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#1597E5] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-[#087FC5]"
              >
                Access the Portal
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="relative space-y-4">
              <div className="absolute bottom-12 left-6 top-12 w-px bg-gradient-to-b from-[#1597E5]/70 via-[#1597E5]/30 to-transparent" />

              {workflow.map((step, index) => (
                <div
                  key={step.title}
                  className={`workflow-step relative flex gap-5 rounded-2xl border p-5 sm:p-6 ${theme.panel}`}
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#1597E5]/20 bg-[#1597E5] text-white shadow-lg shadow-blue-500/10">
                    <step.icon size={22} />
                  </div>

                  <div className="pt-0.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3
                        className={`text-base font-bold sm:text-lg ${theme.heading}`}
                      >
                        {step.title}
                      </h3>

                      <span className="rounded-full bg-[#1597E5]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1597E5]">
                        Step 0{index + 1}
                      </span>
                    </div>

                    <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accountability banner */}
      <section
        id="about"
        className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10"
      >
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#087FC5] via-[#1597E5] to-sky-500 px-6 py-12 text-white shadow-2xl shadow-blue-500/15 sm:px-12 sm:py-16 lg:px-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/15" />

          <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-white/15" />

          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <ShieldCheck size={15} />
                Transparency through better records
              </div>

              <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Know what you have.
                <br className="hidden sm:block" /> Know where it is.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
                Support responsible asset stewardship with organized records,
                controlled movement processes, and clear operational
                accountability.
              </p>
            </div>

            <Link
              href="/Login"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#117FC2] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-1 hover:bg-[#1597E5]"
            >
              Sign In to Continue

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${theme.line} ${theme.footer}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1597E5] text-white">
              <Landmark size={21} />
            </div>

            <div>
              <p className={`text-sm font-bold ${theme.heading}`}>
                Asset Portal
              </p>

              <p className={`mt-0.5 text-xs ${theme.muted}`}>
                Fixed Assets Management System
              </p>
            </div>
          </Link>

          <div
            className={`flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium ${theme.muted}`}
          >
            <a href="#home" className="transition hover:text-[#1597E5]">
              Home
            </a>

            <a href="#features" className="transition hover:text-[#1597E5]">
              Features
            </a>

            <a href="#workflow" className="transition hover:text-[#1597E5]">
              How it works
            </a>

            <Link
              href="/Login"
              className="transition hover:text-[#1597E5]"
            >
              Staff Sign In
            </Link>
          </div>

          <div
            className={`flex flex-col gap-2 text-xs md:items-end ${theme.muted}`}
          >
            <p>
              © {new Date().getFullYear()} Fixed Assets Management System
            </p>

            <p className="flex items-center gap-1.5">
              <ShieldCheck
                size={13}
                className="text-[#1597E5]"
              />
              Authorized personnel only
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}