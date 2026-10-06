"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/hosted-zones");
  }, [router]);
  return (
    <div className="loading-row">
      <span className="spinner" /> Redirecting…
    </div>
  );
}
