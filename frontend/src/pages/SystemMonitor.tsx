import { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { SystemStats } from '../types/index.ts';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';

export default function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSystemStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    const t = setInterval(() => api.getSystemStats().then(setStats).catch(console.error), 30_000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="state-placeholder"><div className="loading-spinner"/><p>Loading…</p></div>;
  if (!stats)  return <div className="state-placeholder"><p>No statistics available.</p></div>;

  const errorRate = stats.totalMessages > 0
    ? ((stats.invalidMessages / stats.totalMessages) * 100).toFixed(1)
    : '0';

  return (
    <div>
      <div className="page-header">
        <h2>System Monitor</h2>
        <p>Pipeline health and processing statistics</p>
      </div>

      {/* Status indicator */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-title"><Activity size={16}/> Pipeline Status</div>
        <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <CheckCircle2 size={18} color="var(--success)"/>
            <span style={{fontSize:14}}>IoT Processor Lambda — <strong style={{color:'var(--success)'}}>Operational</strong></span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <CheckCircle2 size={18} color="var(--success)"/>
            <span style={{fontSize:14}}>API Lambda — <strong style={{color:'var(--success)'}}>Operational</strong></span>
          </div>
        </div>
        <div style={{marginTop:12,fontSize:12,color:'var(--text-muted)'}}>
          Last processed: {stats.lastProcessedAt ? new Date(stats.lastProcessedAt).toLocaleString() : 'No data'}
        </div>
      </div>

      {/* Message counters */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-title">Message Processing</div>
        <div className="stats-grid">
          <div className="stat-item"><div className="stat-label">Total Messages</div><div className="stat-value">{stats.totalMessages.toLocaleString()}</div></div>
          <div className="stat-item"><div className="stat-label">Valid</div><div className="stat-value success-text">{stats.validMessages.toLocaleString()}</div></div>
          <div className="stat-item"><div className="stat-label">Invalid</div><div className="stat-value error-text">{stats.invalidMessages.toLocaleString()}</div></div>
          <div className="stat-item"><div className="stat-label">Processed</div><div className="stat-value">{stats.processedMessages.toLocaleString()}</div></div>
          <div className="stat-item"><div className="stat-label">Error Rate</div><div className="stat-value">{errorRate}%</div></div>
        </div>
      </div>

      {/* Alert counters */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-title">Alert Activity</div>
        <div className="stats-grid">
          <div className="stat-item"><div className="stat-label">Alerts Generated</div><div className="stat-value error-text">{stats.alertsGenerated}</div></div>
          <div className="stat-item"><div className="stat-label">Recoveries</div><div className="stat-value success-text">{stats.recoveries}</div></div>
          <div className="stat-item"><div className="stat-label">Processing Errors</div><div className="stat-value error-text">{stats.processingErrors}</div></div>
        </div>
      </div>

      {/* Last error */}
      {stats.lastErrorMessage && (
        <div className="card">
          <div className="card-title"><XCircle size={16} color="var(--danger)"/> Last Error</div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:6}}>{stats.lastErrorAt ? new Date(stats.lastErrorAt).toLocaleString() : '—'}</div>
          <div style={{fontFamily:'monospace',fontSize:13,background:'var(--bg-card-2)',padding:'10px 14px',borderRadius:6,color:'var(--danger)'}}>{stats.lastErrorMessage}</div>
        </div>
      )}
    </div>
  );
}
