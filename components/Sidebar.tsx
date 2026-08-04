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
  ChevronRight,
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
      name: "New Idea",
      href: "/blueprint/new",
      icon: Sparkles,
      label: "Option A",
      active: pathname === "/blueprint/new",
    },
    {
      name: "Launch Audit",
      href: "/projects/new",
      icon: PlusCircle,
      label: "Option B",
      active: pathname === "/projects/new",
    },
  ];

  const bottomItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ];

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const isActive = item.active;

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
          isActive
            ? "bg-[#1C1C1F] text-[#FAFAFA] border border-white/[0.08]"
            : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#111113]"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#D97706] rounded-r-full" />
        )}
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#D97706]" : "text-[#71717A] group-hover:text-[#A1A1AA]"}`} />
        <span className="flex-1 truncate">{item.name}</span>
        {"label" in item && item.label && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md font-mono ${
            isActive ? "bg-[#D97706]/20 text-[#D97706]" : "bg-white/[0.06] text-[#71717A]"
          }`}>
            {item.label}
          </span>
        )}
        {isActive && (
          <ChevronRight className="w-3.5 h-3.5 text-[#71717A] opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#09090B] border-b border-white/[0.08] z-50">
        <Link href="/projects" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#D97706] rounded-[6px] flex items-center justify-center">
            <span className="font-bold text-[#09090B] text-xs font-mono tracking-tighter">P</span>
          </div>
          <span className="font-semibold text-sm text-[#FAFAFA] tracking-tight">prodexa</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] rounded-lg hover:bg-white/[0.05] transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-72 bg-[#111113] border-r border-white/[0.08] p-4 space-y-1 overflow-y-auto">
            <div className="flex items-center gap-2.5 pb-4 mb-2 border-b border-white/[0.08]">
              <div className="w-7 h-7 bg-[#D97706] rounded-[6px] flex items-center justify-center">
                <span className="font-bold text-[#09090B] text-xs font-mono">P</span>
              </div>
              <span className="font-semibold text-sm text-[#FAFAFA]">prodexa</span>
            </div>
            {navItems.map((item) => <NavLink key={item.href} item={item} />)}
            {bottomItems.map((item) => <NavLink key={item.href} item={item} />)}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#EF4444]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#111113] border-r border-white/[0.08] min-h-screen flex-shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-white/[0.06]">
          <Link href="/projects" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-[#D97706] rounded-[6px] flex items-center justify-center flex-shrink-0 group-hover:bg-[#F59E0B] transition-colors">
              <span className="font-bold text-[#09090B] text-xs font-mono tracking-tighter">P</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-[#FAFAFA] tracking-tight leading-none">prodexa</div>
              <div className="text-[10px] text-[#71717A] font-mono mt-0.5">AI Product OS</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#3F3F46] px-3 mb-2 mt-1">
            Workspace
          </div>
          {navItems.map((item) => <NavLink key={item.href} item={item} />)}

          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#3F3F46] px-3 mb-2 mt-4">
            Account
          </div>
          {bottomItems.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          {user && (
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#18181B] transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#D97706]/20 border border-[#D97706]/30 flex items-center justify-center text-xs font-semibold text-[#D97706] flex-shrink-0">
                {user.displayName ? user.displayName[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[#FAFAFA] truncate group-hover:text-[#D97706] transition-colors">
                  {user.displayName || "User"}
                </div>
                <div className="text-[10px] text-[#71717A] truncate font-mono">
                  {user.email}
                </div>
              </div>
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
