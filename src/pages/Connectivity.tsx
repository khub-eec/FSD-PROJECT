import { useEffect, useRef, useState } from 'react';
import { connectionService } from '../services/connection.service';
import { mqttMockService } from '../services/mqtt-mock.service';
import { mqttClientService } from '../services/mqtt-client.service';
import type { MqttConnectionOptions } from '../services/mqtt-client.service';
import { useObservable } from '../hooks/useObservable';
import { formatDate } from '../lib/format';
import type { Connection } from '../models/connection.model';
import type { MqttBrokerStats } from '../services/mqtt-mock.service';
import type { MqttConnectionState } from '../services/mqtt-client.service';

const getEmptyConnection = (): Partial<Connection> => ({
  name: '',
  type: 'Protocol',
  protocol: 'MQTT',
  details: { broker: 'ws://localhost:9001/mqtt', clientId: '', baseTopic: 'factory/', username: 'frontend', password: 'frontend123' },
  status: 'Offline',
});

const detailsForProtocol = (protocol: string | undefined): any => {
  if (protocol === 'MQTT') {
    return {
      broker: 'ws://localhost:9001/mqtt',
      clientId: '',
      baseTopic: 'factory/',
      username: 'frontend',
      password: 'frontend123',
    };
  } else if (protocol === 'OPC UA') {
    return { endpoint: '', security: 'None' };
  } else if (protocol === 'Modbus TCP') {
    return { ip: '', port: 502, slaveId: 1 };
  }
  return {};
};

const numOrNull = (v: string): number | null => (v === '' ? null : Number(v));

const statBox = { padding: 12, background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--border-strong)', textAlign: 'center' } as const;
const statLabel = { fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 } as const;
const statValue = { fontSize: 20, color: 'var(--text-1)', fontFamily: 'monospace' } as const;
const mqttInput = { padding: 8, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-1)' } as const;

export default function Connectivity() {
  const connections = useObservable<Connection[]>(connectionService.getConnections(), []);
  const brokerStats = useObservable<MqttBrokerStats | null>(mqttMockService.brokerStats$, null);
  const mqttConnectionState = useObservable<MqttConnectionState | null>(mqttClientService.state$, null);

  const [isTesting, setIsTesting] = useState(false);
  const [mqttTestInProgress, setMqttTestInProgress] = useState(false);
  const [mqttTestResult, setMqttTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentConnection, setCurrentConnection] = useState<Partial<Connection>>(getEmptyConnection);
  const disconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (disconnectTimer.current) clearTimeout(disconnectTimer.current);
      mqttClientService.disconnect();
    };
  }, []);

  const details: any = currentConnection.details ?? {};
  const setDetail = (key: string, value: any) =>
    setCurrentConnection((c) => ({ ...c, details: { ...(c.details ?? {}), [key]: value } }));
  const setName = (name: string) => setCurrentConnection((c) => ({ ...c, name }));

  const saveConnection = () => {
    if (!currentConnection.name || !currentConnection.protocol) {
      alert('Please provide a connection name and protocol.');
      return;
    }

    if (currentConnection.id) {
      connectionService.updateConnection(currentConnection as Connection).subscribe(() => {
        setCurrentConnection(getEmptyConnection());
      });
    } else {
      connectionService.createConnection(currentConnection as Connection).subscribe(() => {
        setCurrentConnection(getEmptyConnection());
      });
    }
  };

  const editConnection = (conn: Connection) => {
    setCurrentConnection(JSON.parse(JSON.stringify(conn)));
  };

  const deleteConnection = (id: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      connectionService.deleteConnection(id).subscribe();
    }
  };

  const testConnection = (id: string) => {
    setIsTesting(true);
    connectionService.testConnection(id).subscribe((success) => {
      setIsTesting(false);
      if (success) {
        alert('Connection test successful!');
      } else {
        alert('Connection test failed. Please check endpoint details and firewall.');
      }
    });
  };

  const testMqttConnection = async () => {
    const d = currentConnection.details as any;
    if (!d?.broker) {
      alert('Please enter a broker URL');
      return;
    }

    setMqttTestInProgress(true);
    setMqttTestResult(null);

    const options: MqttConnectionOptions = {
      brokerUrl: d.broker,
      clientId: d.clientId || `idacs_test_${Date.now()}`,
      username: d.username,
      password: d.password,
      clean: true,
      reconnectPeriod: 0,
      connectTimeout: 10000,
    };

    try {
      await mqttClientService.connect(options);
      setMqttTestResult({
        success: true,
        message: `Connected to ${d.broker} as ${options.clientId}`,
      });

      // Test publish/subscribe
      await mqttClientService.subscribe('test/connection', 0);
      await mqttClientService.publish('test/connection', { test: true, timestamp: new Date().toISOString() }, 0);

      // Disconnect after test
      disconnectTimer.current = setTimeout(() => {
        mqttClientService.disconnect();
      }, 1000);
    } catch (error: any) {
      setMqttTestResult({
        success: false,
        message: `Connection failed: ${error.message}`,
      });
      mqttClientService.disconnect();
    } finally {
      setMqttTestInProgress(false);
    }
  };

  const onProtocolChange = (protocol: string) => {
    setCurrentConnection((c) => ({ ...c, protocol, details: detailsForProtocol(protocol) }));
  };

  const mqttStatus = mqttConnectionState?.status || 'offline';

  return (
    <section className="page">
      <style>{`
@keyframes pulseGlow {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 230, 118, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 230, 118, 0); }
}
.pulsing-dot {
  animation: pulseGlow 2s infinite;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.status-connected { background: #00e676; box-shadow: 0 0 8px #00e676; }
.status-dot.status-connecting,
.status-dot.status-reconnecting { background: #ffa500; box-shadow: 0 0 8px #ffa500; animation: pulseGlow 1s infinite; }
.status-dot.status-error { background: #ff3d00; box-shadow: 0 0 8px #ff3d00; }
.status-dot.status-disconnected,
.status-dot.status-offline { background: #666; box-shadow: none; }
`}</style>
      <div className="page-header">
        <div className="row-between">
          <div>
            <h1>Connection Manager</h1>
            <div className="page-sub">Configure and monitor industrial protocols, PLC gateways, and cloud endpoints.</div>
          </div>
        </div>
      </div>

      {/* MQTT Broker Status Panel */}
      {brokerStats && (
        <div className="card" style={{ marginBottom: 14, background: '#000', border: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#00e676', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulsing-dot" style={{ width: 10, height: 10, background: '#00e676', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #00e676' }}></span>
              Global MQTT Broker Live Status
            </div>
            <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>{brokerStats.brokerUrl} | WS: {brokerStats.webSocketUrl}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <div style={statBox}>
              <div style={statLabel}>Uptime</div>
              <div style={statValue}>{brokerStats.uptime}s</div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Connected Clients</div>
              <div style={statValue}>{brokerStats.connectedClients}</div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Msg / Sec</div>
              <div style={statValue}>{brokerStats.messagesPerSecond}</div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Active Topics</div>
              <div style={statValue}>{brokerStats.activeTopics}</div>
            </div>
            <div style={statBox}>
              <div style={statLabel}>Latency</div>
              <div style={statValue}>{brokerStats.networkLatency}ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time MQTT Connection Test Panel */}
      <div className="card" style={{ marginBottom: 14, background: '#000', border: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#00e676', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`status-dot status-${mqttStatus}`}></span>
            Real-time MQTT Connection Test
          </div>
          <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>{mqttConnectionState?.brokerUrl || 'Not connected'}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={statBox}>
            <div style={statLabel}>Status</div>
            <div style={{ fontSize: 16, color: 'var(--text-1)', fontFamily: 'monospace', textTransform: 'capitalize' }}>{mqttConnectionState?.status || 'disconnected'}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Messages Received</div>
            <div style={{ fontSize: 16, color: 'var(--text-1)', fontFamily: 'monospace' }}>{mqttConnectionState?.messagesReceived || 0}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Messages Sent</div>
            <div style={{ fontSize: 16, color: 'var(--text-1)', fontFamily: 'monospace' }}>{mqttConnectionState?.messagesSent || 0}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Client ID</div>
            <div style={{ fontSize: 12, color: 'var(--text-1)', fontFamily: 'monospace' }}>{mqttConnectionState?.clientId || '-'}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--border-strong)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" value={details.broker ?? ''} onChange={(e) => setDetail('broker', e.target.value)} placeholder="Broker URL (e.g., ws://localhost:9001/mqtt)" style={{ ...mqttInput, flex: 1, minWidth: 250 }} />
            <input type="text" value={details.clientId ?? ''} onChange={(e) => setDetail('clientId', e.target.value)} placeholder="Client ID (optional)" style={{ ...mqttInput, width: 150 }} />
            <input type="text" value={details.username ?? ''} onChange={(e) => setDetail('username', e.target.value)} placeholder="Username (optional)" style={{ ...mqttInput, width: 130 }} />
            <input type="password" value={details.password ?? ''} onChange={(e) => setDetail('password', e.target.value)} placeholder="Password (optional)" style={{ ...mqttInput, width: 130 }} />
            <button className="btn btn-primary" onClick={testMqttConnection} disabled={mqttTestInProgress} style={{ whiteSpace: 'nowrap' }}>
              {mqttTestInProgress ? 'Testing...' : 'Test MQTT Connection'}
            </button>
            <button className="btn" onClick={() => mqttClientService.disconnect()} disabled={!mqttConnectionState || mqttConnectionState.status === 'disconnected'}>Disconnect</button>
          </div>
          {mqttTestResult && (
            <div style={{
              marginTop: 12, padding: 10, borderRadius: 4, fontFamily: 'monospace', fontSize: 12,
              background: mqttTestResult.success ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 61, 0, 0.15)',
              border: mqttTestResult.success ? '1px solid #00e676' : '1px solid #ff3d00',
              color: mqttTestResult.success ? '#00e676' : '#ff3d00',
            }}>
              {mqttTestResult.message}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14, background: 'var(--bg-2)' }}>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>{currentConnection.id ? 'Edit Connection' : 'New Connection Wizard'}</div>

        <div className="form-grid">
          <div className="form-field">
            <label>Connection Name</label>
            <input type="text" value={currentConnection.name ?? ''} onChange={(e) => setName(e.target.value)} placeholder="e.g. Line 1 MQTT Broker" />
          </div>
          <div className="form-field">
            <label>Protocol</label>
            <select value={currentConnection.protocol ?? ''} onChange={(e) => onProtocolChange(e.target.value)}>
              <option value="MQTT">MQTT</option>
              <option value="OPC UA">OPC UA</option>
              <option value="Modbus TCP">Modbus TCP</option>
              <option value="REST API">REST API</option>
              <option value="AWS IoT">AWS IoT</option>
            </select>
          </div>
        </div>

        {/* Dynamic Details Fields based on Protocol */}
        {currentConnection.protocol === 'MQTT' && currentConnection.details && (
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-field"><label>Broker URL</label><input type="text" value={details.broker ?? ''} onChange={(e) => setDetail('broker', e.target.value)} placeholder="tcp://broker.hivemq.com:1883 or ws://localhost:9001/mqtt" /></div>
            <div className="form-field"><label>Client ID</label><input type="text" value={details.clientId ?? ''} onChange={(e) => setDetail('clientId', e.target.value)} placeholder="iDACS_Client_01" /></div>
            <div className="form-field"><label>Base Topic</label><input type="text" value={details.baseTopic ?? ''} onChange={(e) => setDetail('baseTopic', e.target.value)} placeholder="factory/line1/#" /></div>
            <div className="form-field"><label>Username</label><input type="text" value={details.username ?? ''} onChange={(e) => setDetail('username', e.target.value)} placeholder="device1" /></div>
            <div className="form-field"><label>Password</label><input type="password" value={details.password ?? ''} onChange={(e) => setDetail('password', e.target.value)} placeholder="password1" /></div>
          </div>
        )}

        {currentConnection.protocol === 'OPC UA' && currentConnection.details && (
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-field"><label>Endpoint URL</label><input type="text" value={details.endpoint ?? ''} onChange={(e) => setDetail('endpoint', e.target.value)} placeholder="opc.tcp://192.168.1.10:4840" /></div>
            <div className="form-field">
              <label>Security Policy</label>
              <select value={details.security ?? ''} onChange={(e) => setDetail('security', e.target.value)}>
                <option value="None">None</option>
                <option value="Basic256Sha256">Basic256Sha256</option>
              </select>
            </div>
          </div>
        )}

        {currentConnection.protocol === 'Modbus TCP' && currentConnection.details && (
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="form-field"><label>IP Address</label><input type="text" value={details.ip ?? ''} onChange={(e) => setDetail('ip', e.target.value)} placeholder="192.168.1.50" /></div>
            <div className="form-field"><label>Port</label><input type="number" value={details.port ?? ''} onChange={(e) => setDetail('port', numOrNull(e.target.value))} /></div>
            <div className="form-field"><label>Slave ID</label><input type="number" value={details.slaveId ?? ''} onChange={(e) => setDetail('slaveId', numOrNull(e.target.value))} /></div>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button className="btn btn-primary" onClick={saveConnection}>{currentConnection.id ? 'Update Connection' : 'Save Connection'}</button>
          {currentConnection.id && (
            <button className="btn" onClick={() => setCurrentConnection(getEmptyConnection())} style={{ marginLeft: 8 }}>Cancel</button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 13.5, marginBottom: 14 }}>Configured Connections</h3>
        <table>
          <thead>
            <tr>
              <th>Connection Name</th>
              <th>Protocol</th>
              <th>Endpoint Details</th>
              <th>Status</th>
              <th>Last Tested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((conn) => (
              <tr key={conn.id}>
                <td style={{ fontWeight: 500 }}>{conn.name}</td>
                <td>{conn.protocol}</td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {conn.protocol === 'MQTT' && <>{conn.details.broker}</>}
                  {conn.protocol === 'OPC UA' && <>{conn.details.endpoint}</>}
                  {conn.protocol === 'Modbus TCP' && <>{conn.details.ip}:{conn.details.port}</>}
                </td>
                <td>
                  <span className={`pill${conn.status === 'Connected' ? ' pill-online' : ''}${conn.status === 'Error' ? ' pill-offline' : ''}${conn.status === 'Offline' ? ' pill-warning' : ''}`}>
                    <span className="dot"></span>{conn.status}
                  </span>
                </td>
                <td className="mono" style={{ color: 'var(--text-muted)' }}>{conn.lastTested ? formatDate(conn.lastTested, 'short') : 'Never'}</td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-sm" onClick={() => testConnection(conn.id)} disabled={isTesting}>Test</button>
                    <button className="btn btn-sm" onClick={() => editConnection(conn)}>Edit</button>
                    <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }} onClick={() => deleteConnection(conn.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {connections.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No connections configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
