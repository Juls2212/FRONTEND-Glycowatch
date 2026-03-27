"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function HomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    if (accessToken) {
      router.replace("/dashboard");
      return;
    }
    router.replace("/login");
  }, [isHydrated, accessToken, router]);

  return (
    <div className="page-center">
      <div className="loader" />
    </div>
  );
}

