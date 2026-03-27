import { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ className = "", children }: CardProps) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

