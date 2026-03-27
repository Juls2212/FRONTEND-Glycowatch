"use client";

import { PropsWithChildren } from "react";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";

export function AppBootstrap({ children }: PropsWithChildren) {
  useAuthBootstrap();
  return <>{children}</>;
}

