import { DeviceStatus } from '../../types/index.ts';

interface Props { status: DeviceStatus; }

const MAP: Record<DeviceStatus, { label: string; cls: string }> = {
  NORMAL:  { label: '● Normal',  cls: 'badge-normal'  },
  ALERT:   { label: '▲ Alert',   cls: 'badge-alert'   },
  OFFLINE: { label: '○ Offline', cls: 'badge-offline' },
};

export default function StatusBadge({ status }: Props) {
  const { label, cls } = MAP[status] ?? MAP.OFFLINE;
  return <span className={`badge ${cls}`}>{label}</span>;
}
