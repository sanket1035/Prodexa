"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/lib/sidebar/SidebarContext";
import { useTheme } from "@/lib/theme/ThemeContext";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Menu, ChevronRight, Sparkles, Sun, Moon, Monitor,
  Settings, LogOut, Check, ChevronDown
} from "lucide-react";

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  if (pathname === "/projects") return [{ label: "Projects", href: "/projects" }];
  if (pathname === "/blueprint/new") return [
    { label: "Projects", href: "/projects" },
    { label: "New Blueprint", href: "/blueprint/new" }
  ];
  if (pathname === "/projects/new") return [
    { label: "Projects", href: "/projects" },
    { label: "Launch Audit", href: "/projects/new" }
  ];
  if (pathname === "/settings") return [
    { label: "Workspace", href: "/projects" },
    { label: "Settings", href: "/settings" }
  ];
  if (pathname.startsWith("/dashboard/")) return [
    { label: "Projects", href: "/projects" },
    { label: "Launch Report", href: pathname }
  ];
  if (pathname.startsWith("/blueprint/")) return [
    { label: "Projects", href: "/projects" },
    { label: "Blueprint Workspace", href: pathname }
  ];
  return [{ label: "Workspace", href: "/projects" }];
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const themeRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/" || pathname === "/login") return null;

  const crumbs = getBreadcrumbs(pathname);
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email ? user.email[0].toUpperCase()
    : "U";

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    router.push("/");
  };

  return (
    <header
      className="app-navbar px-4 gap-4"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}
    >
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden btn btn-ghost btn-sm"
        onClick={toggle}
        aria-label="Toggle mobile menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href + i}>
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
            )}
            <Link
              href={crumb.href}
              className="text-[13px] font-medium truncate transition-colors"
              style={{
                color: i === crumbs.length - 1 ? "var(--text)" : "var(--text-muted)",
                textDecoration: "none"
              }}
            >
              {crumb.label}
            </Link>
          </React.Fragment>
        ))}
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Primary Quick Action Button */}
        <Link
          href="/blueprint/new"
          className="btn btn-primary btn-sm hidden sm:inline-flex"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Blueprint</span>
        </Link>

        {/* Polished Theme Switcher Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="btn btn-secondary btn-sm gap-1.5"
            title="Switch theme"
          >
            <ThemeIcon className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            <span className="capitalize hidden md:inline text-xs">{theme}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {themeMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-36 rounded-xl p-1.5 z-50 anim-scale"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow)"
              }}
            >
              {[
                { id: "dark", label: "Dark", icon: Moon },
                { id: "light", label: "Light", icon: Sun },
                { id: "system", label: "System", icon: Monitor },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id as any);
                      setThemeMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left"
                    style={{
                      color: isSelected ? "var(--accent)" : "var(--text-secondary)",
                      background: isSelected ? "rgba(217,119,6,0.08)" : "transparent",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Profile Menu Dropdown */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-1.5 rounded-full focus:outline-none"
              title="Account Menu"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold cursor-pointer"
                style={{
                  background: "rgba(217,119,6,0.18)",
                  color: "var(--accent)",
                  border: "1px solid rgba(217,119,6,0.3)"
                }}
              >
                {initials}
              </div>
            </button>

            {profileMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-56 rounded-xl p-2 z-50 anim-scale space-y-1"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)"
                }}
              >
                {/* User Info Header */}
                <div className="px-2.5 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                    {user.displayName || "User"}
                  </div>
                  <div className="text-[11px] font-mono truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {user.email}
                  </div>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ color: "var(--text-secondary)", textDecoration: "none" }}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings &amp; Integrations</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ color: "var(--error)" }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
