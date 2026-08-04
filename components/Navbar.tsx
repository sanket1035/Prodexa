"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/lib/sidebar/SidebarContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { Menu, Search, Bell, ChevronRight, PlusCircle, Sparkles } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/projects":       "Projects",
  "/blueprint/new":  "New Blueprint",
  "/projects/new":   "Launch Audit",
  "/settings":       "Settings",
};

function getBreadcrumb(pathname: string): { label: string; href: string }[] {
  if (pathname.startsWith("/dashboard/")) return [
    { label: "Projects", href: "/projects" },
    { label: "Launch Report", href: pathname },
  ];
  if (pathname.startsWith("/blueprint/") && !pathname.endsWith("/new")) return [
    { label: "Projects", href: "/projects" },
    { label: "Blueprint", href: pathname },
  ];
  const label = ROUTE_LABELS[pathname];
  if (label) return [{ label, href: pathname }];
  return [{ label: "Prodexa", href: "/projects" }];
}

export default function Navbar() {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  if (pathname === "/" || pathname === "/login") return null;

  const crumbs = getBreadcrumb(pathname);

  return (
    <header
      className="app-navbar px-4 gap-4"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}
    >
      {/* Mobile menu toggle */}
      <button
        className="md:hidden btn btn-ghost btn-sm"
        onClick={toggle}
        aria-label="Toggle sidebar"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
            )}
            <Link
              href={crumb.href}
              className="text-[13px] font-medium truncate hover:text-[color:var(--text)] transition-colors"
              style={{ color: i === crumbs.length - 1 ? "var(--text)" : "var(--text-muted)", textDecoration: "none" }}
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Quick new */}
        <Link
          href="/blueprint/new"
          className="btn btn-secondary btn-sm hidden sm:inline-flex"
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          <span>New Blueprint</span>
        </Link>

        <Link
          href="/projects/new"
          className="btn btn-primary btn-sm hidden sm:inline-flex"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Audit</span>
        </Link>

        {/* Notifications placeholder */}
        <button
          className="btn btn-ghost btn-sm relative"
          aria-label="Notifications"
          style={{ color: "var(--text-muted)" }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        </button>

        {/* Profile avatar */}
        {user && (
          <Link href="/settings" style={{ textDecoration: "none" }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer"
              style={{ background: "rgba(217,119,6,0.2)", color: "var(--accent)", border: "1px solid rgba(217,119,6,0.3)" }}
              title={user.email ?? "Profile"}
            >
              {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "U"}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
