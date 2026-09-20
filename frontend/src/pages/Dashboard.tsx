import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { CurrentReading, DashboardSummary } from '../types/index.ts';
import { Thermometer, Droplets, MapPin, AlertTriangle, Wifi } from 'lucide-react';
import SensorCard from '../components/sensors/SensorCard.tsx';
import KpiCard    from '../components/dashboard/KpiCard.tsx';
import TempChart  from '../components/charts/TempChart.tsx';

interface Props { onViewDevice: (id: string) => void; }

export default function Dashboard({ onViewDevice }: Props) {
  const [readings, setReadings] = useState<CurrentReading[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getLatestReadings();
      setReadings(data);
      setError(null);
    } catch (e) {
      setError('Failed to load readings. Check console.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const summary: DashboardSummary = {
    totalLocations:  readings.length,
    onlineLocations: readings.filter(r => r.status !== 'OFFLINE').length,
    activeAlerts:    readings.filter(r => r.status === 'ALERT').length,
    avgTemperature:  readings.length ? Math.round(readings.reduce((s, r) => s + r.temperature, 0) / readings.length * 10) / 10 : 0,
    avgHumidity:     readings.length ? Math.round(readings.reduce((s, r) => s + r.humidity,    0) / readings.length * 10) / 10 : 0,
  };

  const alertReadings  = readings.filter(r => r.status === 'ALERT');
  const normalReadings = readings.filter(r => r.status === 'NORMAL').slice(0, 9);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Real-time overview of all 50 campus locations</p>
      </div>

      {loading && (
        <div className="state-placeholder">
          <div className="loading-spinner" />
          <p>Loading sensor data…</p>
        </div>
      )}

      {error && <div className="state-placeholder"><p style={{color:'var(--status-critical)'}}>⚠ {error}</p></div>}

      {!loading && !error && (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <KpiCard label="Total Locations" value={summary.totalLocations} icon={<MapPin size={16}/>} />
            <KpiCard label="Online"          value={summary.onlineLocations} icon={<Wifi size={16}/>} color="success"/>
            <KpiCard label="Active Alerts"   value={summary.activeAlerts}    icon={<AlertTriangle size={16}/>} color={summary.activeAlerts > 0 ? 'danger' : 'normal'} />
            <KpiCard label="Avg Temperature" value={`${summary.avgTemperature}°C`} icon={<Thermometer size={16}/>} />
            <KpiCard label="Avg Humidity"    value={`${summary.avgHumidity}%`}     icon={<Droplets size={16}/>} />
          </div>

          {/* Charts */}
          <div className="grid-2" style={{marginBottom:24}}>
            <div className="card">
              <div className="card-title"><Thermometer size={16}/> Temperature Distribution</div>
              <TempChart readings={readings} metric="temperature" />
            </div>
            <div className="card">
              <div className="card-title"><Droplets size={16}/> Humidity Distribution</div>
              <TempChart readings={readings} metric="humidity" />
            </div>
          </div>

          {/* Alerts */}
          {alertReadings.length > 0 && (
            <>
              <div className="card-title" style={{marginBottom:12}}>
                <AlertTriangle size={16} color="var(--status-critical)"/> Active Alerts
              </div>
              <div className="grid-3" style={{marginBottom:28}}>
                {alertReadings.map(r => (
                  <SensorCard key={r.deviceId} reading={r} onClick={() => onViewDevice(r.deviceId)} />
                ))}
              </div>
            </>
          )}

          {/* All sensors sample */}
          <div className="card-title" style={{marginBottom:12}}>Recent Readings</div>
          <div className="grid-3">
            {normalReadings.map(r => (
              <SensorCard key={r.deviceId} reading={r} onClick={() => onViewDevice(r.deviceId)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
