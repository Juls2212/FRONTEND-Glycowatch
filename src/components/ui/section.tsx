import { PropsWithChildren, ReactNode } from "react";

type SectionProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
}>;

export function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <section className="section">
      <header className="section-header">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="section-action-slot">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}
