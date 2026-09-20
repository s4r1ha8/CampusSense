import { CurrentReading, Device } from '../../types/index.ts';
import StatusBadge from '../common/StatusBadge.tsx';

interface Props {
  reading:  CurrentReading;
  device?:  Device;
  onClick?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function SensorCard({ reading, device, onClick }: Props) {
  const isAlert = reading.status === 'ALERT';

  return (
    <div
      className={`sensor-card ${isAlert ? 'alert-state' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div className="sensor-card-header">
        <div>
          <div className="sensor-card-id">{reading.deviceId}</div>
          <div className="sensor-card-name">{device?.locationName ?? reading.deviceId}</div>
          {device && <div className="sensor-card-building">{device.building}</div>}
        </div>
        <StatusBadge status={reading.status} />
      </div>

      <div className="sensor-readings">
        <div className="sensor-reading">
          <div className="sensor-reading-label">Temp</div>
          <div className="sensor-reading-value" style={{ color: isAlert ? 'var(--status-critical)' : 'var(--on-surface)' }}>
            {reading.temperature}<span className="sensor-reading-unit">°C</span>
          </div>
        </div>
        <div className="sensor-reading">
          <div className="sensor-reading-label">Humidity</div>
          <div className="sensor-reading-value">{reading.humidity}<span className="sensor-reading-unit">%</span></div>
        </div>
      </div>

      <div className="sensor-card-footer">
        <span className="last-seen">🕐 {timeAgo(reading.lastSeenAt)}</span>
        {device && (
          <span className="threshold-info">
            Threshold: {device.temperatureThresholdC}°C / {device.humidityThresholdPercent}%
          </span>
        )}
      </div>
    </div>
  );
}
