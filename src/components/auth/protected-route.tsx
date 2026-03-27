"use client";

import { PropsWithChildren } from "react";
import { useProtectedRoute } from "@/hooks/use-protected-route";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { ready, authorized } = useProtectedRoute("/login");

  if (!ready || !authorized) {
    return (
      <div className="page-center">
        <div className="loader" />
      </div>
    );
  }

  return <>{children}</>;
}

