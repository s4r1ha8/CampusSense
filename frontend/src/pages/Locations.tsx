import { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Device, CurrentReading } from '../types/index.ts';
import SensorCard from '../components/sensors/SensorCard.tsx';
import { Search } from 'lucide-react';

interface Props { onSelectDevice: (id: string) => void; }

type TypeFilter   = 'ALL' | 'LABORATORY' | 'CLASSROOM' | 'SERVER_ROOM' | 'WORKSHOP';
type StatusFilter = 'ALL' | 'NORMAL' | 'ALERT' | 'OFFLINE';

export default function Locations({ onSelectDevice }: Props) {
  const [devices,  setDevices]  = useState<Device[]>([]);
  const [readings, setReadings] = useState<CurrentReading[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [typeF,    setTypeF]    = useState<TypeFilter>('ALL');
  const [statusF,  setStatusF]  = useState<StatusFilter>('ALL');

  useEffect(() => {
    Promise.all([api.getDevices(), api.getLatestReadings()])
      .then(([d, r]) => { setDevices(d); setReadings(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const readingMap = new Map(readings.map(r => [r.deviceId, r]));

  const filtered = devices.filter(d => {
    const r = readingMap.get(d.deviceId);
    const q = search.toLowerCase();
    if (q && !d.deviceId.toLowerCase().includes(q) && !d.locationName.toLowerCase().includes(q) && !d.building.toLowerCase().includes(q)) return false;
    if (typeF   !== 'ALL' && d.type !== typeF)            return false;
    if (statusF !== 'ALL' && r?.status !== statusF)       return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h2>Locations</h2>
        <p>{devices.length} campus sensors — search and filter below</p>
      </div>

      <div className="controls-bar">
        <div style={{position:'relative',flex:1,minWidth:220}}>
          <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
          <input
            className="search-input"
            style={{paddingLeft:34}}
            placeholder="Search by ID, location, or building…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={typeF}   onChange={e => setTypeF(e.target.value as TypeFilter)}>
          <option value="ALL">All Types</option>
          <option value="LABORATORY">Laboratory</option>
          <option value="CLASSROOM">Classroom</option>
          <option value="SERVER_ROOM">Server Room</option>
          <option value="WORKSHOP">Workshop</option>
        </select>
        <select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value as StatusFilter)}>
          <option value="ALL">All Status</option>
          <option value="NORMAL">Normal</option>
          <option value="ALERT">Alert</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {loading ? (
        <div className="state-placeholder"><div className="loading-spinner"/><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <div className="state-placeholder"><div className="icon">🔍</div><p>No locations match your filters.</p></div>
      ) : (
        <div className="grid-3">
          {filtered.map(d => {
            const r = readingMap.get(d.deviceId);
            if (!r) return null;
            return <SensorCard key={d.deviceId} reading={r} device={d} onClick={() => onSelectDevice(d.deviceId)} />;
          })}
        </div>
      )}
    </div>
  );
}
