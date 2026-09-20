import {
  Device,
  CurrentReading,
  HistoryReading,
  Alert,
  SystemStats,
  ApiResponse,
} from '../types/index.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !BASE_URL;

// ─── HTTP helper ───────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success || body.data === undefined) throw new Error(body.error?.message ?? 'Unknown error');
  return body.data;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.success || body.data === undefined) throw new Error(body.error?.message ?? 'Unknown error');
  return body.data;
}

// ─── Mock import (only loaded in mock mode) ────────────────────────────────

let mock: typeof import('./mock-api.js') | null = null;
async function getMock() {
  if (!mock) mock = await import('./mock-api.js');
  return mock;
}

// ─── Public API ────────────────────────────────────────────────────────────

export const api = {
  getDevices: async (): Promise<Device[]> => {
    if (USE_MOCK) return (await getMock()).mockGetDevices();
    return get<Device[]>('/api/v1/devices');
  },

  getLatestReadings: async (): Promise<CurrentReading[]> => {
    if (USE_MOCK) return (await getMock()).mockGetLatestReadings();
    return get<CurrentReading[]>('/api/v1/readings/latest');
  },

  getHistory: async (deviceId: string, hours = 24): Promise<HistoryReading[]> => {
    if (USE_MOCK) return (await getMock()).mockGetHistory(deviceId, hours);
    return get<HistoryReading[]>(`/api/v1/readings/history?deviceId=${deviceId}&hours=${hours}`);
  },

  getAlerts: async (hours = 48): Promise<Alert[]> => {
    if (USE_MOCK) return (await getMock()).mockGetAlerts();
    const alerts = await get<Alert[]>(`/api/v1/alerts?hours=${hours}`);
    // Strip DynamoDB internal fields from response
    return alerts.map(({ campusId, sk, ...rest }: any) => rest as Alert);
  },

  getSystemStats: async (): Promise<SystemStats> => {
    if (USE_MOCK) return (await getMock()).mockGetSystemStats();
    return get<SystemStats>('/api/v1/system');
  },

  postTelemetry: async (payload: unknown): Promise<unknown> => {
    return post('/api/v1/telemetry', payload);
  },
};
