/**
 * Mock API — generates realistic 50-device campus data for local development.
 * No AWS account or network required.
 *
 * One device (SRV-01) is always in ALERT state so the UI alert flow can be tested.
 */

import type { Device, CurrentReading, HistoryReading, Alert, SystemStats } from '../types/index.js';

// ─── Devices ────────────────────────────────────────────────────────────────

const RAW_DEVICES: Omit<Device, 'enabled'>[] = [
  { deviceId:'LAB-01', locationName:'Electronics Laboratory',   building:'Academic Block A', room:'Lab 01', type:'LABORATORY',  temperatureThresholdC:28, humidityThresholdPercent:60 },
  { deviceId:'LAB-02', locationName:'Chemistry Laboratory',     building:'Academic Block A', room:'Lab 02', type:'LABORATORY',  temperatureThresholdC:26, humidityThresholdPercent:65 },
  { deviceId:'LAB-03', locationName:'Physics Laboratory',       building:'Academic Block A', room:'Lab 03', type:'LABORATORY',  temperatureThresholdC:26, humidityThresholdPercent:60 },
  { deviceId:'LAB-04', locationName:'Computer Networks Lab',    building:'Academic Block B', room:'Lab 04', type:'LABORATORY',  temperatureThresholdC:25, humidityThresholdPercent:55 },
  { deviceId:'LAB-05', locationName:'Software Engineering Lab', building:'Academic Block B', room:'Lab 05', type:'LABORATORY',  temperatureThresholdC:25, humidityThresholdPercent:55 },
  { deviceId:'LAB-06', locationName:'AI/ML Laboratory',         building:'Academic Block B', room:'Lab 06', type:'LABORATORY',  temperatureThresholdC:24, humidityThresholdPercent:50 },
  { deviceId:'LAB-07', locationName:'IoT Innovation Lab',       building:'Academic Block B', room:'Lab 07', type:'LABORATORY',  temperatureThresholdC:25, humidityThresholdPercent:55 },
  { deviceId:'LAB-08', locationName:'Robotics Lab',             building:'Academic Block C', room:'Lab 08', type:'LABORATORY',  temperatureThresholdC:26, humidityThresholdPercent:60 },
  { deviceId:'LAB-09', locationName:'Embedded Systems Lab',     building:'Academic Block C', room:'Lab 09', type:'LABORATORY',  temperatureThresholdC:25, humidityThresholdPercent:55 },
  { deviceId:'LAB-10', locationName:'VLSI Design Lab',          building:'Academic Block C', room:'Lab 10', type:'LABORATORY',  temperatureThresholdC:24, humidityThresholdPercent:50 },
  { deviceId:'LAB-11', locationName:'Thermal Engineering Lab',  building:'Mechanical Block', room:'Lab 11', type:'LABORATORY',  temperatureThresholdC:35, humidityThresholdPercent:70 },
  { deviceId:'LAB-12', locationName:'Fluid Mechanics Lab',      building:'Mechanical Block', room:'Lab 12', type:'LABORATORY',  temperatureThresholdC:30, humidityThresholdPercent:80 },
  { deviceId:'LAB-13', locationName:'Material Testing Lab',     building:'Mechanical Block', room:'Lab 13', type:'LABORATORY',  temperatureThresholdC:32, humidityThresholdPercent:65 },
  { deviceId:'LAB-14', locationName:'Structural Analysis Lab',  building:'Civil Block',      room:'Lab 14', type:'LABORATORY',  temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'LAB-15', locationName:'Geotech Engineering Lab',  building:'Civil Block',      room:'Lab 15', type:'LABORATORY',  temperatureThresholdC:30, humidityThresholdPercent:75 },
  { deviceId:'CLS-01', locationName:'Classroom 101', building:'Academic Block A', room:'101', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-02', locationName:'Classroom 102', building:'Academic Block A', room:'102', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-03', locationName:'Classroom 103', building:'Academic Block A', room:'103', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-04', locationName:'Classroom 104', building:'Academic Block A', room:'104', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-05', locationName:'Classroom 105', building:'Academic Block A', room:'105', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-06', locationName:'Classroom 201', building:'Academic Block A', room:'201', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-07', locationName:'Classroom 202', building:'Academic Block A', room:'202', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-08', locationName:'Classroom 203', building:'Academic Block A', room:'203', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-09', locationName:'Classroom 204', building:'Academic Block A', room:'204', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-10', locationName:'Classroom 205', building:'Academic Block A', room:'205', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-11', locationName:'Classroom 301', building:'Academic Block B', room:'301', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-12', locationName:'Classroom 302', building:'Academic Block B', room:'302', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-13', locationName:'Classroom 303', building:'Academic Block B', room:'303', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-14', locationName:'Classroom 304', building:'Academic Block B', room:'304', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-15', locationName:'Classroom 305', building:'Academic Block B', room:'305', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-16', locationName:'Classroom 401', building:'Academic Block C', room:'401', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-17', locationName:'Classroom 402', building:'Academic Block C', room:'402', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-18', locationName:'Classroom 403', building:'Academic Block C', room:'403', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-19', locationName:'Classroom 404', building:'Academic Block C', room:'404', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'CLS-20', locationName:'Classroom 405', building:'Academic Block C', room:'405', type:'CLASSROOM', temperatureThresholdC:30, humidityThresholdPercent:70 },
  { deviceId:'SRV-01', locationName:'Main Server Room',       building:'Admin Block',      room:'Server Rm 1',  type:'SERVER_ROOM', temperatureThresholdC:22, humidityThresholdPercent:50 },
  { deviceId:'SRV-02', locationName:'Backup Data Center',     building:'Academic Block B', room:'Server Rm 2',  type:'SERVER_ROOM', temperatureThresholdC:22, humidityThresholdPercent:50 },
  { deviceId:'SRV-03', locationName:'Network Closet A',       building:'Academic Block A', room:'Net Closet A', type:'SERVER_ROOM', temperatureThresholdC:25, humidityThresholdPercent:55 },
  { deviceId:'SRV-04', locationName:'Network Closet C',       building:'Academic Block C', room:'Net Closet C', type:'SERVER_ROOM', temperatureThresholdC:25, humidityThresholdPercent:55 },
  { deviceId:'SRV-05', locationName:'Library Server Room',    building:'Central Library',  room:'Server Rm',    type:'SERVER_ROOM', temperatureThresholdC:24, humidityThresholdPercent:55 },
  { deviceId:'WS-01',  locationName:'Automotive Workshop',    building:'Workshop Complex', room:'Bay 1', type:'WORKSHOP', temperatureThresholdC:35, humidityThresholdPercent:80 },
  { deviceId:'WS-02',  locationName:'Machining Center',       building:'Workshop Complex', room:'Bay 2', type:'WORKSHOP', temperatureThresholdC:35, humidityThresholdPercent:80 },
  { deviceId:'WS-03',  locationName:'Welding Bay',            building:'Workshop Complex', room:'Bay 3', type:'WORKSHOP', temperatureThresholdC:40, humidityThresholdPercent:80 },
  { deviceId:'WS-04',  locationName:'Carpentry Shop',         building:'Workshop Complex', room:'Bay 4', type:'WORKSHOP', temperatureThresholdC:35, humidityThresholdPercent:75 },
  { deviceId:'WS-05',  locationName:'Electrical Wiring Shop', building:'Workshop Complex', room:'Bay 5', type:'WORKSHOP', temperatureThresholdC:32, humidityThresholdPercent:70 },
  { deviceId:'WS-06',  locationName:'3D Printing Lab',        building:'Innovation Center',room:'Maker 1', type:'WORKSHOP', temperatureThresholdC:28, humidityThresholdPercent:60 },
  { deviceId:'WS-07',  locationName:'PCB Fabrication',        building:'Innovation Center',room:'Maker 2', type:'WORKSHOP', temperatureThresholdC:28, humidityThresholdPercent:60 },
  { deviceId:'WS-08',  locationName:'Design Studio',          building:'Innovation Center',room:'Maker 3', type:'WORKSHOP', temperatureThresholdC:28, humidityThresholdPercent:60 },
  { deviceId:'WS-09',  locationName:'Civil Surveying Store',  building:'Civil Block',      room:'Store 1', type:'WORKSHOP', temperatureThresholdC:35, humidityThresholdPercent:80 },
  { deviceId:'WS-10',  locationName:'Project Assembly Area',  building:'Workshop Complex', room:'Bay 6', type:'WORKSHOP', temperatureThresholdC:32, humidityThresholdPercent:70 },
];

export const MOCK_DEVICES: Device[] = RAW_DEVICES.map(d => ({ ...d, enabled: true }));

// ─── Helpers ────────────────────────────────────────────────────────────────

function rnd(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

// ─── Current Readings ────────────────────────────────────────────────────────

let _cachedReadings: CurrentReading[] | null = null;
let _readingsGeneratedAt = 0;

export function mockGetLatestReadings(): CurrentReading[] {
  // Re-generate at most once per 10 seconds to simulate live updates
  if (_cachedReadings && Date.now() - _readingsGeneratedAt < 10_000) return _cachedReadings;

  _cachedReadings = MOCK_DEVICES.map(d => {
    // SRV-01 is always in ALERT state so the UI alert path can be tested
    const isAlert = d.deviceId === 'SRV-01';
    const temp = isAlert
      ? rnd(d.temperatureThresholdC + 2, d.temperatureThresholdC + 8)
      : rnd(d.temperatureThresholdC - 10, d.temperatureThresholdC - 2);

    const hum = rnd(d.humidityThresholdPercent - 20, d.humidityThresholdPercent - 5);

    return {
      deviceId:   d.deviceId,
      temperature: temp,
      humidity:    hum,
      status:      (isAlert ? 'ALERT' : 'NORMAL') as CurrentReading['status'],
      lastSeenAt:  new Date().toISOString(),
    };
  });

  _readingsGeneratedAt = Date.now();
  return _cachedReadings;
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export function mockGetDevices(): Device[] { return MOCK_DEVICES; }

// ─── History ──────────────────────────────────────────────────────────────────

export function mockGetHistory(deviceId: string, hours: number): HistoryReading[] {
  const device = MOCK_DEVICES.find(d => d.deviceId === deviceId);
  if (!device) return [];

  const readings: HistoryReading[] = [];
  const now = Date.now();
  const intervalMs = 10 * 60 * 1000; // 10 minutes

  let temp = rnd(device.temperatureThresholdC - 8, device.temperatureThresholdC - 2);
  let hum  = rnd(device.humidityThresholdPercent - 15, device.humidityThresholdPercent - 5);

  for (let ms = hours * 60 * 60 * 1000; ms >= 0; ms -= intervalMs) {
    temp = Math.round(Math.min(Math.max(temp + (Math.random() - 0.5) * 1.5, 15), 45) * 10) / 10;
    hum  = Math.round(Math.min(Math.max(hum  + (Math.random() - 0.5) * 3.0, 20), 95) * 10) / 10;

    readings.push({
      deviceId:    deviceId,
      timestamp:   new Date(now - ms).toISOString(),
      temperature: temp,
      humidity:    hum,
      status:      temp > device.temperatureThresholdC ? 'ALERT' : 'NORMAL',
    });
  }

  return readings;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function mockGetAlerts(): Alert[] {
  return [
    {
      alertId:     'alert-mock-001',
      deviceId:    'SRV-01',
      locationName:'Main Server Room',
      building:    'Admin Block',
      metric:      'temperature',
      value:       27.3,
      threshold:   22,
      state:       'TRIGGERED',
      timestamp:   new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    {
      alertId:     'alert-mock-002',
      deviceId:    'LAB-06',
      locationName:'AI/ML Laboratory',
      building:    'Academic Block B',
      metric:      'temperature',
      value:       26.1,
      threshold:   24,
      state:       'RECOVERED',
      timestamp:   new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      resolvedAt:  new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ];
}

// ─── System Stats ─────────────────────────────────────────────────────────────

export function mockGetSystemStats(): SystemStats {
  return {
    metricId:          'GLOBAL',
    totalMessages:     2160,
    validMessages:     2154,
    invalidMessages:   6,
    processedMessages: 2154,
    alertsGenerated:   3,
    recoveries:        2,
    processingErrors:  6,
    lastProcessedAt:   new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastErrorAt:       new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    lastErrorMessage:  'OUT_OF_RANGE_TEMPERATURE for device WS-03',
  };
}
