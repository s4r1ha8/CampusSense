import { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Alert } from '../types/index.ts';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAlerts(48).then(setAlerts).catch(console.error).finally(() => setLoading(false));
    const t = setInterval(() => api.getAlerts(48).then(setAlerts).catch(console.error), 30_000);
    return () => clearInterval(t);
  }, []);

  const active   = alerts.filter(a => a.state === 'TRIGGERED' || a.state === 'SUSTAINED');
  const resolved = alerts.filter(a => a.state === 'RECOVERED');

  return (
    <div>
      <div className="page-header">
        <h2>Alerts</h2>
        <p>Threshold breach events for the past 48 hours</p>
      </div>

      {loading ? (
        <div className="state-placeholder"><div className="loading-spinner"/><p>Loading…</p></div>
      ) : (
        <>
          {/* Active alerts */}
          <div className="card" style={{marginBottom:20}}>
            <div className="card-title"><AlertTriangle size={16} color="var(--danger)"/> Active Alerts ({active.length})</div>
            {active.length === 0 ? (
              <div className="state-placeholder" style={{padding:'30px 0'}}>
                <CheckCircle2 size={32} color="var(--success)" style={{marginBottom:8}}/>
                <p>No active alerts — all readings are within thresholds.</p>
              </div>
            ) : (
              <table className="alert-table">
                <thead>
                  <tr><th>Device</th><th>Location</th><th>Metric</th><th>Reading</th><th>Threshold</th><th>State</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {active.map(a => (
                    <tr key={a.alertId}>
                      <td><strong>{a.deviceId}</strong></td>
                      <td>{a.locationName}<br/><span style={{fontSize:11,color:'var(--text-muted)'}}>{a.building}</span></td>
                      <td style={{textTransform:'capitalize'}}>{a.metric}</td>
                      <td className="alert-value">{a.value}{a.metric === 'temperature' ? '°C' : '%'}</td>
                      <td className="alert-threshold">{a.threshold}{a.metric === 'temperature' ? '°C' : '%'}</td>
                      <td><span className={`badge badge-${a.state.toLowerCase()}`}>{a.state}</span></td>
                      <td style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(a.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resolved alerts */}
          <div className="card">
            <div className="card-title"><Clock size={16}/> Resolved Alerts ({resolved.length})</div>
            {resolved.length === 0 ? (
              <p style={{color:'var(--text-muted)',fontSize:14}}>No resolved alerts in the past 48 hours.</p>
            ) : (
              <table className="alert-table">
                <thead>
                  <tr><th>Device</th><th>Location</th><th>Metric</th><th>Reading</th><th>Resolved</th></tr>
                </thead>
                <tbody>
                  {resolved.map(a => (
                    <tr key={a.alertId}>
                      <td><strong>{a.deviceId}</strong></td>
                      <td>{a.locationName}</td>
                      <td style={{textTransform:'capitalize'}}>{a.metric}</td>
                      <td>{a.value}{a.metric === 'temperature' ? '°C' : '%'}</td>
                      <td style={{fontSize:12,color:'var(--text-muted)'}}>{a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
