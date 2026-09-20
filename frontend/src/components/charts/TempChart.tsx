import { Bar } from 'react-chartjs-2';
import { CurrentReading } from '../../types/index.ts';
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Props {
  readings: CurrentReading[];
  metric:   'temperature' | 'humidity';
}

export default function TempChart({ readings, metric }: Props) {
  // Group readings into buckets for a distribution histogram
  const values = readings.map(r => metric === 'temperature' ? r.temperature : r.humidity);

  const min = Math.floor(Math.min(...values));
  const max = Math.ceil( Math.max(...values));
  const bucketCount = 10;
  const bucketSize  = Math.max(1, Math.ceil((max - min + 1) / bucketCount));

  const buckets: number[] = new Array(bucketCount).fill(0);
  const labels: string[]  = [];

  for (let i = 0; i < bucketCount; i++) {
    const lo = min + i * bucketSize;
    const hi = lo + bucketSize - 1;
    labels.push(`${lo}${metric === 'temperature' ? '°' : '%'}`);
    for (const v of values) {
      if (v >= lo && v <= hi) buckets[i]++;
    }
  }

  const alertColor = 'rgba(239,68,68,0.7)';
  const normColor  = metric === 'temperature' ? 'rgba(99,102,241,0.7)' : 'rgba(59,130,246,0.7)';

  const data = {
    labels,
    datasets: [{
      label:           metric === 'temperature' ? 'Sensor count' : 'Sensor count',
      data:            buckets,
      backgroundColor: normColor,
      borderRadius:    4,
    }],
  };

  const options = {
    responsive: true,
    plugins:    { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => ` ${c.raw} sensors` } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892a4' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892a4', precision: 0 } },
    },
  };

  return <Bar data={data} options={options} />;
}
