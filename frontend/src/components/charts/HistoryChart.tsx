import { Line } from 'react-chartjs-2';
import { HistoryReading } from '../../types/index.ts';
import {
  Chart as ChartJS, LineElement, PointElement, CategoryScale,
  LinearScale, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface Props {
  readings:  HistoryReading[];
  metric:    'temperature' | 'humidity';
  threshold: number;
}

export default function HistoryChart({ readings, metric, threshold }: Props) {
  const MAX_POINTS = 48;
  const sampled    = readings.length > MAX_POINTS
    ? readings.filter((_, i) => i % Math.ceil(readings.length / MAX_POINTS) === 0)
    : readings;

  const labels = sampled.map(r => {
    const d = new Date(r.timestamp);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  });

  const values = sampled.map(r => metric === 'temperature' ? r.temperature : r.humidity);
  const unit   = metric === 'temperature' ? '°C' : '%';

  const lineColor = metric === 'temperature' ? '#0ea5e9' : '#10b981';
  const bgColor   = metric === 'temperature' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(16, 185, 129, 0.1)';

  const data = {
    labels,
    datasets: [
      {
        label:           `${metric === 'temperature' ? 'Temperature' : 'Humidity'} ${unit}`,
        data:            values,
        borderColor:     lineColor,
        backgroundColor: bgColor,
        fill:            true,
        tension:         0.35,
        pointRadius:     2,
        pointHoverRadius:5,
      },
      {
        label:       'Threshold',
        data:        sampled.map(() => threshold),
        borderColor: 'rgba(239,68,68,0.6)',
        borderDash:  [6, 4],
        pointRadius: 0,
        fill:        false,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: { legend: { labels: { color: '#64748b', font: { size: 12, family: "'Inter', sans-serif" } } } },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.35)' }, ticks: { color: '#64748b', maxTicksLimit: 12 } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.35)' }, ticks: { color: '#64748b' } },
    },
  };

  if (values.length === 0) {
    return <div style={{color:'var(--text-muted)',fontSize:13,padding:'20px 0'}}>No history data available.</div>;
  }

  return <Line data={data} options={options} />;
}
