import { simulationService } from '../services/simulation.service';
import type { SimulationState } from '../services/simulation.service';
import { useObservable } from '../hooks/useObservable';
import { formatNumber } from '../lib/format';

const networks = [
  { target: 'tcp://broker.emqx.io:1883 (Main Broker)', latency: '24.4 ms', jitter: '2.2 ms', loss: '0.0%', status: 'Excellent', statusClass: 'pill-online' },
  { target: 'tcp://10.0.5.21:1883 (Edge Node A)', latency: '1.1 ms', jitter: '0.5 ms', loss: '0.0%', status: 'Good', statusClass: 'pill-online' },
  { target: 'tcp://10.0.5.22:1883 (Edge Node B)', latency: '---', jitter: '---', loss: '100%', status: 'Unreachable', statusClass: 'pill-offline' },
  { target: 'AWS IoT Core (us-east-1)', latency: '42.8 ms', jitter: '5.2 ms', loss: '0.0%', status: 'Good', statusClass: 'pill-online' },
];

const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

const statCard = { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } as const;

export default function Diagnostics() {
  const simState = useObservable<SimulationState | null>(simulationService.state$, null);

  return (
    <section className="page">
      <div className="page-header">
        <h1>Telegraf Agent Diagnostics</h1>
        <div className="page-sub">Host health, memory utilization, and real-time MQTT broker latency collected by Telegraf.</div>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
        <div className="card stat" style={statCard}>
          <div className="stat-label">Telegraf CPU</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(simState?.cpuUsage, '1.1-1')}%</div>
          <div className="stat-note">Daemon Process</div>
        </div>
        <div className="card stat" style={statCard}>
          <div className="stat-label">Telegraf Memory</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(simState?.memUsage, '1.0-0')} MB</div>
          <div className="stat-note">RSS Usage</div>
        </div>
        <div className="card stat" style={statCard}>
          <div className="stat-label">Agent Uptime</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 20 }}>{simState ? formatUptime(simState.uptimeSeconds) : '...'}</div>
          <div className="stat-note">Since last restart</div>
        </div>
        <div className="card stat" style={statCard}>
          <div className="stat-label">Buffer Size</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', color: simState && simState.bufferSize > 5000 ? 'var(--amber)' : undefined }}>{simState?.bufferSize} / 10000</div>
          <div className="stat-note">Pending MQTT Metrics</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, background: 'var(--bg-0)', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'var(--bg-2)', padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, borderBottom: '1px solid var(--border-strong)' }}>Live Telegraf stdout</div>
        <div style={{ padding: 12, height: 200, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#a5d6ff', lineHeight: 1.5 }}>
          {simState?.mockLogs.map((log, i) => (
            <div key={i} style={{ marginBottom: 4 }}>{log}</div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="row-between">
          <h3 style={{ fontSize: 14, marginBottom: 0 }}>MQTT Broker Latency (Ping)</h3>
          <button className="btn btn-sm">Run Ping Plugin</button>
        </div>
        <table>
          <thead><tr><th>Target Endpoint</th><th>Avg Latency</th><th>Jitter</th><th>Packet Loss</th><th>Status</th></tr></thead>
          <tbody>
            {networks.map((net) => (
              <tr key={net.target}>
                <td>{net.target}</td>
                <td className="mono" style={{ color: net.latency === '---' ? 'var(--text-3)' : undefined }}>{net.latency}</td>
                <td className="mono" style={{ color: net.jitter === '---' ? 'var(--text-3)' : undefined }}>{net.jitter}</td>
                <td className="mono" style={{ color: net.loss === '100%' ? 'var(--red)' : undefined }}>{net.loss}</td>
                <td><span className={`pill ${net.statusClass}`}><span className="dot"></span>{net.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
