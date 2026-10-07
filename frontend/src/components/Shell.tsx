"use client";

import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useAuth } from "./AuthProvider";
import { SidebarProvider, useSidebar } from "./SidebarProvider";
import { FilterFocusProvider } from "./FilterFocusProvider";
import { ShortcutsProvider } from "./ShortcutsProvider";

function AuthedShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <>
      <TopNav />
      <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // While unauthenticated (or loading), render children bare.
  // The login page provides its own layout; the AuthProvider handles redirects.
  if (loading) {
    return (
      <div className="loading-row" style={{ minHeight: "100vh" }}>
        <span className="spinner" /> Loading…
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <FilterFocusProvider>
        <ShortcutsProvider>
          <AuthedShell>{children}</AuthedShell>
        </ShortcutsProvider>
      </FilterFocusProvider>
    </SidebarProvider>
  );
}
