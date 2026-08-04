"use client";

import { useSidebar } from "@/lib/sidebar/SidebarContext";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  const isPublicRoute = pathname === "/" || pathname === "/login";

  if (isPublicRoute) {
    // Public routes: no sidebar offset, full screen
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "auto" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`app-main ${collapsed ? "sidebar-collapsed" : ""}`}
      style={{ flex: 1 }}
    >
      <Navbar />
      <main className="app-content">
        <div className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
