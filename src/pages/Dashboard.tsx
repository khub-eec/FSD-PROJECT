import { deviceService } from '../services/device.service';
import { tagService } from '../services/tag.service';
import { ruleService } from '../services/rule.service';
import { alertService } from '../services/alert.service';
import { mqttMockService, type MqttBrokerStats } from '../services/mqtt-mock.service';
import { simulationService, type SimulationState } from '../services/simulation.service';
import { useObservable } from '../hooks/useObservable';
import { formatDate, formatNumber } from '../lib/format';

const dashboardStyles = `
  @keyframes wave {
    0% { transform: translateX(0); }
    100% { transform: translateX(-20px); } /* Assuming wave length is 20px in viewBox */
  }
  @keyframes pulseGlow {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 230, 118, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
  }
  .pulsing-dot {
    animation: pulseGlow 2s infinite;
  }
`;

// Circumference of the OEE ring (r = 52): 100% = 0 offset, 0% = full length.
const RING_LENGTH = 326.72;

export default function Dashboard() {
  const devices = useObservable(deviceService.getDevices(), []);
  const tags = useObservable(tagService.getTags(), []);
  const rules = useObservable(ruleService.getRules(), []);
  const alerts = useObservable(alertService.getAlerts(), []);
  const brokerStats = useObservable<MqttBrokerStats | null>(mqttMockService.brokerStats$, null);
  const simState = useObservable<SimulationState | null>(simulationService.state$, null);

  const deviceCount = devices.length;
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const tagCount = tags.length;
  const ruleCount = rules.length;
  const alertCount = alerts.filter(a => a.status === 'Active').length;

  const oeeOffset = simState ? RING_LENGTH - RING_LENGTH * (simState.systemHealth / 100) : 0;

  return (
    <section className="page">
      <div className="page-header">
        <h1>Smart DA Overview</h1>
        <div className="page-sub">Snapshot of device connectivity, telemetry, and rule engine health.</div>
      </div>

      {/* MQTT Global Throughput Panel */}
      {brokerStats && (
        <div className="card" style={{ marginBottom: 22, background: '#000', border: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#00e676', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulsing-dot" style={{ width: 10, height: 10, background: '#00e676', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #00e676' }} />
              Global MQTT Throughput
            </div>
            <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>Edge Nodes Connected: {brokerStats.connectedClients}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, color: '#ffeb3b', fontFamily: 'monospace', lineHeight: 1 }}>{formatNumber(simState?.mqttThroughput, '1.0-0')}</span>
              <span style={{ fontSize: 14, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Messages / Sec</span>
            </div>
            {/* Animated mini-sparkline for effect */}
            <div style={{ width: 150, height: 32, position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <path d="M0,10 Q10,20 20,10 T40,10 T60,10 T80,10 T100,10" fill="none" stroke="#ffeb3b" strokeWidth="1.5"
                      style={{ animation: 'wave 2s linear infinite' }} />
              </svg>
            </div>
          </div>
        </div>
      )}
      <style>{dashboardStyles}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginBottom: 22 }}>
        {/* Global OEE Ring Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
          <h3 style={{ fontSize: 13.5, position: 'absolute', top: 18, left: 18 }}>System Health</h3>
          <div style={{ position: 'relative', width: 150, height: 150, marginTop: 20 }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="oeeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--red)" />
                  <stop offset="100%" stopColor="#ff6659" />
                </linearGradient>
                <filter id="oeeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-3)" strokeWidth="8" />
              {/* Score binds to offset */}
              <circle id="dash-oee-ring" cx="60" cy="60" r="52" fill="none" stroke="url(#oeeGrad)" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={RING_LENGTH} strokeDashoffset={oeeOffset}
                      style={{ transition: 'stroke-dashoffset 1s linear', filter: 'url(#oeeGlow)' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div id="dash-oee-val" style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', lineHeight: 1 }}>{formatNumber(simState?.systemHealth, '1.1-1')}%</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>Uptime</div>
            </div>
          </div>
        </div>

        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 0 }}>
          <div className="card stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="stat-label">Devices configured</div>
            <div className="stat-value" id="stat-devices">{deviceCount}</div>
            <div className="stat-note" id="stat-devices-note" style={{ color: onlineCount > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
              {onlineCount} online
            </div>
          </div>
          <div className="card stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="stat-label">Tags configured</div>
            <div className="stat-value" id="stat-tags">{tagCount}</div>
            <div className="stat-note">mapped across devices</div>
          </div>
          <div className="card stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="stat-label">Active Rules</div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{ruleCount}</div>
            <div className="stat-note">monitoring telemetry stream</div>
          </div>
          <div className="card stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="stat-label">Active Alerts</div>
            <div className="stat-value" style={{ color: alertCount > 0 ? 'var(--red)' : 'var(--green)' }}>{alertCount}</div>
            <div className="stat-note">unresolved issues</div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Device Status at a Glance</h3>
        <table>
          <thead><tr><th>Device ID</th><th>Name</th><th>Protocol</th><th>Status</th><th>Last Seen</th></tr></thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.id}>
                <td className="mono" style={{ fontWeight: 500 }}>{device.id}</td>
                <td>{device.name}</td>
                <td>{device.protocol}</td>
                <td>
                  <span className={`pill ${device.status === 'Online' ? 'pill-online' : (device.status === 'Offline' ? 'pill-offline' : 'pill-warning')}`}>
                    <span className="dot" />{device.status}
                  </span>
                </td>
                <td className="mono" style={{ color: 'var(--text-muted)' }}>{device.lastSeen ? formatDate(device.lastSeen, 'shortTime') : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
