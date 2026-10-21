import { useEffect, useRef, useState } from 'react';
import './RealtimeAnalysis.css';
import type { MotorTelemetry } from '../services/mqtt-mock.service';
import { signalrService } from '../services/signalr.service';
import { mqttClientService } from '../services/mqtt-client.service';
import type { MqttMessage } from '../services/mqtt-client.service';
import { formatNumber } from '../lib/format';

interface Metrics {
  voltage: number;
  current: number;
  activePower: number;
  powerFactor: number;
  frequency: number;
  totalKwh: number;
  activeKw: number;
  kvar: number;
  kva: number;
  rpm: number;
  rpmDelta: number;
  peakRpm: number;
  readings: number;
  rms: number;
  velocity: number;
  velDelta: number;
  acceleration: number;
  displacement: number;
  domFreq: number;
  axisX: number;
}

interface Paths {
  pathPower: string;
  pathRpm: string;
  pathRms: string;
  pathTrendPower: string;
  pathTrendRpm: string;
  pathTrendVib: string;
}

interface History {
  powerHistory: number[];
  rpmHistory: number[];
  rmsHistory: number[];
  trendPower: number[];
  trendRpm: number[];
  trendVib: number[];
}

const initialMetrics: Metrics = {
  voltage: 230.7,
  current: 7.34,
  activePower: 4.31,
  powerFactor: 0.894,
  frequency: 49.91,
  totalKwh: 62289.0,
  activeKw: 4.312,
  kvar: 0.632,
  kva: 4.821,
  rpm: 1218,
  rpmDelta: 2.8,
  peakRpm: 1245,
  readings: 84920,
  rms: 0.93,
  velocity: 1.395,
  velDelta: 0.095,
  acceleration: 0.0972,
  displacement: 11.9,
  domFreq: 67.8,
  axisX: 25,
};

const filled = (n: number, v: number) => Array.from({ length: n }, () => v);

const generatePath = (data: number[], width: number, height: number, min: number, max: number): string => {
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const points = data.map((val, i) => {
    const x = i * stepX;
    const clamped = Math.max(min, Math.min(max, val));
    const y = height - ((clamped - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${points.join(' L ')}`;
};

const computePaths = (h: History): Paths => ({
  pathPower: generatePath(h.powerHistory, 100, 40, 4.0, 4.6),
  pathRpm: generatePath(h.rpmHistory, 100, 40, 1200, 1240),
  pathRms: generatePath(h.rmsHistory, 100, 40, 0.8, 1.1),
  pathTrendPower: generatePath(h.trendPower, 1000, 250, 4.0, 4.6),
  // Norm ranges to fit together in 1 chart visually
  pathTrendRpm: generatePath(h.trendRpm, 1000, 250, 1100, 1300),
  pathTrendVib: generatePath(h.trendVib, 1000, 250, 0, 3),
});

const initialHistory = (): History => ({
  powerHistory: filled(100, 4.31),
  rpmHistory: filled(100, 1218),
  rmsHistory: filled(100, 0.93),
  trendPower: filled(200, 4.31),
  trendRpm: filled(200, 1218),
  trendVib: filled(200, 0.93),
});

const pushData = (arr: number[], val: number): number[] => [...arr.slice(1), val];

const getDashOffset = (val: number, min: number, max: number): number => {
  const p = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return 157.08 * (1 - p);
};

const isMotorTopic = (topic: string) => topic.startsWith('factory/motor/') && topic.endsWith('/data');

export default function RealtimeAnalysis() {
  const metricsRef = useRef<Metrics>(initialMetrics);
  const historyRef = useRef<History>(initialHistory());
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [paths, setPaths] = useState<Paths>(() => computePaths(historyRef.current));

  useEffect(() => {
    const processTelemetry = (telemetry: MotorTelemetry) => {
      const fields = telemetry.fields;
      const prev = metricsRef.current;

      const rpm = fields.rpm;
      const rms = fields.vibration_x_rms;
      const velocity = fields.vibration_velocity;

      const next: Metrics = {
        voltage: fields.voltage_l_n,
        current: fields.current,
        activePower: fields.active_power,
        activeKw: fields.active_power,
        powerFactor: fields.power_factor,
        frequency: fields.frequency,
        totalKwh: fields.total_kwh,
        kvar: fields.kvar,
        kva: fields.kva,
        rpmDelta: rpm - prev.rpm,
        rpm,
        peakRpm: rpm > prev.peakRpm ? rpm : prev.peakRpm,
        readings: fields.readings_count,
        rms,
        velDelta: velocity - prev.velocity,
        velocity,
        acceleration: fields.vibration_acceleration,
        displacement: fields.vibration_displacement,
        domFreq: fields.dom_freq,
        // Animate the X axis bar based on rms relative to a theoretical max (e.g., 5.0)
        axisX: Math.min(100, (rms / 5.0) * 100),
      };
      metricsRef.current = next;

      const h = historyRef.current;
      const nextHistory: History = {
        powerHistory: pushData(h.powerHistory, next.activePower),
        rpmHistory: pushData(h.rpmHistory, next.rpm),
        rmsHistory: pushData(h.rmsHistory, next.rms),
        trendPower: pushData(h.trendPower, next.activePower),
        trendRpm: pushData(h.trendRpm, next.rpm),
        trendVib: pushData(h.trendVib, next.rms),
      };
      historyRef.current = nextHistory;

      setMetrics(next);
      setPaths(computePaths(nextHistory));
    };

    // Subscribe to Backend's built-in broker (via Socket.IO)
    const sub1 = signalrService.telemetry$.subscribe((msg) => {
      if (isMotorTopic(msg.topic)) {
        processTelemetry(msg.payload as MotorTelemetry);
      }
    });

    // Subscribe to any External Brokers configured in Connection Manager
    if (mqttClientService.isConnected()) {
      mqttClientService.subscribe('factory/motor/+/data');
    }
    const sub2 = mqttClientService.messages$.subscribe((msg: MqttMessage) => {
      if (isMotorTopic(msg.topic)) {
        processTelemetry(msg.payload as MotorTelemetry);
      }
    });

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }, []);

  const {
    voltage, current, activePower, powerFactor, frequency, totalKwh, activeKw, kvar, kva,
    rpm, rpmDelta, peakRpm, readings, rms, velocity, velDelta, acceleration, displacement, domFreq, axisX,
  } = metrics;
  const { pathPower, pathRpm, pathRms, pathTrendPower, pathTrendRpm, pathTrendVib } = paths;

  return (
    <div className="mcm-dashboard realtime-page">
      {/* Top Header */}
      <div className="mcm-header">
        <div className="mcm-header-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          Motor Condition Monitoring
        </div>
        <div className="mcm-header-center">
          <div className="mcm-motor-select">
            <span>Active Motor</span>
            <select>
              <option>Motor 2 — Cooling Fan Motor</option>
            </select>
          </div>
        </div>
        <div className="mcm-header-right">
          <div style={{ display: 'flex', gap: 4 }}>
            <div className="mcm-live-dot" style={{ animation: 'rt-pulse 1s infinite alternate' }}></div>
            <div className="mcm-live-dot" style={{ animation: 'rt-pulse 1s infinite alternate 0.33s' }}></div>
            <div className="mcm-live-dot" style={{ animation: 'rt-pulse 1s infinite alternate 0.66s' }}></div>
          </div>
          <div className="mcm-live-badge"><div className="mcm-live-dot" style={{ background: '#ff3b30' }}></div>Live</div>
          <div>14:22:37</div>
        </div>
      </div>

      {/* Subheader */}
      <div className="mcm-subheader">
        <span style={{ fontWeight: 700, color: '#111' }}>Cooling Fan Motor</span>
        <span style={{ color: '#aaa', margin: '0 8px' }}>·</span>
        HVAC Unit B2
        <span style={{ color: '#aaa', margin: '0 8px' }}>·</span>
        4-pole, 3-ph 415 V (L-L), 5.5 kW
      </div>

      <div className="mcm-content">
        {/* 3 Cards Grid */}
        <div className="mcm-grid-3">

          {/* Energy Meter */}
          <div className="mcm-card">
            <div className="mcm-card-header">
              <div className="mcm-card-title">
                <div className="mcm-card-icon" style={{ background: '#2563eb' }}></div>
                ENERGY METER
              </div>
              <div className="mcm-badge-connected">Connected</div>
            </div>

            <div className="mcm-metric-row">
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">VOLTAGE L-N</div>
                <div className="mcm-metric-value mcm-number-animate">{formatNumber(voltage, '1.1-1')}</div>
              </div>
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">CURRENT</div>
                <div className="mcm-metric-value mcm-number-animate">{formatNumber(current, '1.2-2')}</div>
              </div>
            </div>

            <div className="mcm-gauge-container">
              <svg width="120" height="70" viewBox="0 0 120 70">
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#a7f3d0" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="157.1" strokeDashoffset={getDashOffset(activePower, 0, 10)}
                  style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </svg>
              <div className="mcm-gauge-text" style={{ top: 45 }}>
                <div className="mcm-gauge-val mcm-number-animate">{formatNumber(activePower, '1.2-2')}</div>
                <div className="mcm-gauge-unit">kW</div>
                <div className="mcm-gauge-label">ACTIVE POWER</div>
              </div>
            </div>

            <div className="mcm-subgrid">
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">POWER FACTOR</div>
                <div className="mcm-metric-value">{formatNumber(powerFactor, '1.3-3')}</div>
              </div>
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">FREQUENCY</div>
                <div className="mcm-metric-value">{formatNumber(frequency, '1.2-2')}</div>
              </div>
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">TOTAL KWH</div>
                <div className="mcm-metric-value">{formatNumber(totalKwh, '1.1-1')}</div>
              </div>
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">ACTIVE KW</div>
                <div className="mcm-metric-value mcm-number-animate">{formatNumber(activeKw, '1.3-3')}</div>
              </div>
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">KVAR</div>
                <div className="mcm-metric-value">{formatNumber(kvar, '1.3-3')}</div>
              </div>
              <div className="mcm-metric-box">
                <div className="mcm-metric-label">KVA</div>
                <div className="mcm-metric-value">{formatNumber(kva, '1.3-3')}</div>
              </div>
            </div>

            <div className="mcm-chart-title">ACTIVE POWER — KW</div>
            <div className="mcm-sparkline">
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d={pathPower} fill="none" stroke="#3b82f6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ transition: 'd 0.5s linear' }} />
              </svg>
            </div>
          </div>

          {/* Tachometer */}
          <div className="mcm-card">
            <div className="mcm-card-header">
              <div className="mcm-card-title">
                <div className="mcm-card-icon" style={{ background: '#f97316' }}></div>
                TACHOMETER
              </div>
              <div className="mcm-badge-connected">Connected</div>
            </div>

            <div style={{ textAlign: 'center', margin: '24px 0 16px' }}>
              <div style={{ fontSize: 42, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#111', lineHeight: 1 }} className="mcm-number-animate">
                {formatNumber(rpm, '1.1-1')}<span style={{ fontSize: 16, fontFamily: "'Inter'", color: '#6b7280', fontWeight: 600 }}>rpm</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: rpmDelta >= 0 ? '#22c55e' : '#ef4444' }} className="mcm-number-animate">
                {rpmDelta > 0 ? '+' : ''}{formatNumber(rpmDelta, '1.1-1')}
              </div>
            </div>

            <div className="mcm-gauge-container" style={{ marginBottom: 32 }}>
              <svg width="120" height="70" viewBox="0 0 120 70">
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="157.1" strokeDashoffset={getDashOffset(rpm, 0, 2000)}
                  style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </svg>
              <div className="mcm-gauge-text" style={{ top: 45 }}>
                <div className="mcm-gauge-val mcm-number-animate" style={{ fontSize: 18 }}>{formatNumber(rpm, '1.0-0')}</div>
                <div className="mcm-gauge-unit" style={{ fontSize: 8 }}>rpm</div>
                <div className="mcm-gauge-label">RPM</div>
              </div>
            </div>

            <div className="mcm-metric-row" style={{ marginBottom: 32 }}>
              <div className="mcm-metric-box" style={{ background: 'transparent', boxShadow: 'none' }}>
                <div className="mcm-metric-label">PEAK RPM</div>
                <div className="mcm-metric-value mcm-number-animate" style={{ fontSize: 14 }}>{peakRpm}</div>
              </div>
              <div className="mcm-metric-box" style={{ background: 'transparent', boxShadow: 'none' }}>
                <div className="mcm-metric-label">READINGS</div>
                <div className="mcm-metric-value mcm-number-animate" style={{ fontSize: 14 }}>{formatNumber(readings, '1.0-0')}</div>
              </div>
            </div>

            <div className="mcm-chart-title">RPM — HISTORY</div>
            <div className="mcm-sparkline">
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d={pathRpm} fill="none" stroke="#f97316" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ transition: 'd 0.5s linear' }} />
              </svg>
            </div>
          </div>

          {/* Vibration Sensor */}
          <div className="mcm-card">
            <div className="mcm-card-header">
              <div className="mcm-card-title">
                <div className="mcm-card-icon" style={{ background: '#ef4444' }}></div>
                VIBRATION SENSOR
              </div>
              <div className="mcm-badge-connected">Connected</div>
            </div>

            <div className="mcm-gauge-container" style={{ marginTop: 12, marginBottom: 12 }}>
              <svg width="120" height="70" viewBox="0 0 120 70">
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#a7f3d0" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="157.1" strokeDashoffset={getDashOffset(rms, 0, 5)}
                  style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </svg>
              <div className="mcm-gauge-text" style={{ top: 45 }}>
                <div className="mcm-gauge-val mcm-number-animate" style={{ fontSize: 18 }}>{formatNumber(rms, '1.2-2')}</div>
                <div className="mcm-gauge-unit" style={{ fontSize: 8 }}>mm/s</div>
                <div className="mcm-gauge-label">RMS</div>
              </div>
            </div>

            <div className="mcm-subgrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="mcm-metric-box" style={{ background: 'transparent', border: 'none', padding: 4, boxShadow: 'none' }}>
                <div className="mcm-metric-label">VELOCITY (PK)</div>
                <div className="mcm-metric-value mcm-number-animate" style={{ fontSize: 14 }}>
                  {formatNumber(velocity, '1.3-3')}
                  <span style={{ fontSize: 10, marginLeft: 4, color: velDelta >= 0 ? '#22c55e' : '#ef4444' }}>
                    {velDelta > 0 ? '+' : ''}{formatNumber(velDelta, '1.3-3')}
                  </span>
                </div>
              </div>
              <div className="mcm-metric-box" style={{ background: 'transparent', border: 'none', padding: 4, boxShadow: 'none' }}>
                <div className="mcm-metric-label">ACCELERATION</div>
                <div className="mcm-metric-value mcm-number-animate" style={{ fontSize: 14 }}>{formatNumber(acceleration, '1.4-4')}</div>
              </div>
              <div className="mcm-metric-box" style={{ background: 'transparent', border: 'none', padding: 4, boxShadow: 'none' }}>
                <div className="mcm-metric-label">DISPLACEMENT</div>
                <div className="mcm-metric-value mcm-number-animate" style={{ fontSize: 14 }}>{formatNumber(displacement, '1.2-2')}</div>
              </div>
              <div className="mcm-metric-box" style={{ background: 'transparent', border: 'none', padding: 4, boxShadow: 'none' }}>
                <div className="mcm-metric-label">DOM. FREQ</div>
                <div className="mcm-metric-value mcm-number-animate" style={{ fontSize: 14 }}>{formatNumber(domFreq, '1.2-2')}</div>
              </div>
            </div>

            <div className="mcm-chart-title">PER-AXIS (MM/S)</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 700, color: '#666' }}>
                <span>X</span>
                <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#22c55e', borderRadius: 4, transition: 'width 0.5s ease', width: `${axisX}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mcm-chart-title">RMS TREND</div>
            <div className="mcm-sparkline">
              <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path d={pathRms} fill="none" stroke="#ef4444" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ transition: 'd 0.5s linear' }} />
              </svg>
            </div>
          </div>
        </div>

        {/* Combined Trend Card */}
        <div className="mcm-card">
          <div className="mcm-card-header">
            <div className="mcm-card-title">COMBINED TREND (NORMALISED)</div>
            <div className="mcm-trend-legend">
              <div className="mcm-legend-item"><div className="mcm-legend-dot" style={{ background: '#3b82f6' }}></div> Power</div>
              <div className="mcm-legend-item"><div className="mcm-legend-dot" style={{ background: '#f97316' }}></div> RPM</div>
              <div className="mcm-legend-item"><div className="mcm-legend-dot" style={{ background: '#ef4444' }}></div> Vibration</div>
            </div>
          </div>
          <div className="mcm-combined-chart">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 250">
              <path d={pathTrendPower} fill="none" stroke="#3b82f6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ transition: 'd 0.5s linear' }} />
              <path d={pathTrendRpm} fill="none" stroke="#f97316" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ transition: 'd 0.5s linear' }} />
              <path d={pathTrendVib} fill="none" stroke="#ef4444" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ transition: 'd 0.5s linear' }} />
            </svg>
          </div>
        </div>

        {/* Historical Data Card */}
        <div className="mcm-card">
          <div className="mcm-card-header">
            <div className="mcm-card-title">HISTORICAL DATA — SQL DATABASE</div>
            <div className="mcm-hist-controls">
              <input type="date" className="mcm-input" defaultValue="2026-07-07" />
              <span>to</span>
              <input type="date" className="mcm-input" defaultValue="2026-07-14" />
              <select className="mcm-input"><option>Hourly</option><option>Daily</option></select>
              <button className="mcm-btn">Load</button>
            </div>
          </div>

          <div className="mcm-chart-title">ACTIVE POWER (kW)</div>
          <div style={{ width: '100%', height: 250, backgroundImage: 'linear-gradient(#f9fafb 1px, transparent 1px)', backgroundSize: '100% 50px', marginBottom: 16 }}>
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 250">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,50 Q250,200 500,200 T1000,180 L1000,250 L0,250 Z" fill="url(#areaGrad)" />
              <path d="M0,50 Q250,200 500,200 T1000,180" fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          <div className="mcm-footer">
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="mcm-legend-item"><div className="mcm-legend-dot" style={{ background: '#22c55e' }}></div> EM2M: ok</div>
              <div className="mcm-legend-item"><div className="mcm-legend-dot" style={{ background: '#22c55e' }}></div> Tacho: ok</div>
              <div className="mcm-legend-item"><div className="mcm-legend-dot" style={{ background: '#22c55e' }}></div> Vibration: ok</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 400 }}>Updated 14:22:37 pm</span>
              <button style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
