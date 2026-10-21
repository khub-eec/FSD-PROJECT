import { useState } from 'react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string;
  created: string;
  lastUsed: string;
}

const initialKeys: ApiKey[] = [
  { id: '1', name: 'Grafana Integration', prefix: 'eyJhbGci...', permissions: 'Read-Only', created: 'Oct 12, 2024', lastUsed: '2 mins ago' },
  { id: '2', name: 'ERP System Sync', prefix: 'v2.local...', permissions: 'Read/Write', created: 'Nov 01, 2024', lastUsed: '5 hours ago' },
];

export default function StandardApis() {
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialKeys);

  const generateKey = () => {
    const value = 'idacs_' + Math.random().toString(36).substr(2, 24) + '_v2';
    setNewKeyValue(value);
    setShowNewKey(true);

    setApiKeys((keys) => [
      {
        id: Math.random().toString(),
        name: 'New Custom Integration',
        prefix: value.substring(0, 10),
        permissions: 'Read-Only',
        created: 'Just now',
        lastUsed: 'Never',
      },
      ...keys,
    ]);
  };

  const revokeKey = (id: string) => {
    if (confirm('Are you sure you want to revoke this API key? Applications using it will immediately lose access.')) {
      setApiKeys((keys) => keys.filter((k) => k.id !== id));
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div className="row-between">
          <div>
            <h1>Standard APIs (REST/WebSocket)</h1>
            <div className="page-sub">Manage API Keys for programmatic access to the iDACS platform.</div>
          </div>
          <button className="btn btn-primary" onClick={generateKey}>+ Generate API Key</button>
        </div>
      </div>

      {showNewKey && (
        <div className="card" style={{ marginBottom: 16, border: '1px solid var(--green)', background: 'rgba(0,230,118, 0.05)' }}>
          <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--green)' }}>New API Key Generated!</h3>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>Please copy your key now. You will not be able to see it again.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={newKeyValue} readOnly style={{ flex: 1, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', background: 'var(--bg-1)' }} />
            <button className="btn" onClick={() => setShowNewKey(false)}>Done</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Active API Keys</h3>
        <table>
          <thead>
            <tr>
              <th>Key Name</th>
              <th>Prefix</th>
              <th>Permissions</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id}>
                <td style={{ fontWeight: 500 }}>{key.name}</td>
                <td className="mono" style={{ color: 'var(--text-3)' }}>{key.prefix}...</td>
                <td><span className="pill pill-offline" style={{ background: 'var(--bg-3)', borderColor: 'transparent' }}>{key.permissions}</span></td>
                <td style={{ color: 'var(--text-2)' }}>{key.created}</td>
                <td style={{ color: 'var(--text-2)' }}>{key.lastUsed}</td>
                <td><button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }} onClick={() => revokeKey(key.id)}>Revoke</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ background: 'var(--bg-2)' }}>
        <h3 style={{ fontSize: 14, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>API Documentation Reference</h3>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: 2 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <span style={{ color: '#58a6ff', fontWeight: 'bold', width: 40 }}>GET</span>
            <span style={{ color: 'var(--text-1)' }}>/api/v2/devices</span>
            <span style={{ color: 'var(--text-3)', marginLeft: 'auto' }}>List all configured devices</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <span style={{ color: '#3fb950', fontWeight: 'bold', width: 40 }}>POST</span>
            <span style={{ color: 'var(--text-1)' }}>/api/v2/telemetry/query</span>
            <span style={{ color: 'var(--text-3)', marginLeft: 'auto' }}>Query historical telemetry data</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <span style={{ color: '#58a6ff', fontWeight: 'bold', width: 40 }}>GET</span>
            <span style={{ color: 'var(--text-1)' }}>/api/v2/alerts/active</span>
            <span style={{ color: 'var(--text-3)', marginLeft: 'auto' }}>Get all currently active alerts</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: '#d29922', fontWeight: 'bold', width: 40 }}>WSS</span>
            <span style={{ color: 'var(--text-1)' }}>/ws/stream</span>
            <span style={{ color: 'var(--text-3)', marginLeft: 'auto' }}>Subscribe to live MQTT firehose</span>
          </div>
        </div>
      </div>
    </section>
  );
}
