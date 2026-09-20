import { useState } from 'react';
import { LayoutDashboard, MapPin, Bell, Activity, Thermometer } from 'lucide-react';
import Dashboard      from './pages/Dashboard.tsx';
import Locations      from './pages/Locations.tsx';
import LocationDetail from './pages/LocationDetail.tsx';
import Alerts         from './pages/Alerts.tsx';
import SystemMonitor  from './pages/SystemMonitor.tsx';

const useMock = import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_BASE_URL;

type Page = 'dashboard' | 'locations' | 'alerts' | 'system';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'locations', label: 'Locations',      icon: MapPin },
  { id: 'alerts',    label: 'Alerts',         icon: Bell },
  { id: 'system',    label: 'System Monitor', icon: Activity },
] as const;

export default function App() {
  const [page, setPage]       = useState<Page>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function navigate(p: Page) {
    setPage(p);
    setSelectedId(null);
  }

  function viewDevice(id: string) {
    setSelectedId(id);
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-info">
            <h1>CampusSense</h1>
            <p>VIT Chennai Monitor</p>
          </div>
          <Thermometer size={20} color="var(--on-surface-variant)" />
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => navigate(id as Page)}
            >
              <Icon size={18} />
              {label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {useMock ? (
            <div className="mode-indicator mode-demo">
              <div className="pulse-dot" style={{ background: 'var(--status-warning)', boxShadow: '0 0 8px rgba(245, 158, 11, 0.45)' }}></div>
              LOCAL DEMO MODE
            </div>
          ) : (
            <div className="mode-indicator mode-live">
              <div className="pulse-dot"></div>
              AWS LIVE CONNECTED
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {page === 'dashboard' && (
          <Dashboard onViewDevice={(id) => { viewDevice(id); setPage('locations'); }} />
        )}
        {page === 'locations' && !selectedId && (
          <Locations onSelectDevice={viewDevice} />
        )}
        {page === 'locations' && selectedId && (
          <LocationDetail deviceId={selectedId} onBack={() => setSelectedId(null)} />
        )}
        {page === 'alerts' && <Alerts />}
        {page === 'system' && <SystemMonitor />}
      </main>
    </div>
  );
}
