"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  FolderGit2,
  PlusCircle,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navItems = [
    {
      name: "Projects",
      href: "/projects",
      icon: FolderGit2,
      active: pathname === "/projects",
    },
    {
      name: "Option A — New Idea",
      href: "/blueprint/new",
      icon: Sparkles,
      active: pathname === "/blueprint/new",
    },
    {
      name: "Option B — Launch Audit",
      href: "/projects/new",
      icon: PlusCircle,
      active: pathname === "/projects/new",
    },
    {
      name: "Profile Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#16181B] border-b border-[#2A2D31]">
        <Link href="/projects" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#D97B3F] rounded-[4px] flex items-center justify-center font-mono font-bold text-[#0B0C0E] text-xs">
            P
          </div>
          <span className="font-semibold text-base tracking-tight text-[#EDEDEF]">prodexa</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-[#8B8F97] hover:text-[#EDEDEF]"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#16181B] border-b border-[#2A2D31] px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#D97B3F]/10 text-[#D97B3F] border border-[#D97B3F]/20"
                    : "text-[#8B8F97] hover:text-[#EDEDEF] hover:bg-[#1E2124]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#C25A4D] hover:bg-[#C25A4D]/10 rounded-[6px] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#2A2D31] bg-[#16181B] min-h-screen p-4 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center justify-between pb-6 border-b border-[#2A2D31]">
          <Link href="/projects" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#D97B3F] rounded-[4px] flex items-center justify-center font-mono font-bold text-[#0B0C0E] text-sm">
              P
            </div>
            <div>
              <div className="font-semibold text-base tracking-tight text-[#EDEDEF]">prodexa</div>
              <div className="text-[10px] font-mono text-[#8B8F97]">Readiness Platform</div>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 pt-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B8F97] px-3 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[#D97B3F]/10 text-[#D97B3F] border border-[#D97B3F]/20"
                    : "text-[#8B8F97] hover:text-[#EDEDEF] hover:bg-[#1E2124]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="pt-4 border-t border-[#2A2D31] space-y-3">
          {user && (
            <Link
              href="/settings"
              className="px-3 py-2 bg-[#0B0C0E] border border-[#2A2D31] hover:border-[#D97B3F]/40 rounded-[6px] flex items-center gap-2 transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#D97B3F]/20 border border-[#D97B3F]/30 flex items-center justify-center text-xs font-mono font-bold text-[#D97B3F] group-hover:scale-105 transition-transform">
                {user.displayName ? user.displayName[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 truncate">
                <div className="text-xs font-medium text-[#EDEDEF] truncate group-hover:text-[#D97B3F] transition-colors">
                  {user.displayName || "User Profile"}
                </div>
                <div className="text-[10px] font-mono text-[#8B8F97] truncate">
                  {user.email}
                </div>
              </div>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#8B8F97] hover:text-[#C25A4D] hover:bg-[#1E2124] rounded-[6px] transition-colors border border-transparent hover:border-[#2A2D31]"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </span>
            <span className="font-mono text-[10px] text-[#8B8F97]/60">v1.0</span>
          </button>
        </div>
      </aside>
    </>
  );
}
