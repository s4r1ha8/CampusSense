import { ReactNode } from 'react';

interface Props {
  label:    string;
  value:    string | number;
  icon?:    ReactNode;
  color?:   'normal' | 'success' | 'danger' | 'warning';
  subtext?: string;
}

const COLOR_MAP: Record<string, string> = {
  success: 'var(--success)',
  danger:  'var(--danger)',
  warning: 'var(--warning)',
  normal:  'var(--text)',
};

export default function KpiCard({ label, value, icon, color = 'normal', subtext }: Props) {
  return (
    <div className={`kpi-card ${color === 'danger' ? 'alert-card' : ''}`}>
      <div className="kpi-label">{icon}{label}</div>
      <div className="kpi-value" style={{ color: COLOR_MAP[color] }}>{value}</div>
      {subtext && <div className="kpi-sub">{subtext}</div>}
    </div>
  );
}
