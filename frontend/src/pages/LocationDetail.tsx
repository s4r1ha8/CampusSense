import { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Device, CurrentReading, HistoryReading } from '../types/index.ts';
import HistoryChart from '../components/charts/HistoryChart.tsx';
import StatusBadge  from '../components/common/StatusBadge.tsx';
import { ArrowLeft, Thermometer, Droplets, Clock } from 'lucide-react';

interface Props { deviceId: string; onBack: () => void; }

export default function LocationDetail({ deviceId, onBack }: Props) {
  const [device,  setDevice]  = useState<Device | null>(null);
  const [current, setCurrent] = useState<CurrentReading | null>(null);
  const [history, setHistory] = useState<HistoryReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDevices(),
      api.getLatestReadings(),
      api.getHistory(deviceId, 24),
    ]).then(([devices, readings, hist]) => {
      setDevice(devices.find(d => d.deviceId === deviceId) ?? null);
      setCurrent(readings.find(r => r.deviceId === deviceId) ?? null);
      setHistory(hist);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [deviceId]);

  if (loading) return <div className="state-placeholder"><div className="loading-spinner"/><p>Loading…</p></div>;
  if (!device || !current) return <div className="state-placeholder"><p>Device not found.</p></div>;

  const recentHistory = [...history].reverse().slice(0, 20);

  return (
    <div>
      <div className="detail-header">
        <div>
          <button className="btn-secondary" onClick={onBack}><ArrowLeft size={14}/> Back</button>
          <div className="detail-title" style={{marginTop:12}}>{device.locationName}</div>
          <div className="detail-meta">{device.building} · {device.room} · <span className={`type-badge type-${device.type}`}>{device.type.replace('_',' ')}</span></div>
        </div>
        <StatusBadge status={current.status} />
      </div>

      {/* Current readings */}
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div className="card-title"><Thermometer size={16}/> Temperature</div>
          <div style={{fontSize:56,fontWeight:700,lineHeight:1,color: current.temperature > device.temperatureThresholdC ? 'var(--status-critical)' : 'var(--status-nominal)'}}>
            {current.temperature}°C
          </div>
          <div style={{marginTop:8,color:'var(--on-surface-variant)',fontSize:13}}>
            Threshold: <strong>{device.temperatureThresholdC}°C</strong>
          </div>
        </div>
        <div className="card">
          <div className="card-title"><Droplets size={16}/> Humidity</div>
          <div style={{fontSize:56,fontWeight:700,lineHeight:1,color: current.humidity > device.humidityThresholdPercent ? 'var(--status-critical)' : 'var(--status-nominal)'}}>
            {current.humidity}%
          </div>
          <div style={{marginTop:8,color:'var(--on-surface-variant)',fontSize:13}}>
            Threshold: <strong>{device.humidityThresholdPercent}%</strong>
          </div>
        </div>
      </div>

      {/* 24-hour charts */}
      <div className="grid-2" style={{marginBottom:24}}>
        <div className="card">
          <div className="card-title">24h Temperature</div>
          <HistoryChart readings={history} metric="temperature" threshold={device.temperatureThresholdC}/>
        </div>
        <div className="card">
          <div className="card-title">24h Humidity</div>
          <HistoryChart readings={history} metric="humidity" threshold={device.humidityThresholdPercent}/>
        </div>
      </div>

      {/* Recent readings table */}
      <div className="card">
        <div className="card-title"><Clock size={16}/> Recent Readings</div>
        <table className="data-table">
          <thead>
            <tr><th>Time</th><th>Temperature</th><th>Humidity</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recentHistory.map((r, i) => (
              <tr key={i}>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
                <td style={{color: r.temperature > device.temperatureThresholdC ? 'var(--status-critical)' : 'inherit'}}>{r.temperature}°C</td>
                <td style={{color: r.humidity    > device.humidityThresholdPercent ? 'var(--status-critical)' : 'inherit'}}>{r.humidity}%</td>
                <td><StatusBadge status={r.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
