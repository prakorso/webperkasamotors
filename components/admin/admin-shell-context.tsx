"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminShellContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AdminShellContext = createContext<AdminShellContextValue | null>(null);

/** Coordinates the tablet/mobile off-canvas sidebar between Topbar (toggle) and Sidebar (panel). */
export function AdminShellProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <AdminShellContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) throw new Error("useAdminShell must be used within AdminShellProvider");
  return ctx;
}
