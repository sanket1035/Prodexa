"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSidebar } from "@/lib/sidebar/SidebarContext";
import {
  FolderGit2, Lightbulb, Activity, Settings, PanelLeftClose, PanelLeftOpen,
  LogOut, Zap
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ href, icon: Icon, label, badge, active, collapsed }: NavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`nav-item ${active ? "active" : ""}`}
    >
      <Icon className="icon w-[16px] h-[16px] flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="label text-[13px]">{label}</span>
          {badge && (
            <span
              className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{
                background: active ? "rgba(217,119,6,0.15)" : "var(--surface-hover)",
                color: active ? "var(--accent)" : "var(--text-faint)"
              }}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't render on public routes
  if (pathname === "/" || pathname === "/login") return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email ? user.email[0].toUpperCase()
    : "U";

  const NAV_GROUPS = [
    {
      label: "Workspace",
      items: [
        { href: "/projects",     icon: FolderGit2, label: "Projects" },
        { href: "/blueprint/new",icon: Lightbulb,  label: "New Blueprint", badge: "A" },
        { href: "/projects/new", icon: Activity,   label: "Launch Audit",  badge: "B" },
      ],
    },
    {
      label: "Preferences",
      items: [
        { href: "/settings",     icon: Settings,   label: "Settings" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="app-sidebar-overlay md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        {/* Logo & Collapse Toggle Header */}
        <div
          className="flex items-center justify-between px-3 flex-shrink-0"
          style={{ height: "var(--navbar-h)", borderBottom: "1px solid var(--border)" }}
        >
          {!collapsed ? (
            <Link href="/projects" className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent)" }}
              >
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-[13px] tracking-tight" style={{ color: "var(--text)" }}>
                prodexa
              </span>
            </Link>
          ) : (
            <Link href="/projects" className="mx-auto">
              <div
                className="w-7 h-7 rounded-[6px] flex items-center justify-center"
                style={{ background: "var(--accent)" }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
            </Link>
          )}

          {!collapsed && (
            <button
              onClick={toggle}
              title="Collapse sidebar (Ctrl+B)"
              className="btn btn-ghost btn-sm"
              style={{ flexShrink: 0, padding: "0 6px", color: "var(--text-faint)" }}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Simplified Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {collapsed && (
            <button
              onClick={toggle}
              title="Expand sidebar (Ctrl+B)"
              className="nav-item w-full justify-center mb-2"
            >
              <PanelLeftOpen className="w-[16px] h-[16px]" />
            </button>
          )}

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <span className="nav-group-label">{group.label}</span>
              )}
              {group.items.map((item) => (
                <NavItem
                  key={item.href + item.label}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  active={
                    item.href === "/projects"
                      ? pathname === "/projects" || pathname.startsWith("/dashboard")
                      : pathname.startsWith(item.href)
                  }
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Clean Footer User Profile */}
        <div
          className="px-2 py-2 flex-shrink-0 space-y-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {user && !collapsed && (
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors"
              style={{ textDecoration: "none" }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "rgba(217,119,6,0.18)",
                  color: "var(--accent)",
                  border: "1px solid rgba(217,119,6,0.3)"
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate" style={{ color: "var(--text)" }}>
                  {user.displayName || "User"}
                </div>
                <div className="text-[11px] truncate font-mono" style={{ color: "var(--text-faint)" }}>
                  {user.email}
                </div>
              </div>
            </Link>
          )}

          {user && collapsed && (
            <Link href="/settings" className="nav-item justify-center" title={user.email ?? "Profile"}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(217,119,6,0.18)", color: "var(--accent)" }}
              >
                {initials}
              </div>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className={`nav-item w-full ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Sign Out" : undefined}
            style={{ color: "var(--error)" } as React.CSSProperties}
          >
            <LogOut className="icon w-[15px] h-[15px]" />
            {!collapsed && <span className="label text-[13px]">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
