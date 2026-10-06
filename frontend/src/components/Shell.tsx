"use client";

import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useAuth } from "./AuthProvider";

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
    <>
      <TopNav />
      <div className="app-shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </>
  );
}
