import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="section-title">
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Inbox size={30} aria-hidden="true" />
      <p>{message}</p>
      {action}
    </div>
  );
}

export function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <article className="metric">
      <span className="metric-icon" aria-hidden="true">{icon}</span>
      <p>{label}</p>
      <strong dir="auto">{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
