import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceService } from '../services/device.service';
import { useObservable } from '../hooks/useObservable';
import type { Device } from '../models/device.model';

const availableParameters: string[] = ['Temperature', 'Pressure', 'Humidity', 'Vibration', 'Voltage', 'Current'];

const getEmptyDevice = (): Device => ({
  id: '',
  name: '',
  protocol: '',
  broker: 'localhost',
  port: 1883,
  topic: '',
  qos: 1,
  keepAlive: 60,
  lwtEnabled: true,
  enabled: true,
  status: 'Offline',
  parameters: [],
});

const sectionH3 = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontSize: 13,
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)',
  paddingBottom: 8,
  marginBottom: 12,
  ...extra,
});

export default function DeviceManagement() {
  const navigate = useNavigate();
  const devices = useObservable(deviceService.getDevices(), [] as Device[]);
  const [showModal, setShowModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device>(getEmptyDevice());

  const patch = (p: Partial<Device>) => setCurrentDevice((d) => ({ ...d, ...p }));

  const toggleParameter = (param: string) => {
    setCurrentDevice((d) => {
      const params = d.parameters ? [...d.parameters] : [];
      const index = params.indexOf(param);
      if (index > -1) params.splice(index, 1);
      else params.push(param);
      return { ...d, parameters: params };
    });
  };

  const openModal = (device?: Device) => {
    setCurrentDevice(device ? { ...device } : getEmptyDevice());
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const saveDevice = () => {
    if (currentDevice.id && devices.some((d) => d.id === currentDevice.id)) {
      deviceService.updateDevice(currentDevice).subscribe(() => {
        closeModal();
        navigate('/rule-engine');
      });
    } else {
      if (!currentDevice.id || !currentDevice.name) {
        alert('Device ID and Name are required.');
        return;
      }
      deviceService.addDevice(currentDevice).subscribe(() => {
        closeModal();
        navigate('/rule-engine');
      });
    }
  };

  const deleteDevice = (id: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      deviceService.deleteDevice(id).subscribe();
    }
  };

  const toggleEnabled = (device: Device) => {
    const newEnabledState = !device.enabled;
    const updated: Device = { ...device, enabled: newEnabledState, status: newEnabledState ? 'Online' : 'Offline' };
    deviceService.updateDevice(updated).subscribe();
  };

  const testConnection = (device: Device) => {
    deviceService.testConnection(device).subscribe((res) => {
      alert(`[MOCK] ${res.message}`);
    });
  };

  return (
    <>
      <section className="page">
        <div className="page-header">
          <div className="row-between">
            <div>
              <h1>Device Management</h1>
              <div className="page-sub">Add, configure, and monitor every connected device on the MQTT network.</div>
            </div>
            <button className="btn btn-primary" onClick={() => openModal()}>+ Add Parameters</button>
          </div>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Protocol</th>
                <th>Topic</th>
                <th>Keep-Alive</th>
                <th>Status</th>
                <th>Enabled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="mono" style={{ fontWeight: 500 }}>{device.id}</td>
                  <td>{device.name}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{device.protocol || 'MQTT v5.0'}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>QoS {device.qos || 0}</span>
                  </td>
                  <td className="mono">{device.topic}</td>
                  <td className="mono">{device.keepAlive || 60}s</td>
                  <td>
                    <span className={`pill ${device.status === 'Online' ? 'pill-online' : (device.status === 'Offline' ? 'pill-offline' : 'pill-warning')}`}>
                      <span className="dot"></span>{device.status}
                    </span>
                  </td>
                  <td>
                    <div className={`switch${device.enabled ? ' on' : ''}`} onClick={() => toggleEnabled(device)}></div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-sm" onClick={() => openModal(device)}>Edit</button>
                      <button className="btn btn-sm" onClick={() => testConnection(device)}>Test</button>
                      <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }} onClick={() => deleteDevice(device.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No devices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inline modal */}
      <div className={`modal-overlay${showModal ? ' open' : ''}`}>
        {showModal && (
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize: 16 }}>{currentDevice.id ? 'Edit Parameters' : 'Add New Parameters'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div style={{ padding: '0 20px' }}>
              <h3 style={sectionH3()}>General</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label>Device ID *</label>
                  <input type="text" value={currentDevice.id} onChange={(e) => patch({ id: e.target.value })} placeholder="e.g. CNC-01" disabled={!!currentDevice.id} />
                </div>
                <div className="form-field">
                  <label>Device Name *</label>
                  <input type="text" value={currentDevice.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. CNC Machine 01" />
                </div>
                <div className="form-field">
                  <label>Protocol</label>
                  <select value={currentDevice.protocol} onChange={(e) => patch({ protocol: e.target.value })}>
                    <option value="" disabled>Select Protocol</option>
                    <option value="MQTT v5.0">MQTT v5.0</option>
                    <option value="MQTT v3.1.1">MQTT v3.1.1</option>
                  </select>
                </div>
              </div>

              {currentDevice.protocol && (
                <>
                  <h3 style={sectionH3({ marginTop: 20 })}>Parameters</h3>
                  <div className="form-grid">
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label>Select Parameters to Monitor</label>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                        {availableParameters.map((param) => (
                          <label key={param} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={!!currentDevice.parameters?.includes(param)} onChange={() => toggleParameter(param)} style={{ margin: 0 }} />
                            {param}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentDevice.protocol && (
                <>
                  <h3 style={sectionH3({ marginTop: 20 })}>Questionnaire</h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>IP Address</label>
                      <input type="text" placeholder="e.g. 192.168.1.100" />
                    </div>
                    <div className="form-field">
                      <label>Port no.</label>
                      <input type="text" placeholder="e.g. 8080" />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label>MAC Address</label>
                      <input type="text" placeholder="e.g. 00:1B:44:11:3A:B7" />
                    </div>
                  </div>
                </>
              )}

              {currentDevice.protocol && (
                <>
                  <h3 style={sectionH3({ marginTop: 20 })}>MQTT Configuration</h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Broker URL</label>
                      <input type="text" value={currentDevice.broker ?? ''} onChange={(e) => patch({ broker: e.target.value })} placeholder="e.g. localhost" />
                    </div>
                    <div className="form-field">
                      <label>Port</label>
                      <input type="number" value={currentDevice.port ?? ''} onChange={(e) => patch({ port: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="1883" />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label>Publish Topic</label>
                      <input type="text" value={currentDevice.topic ?? ''} onChange={(e) => patch({ topic: e.target.value })} placeholder="factory/devices/CNC-01/telemetry" />
                    </div>
                    <div className="form-field">
                      <label>QoS Level</label>
                      <select value={currentDevice.qos ?? ''} onChange={(e) => patch({ qos: Number(e.target.value) })}>
                        <option value={0}>0 - At most once</option>
                        <option value={1}>1 - At least once</option>
                        <option value={2}>2 - Exactly once</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Keep-Alive (s)</label>
                      <input type="number" value={currentDevice.keepAlive ?? ''} onChange={(e) => patch({ keepAlive: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="60" />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!currentDevice.lwtEnabled} onChange={(e) => patch({ lwtEnabled: e.target.checked })} style={{ margin: 0 }} />
                        Enable Last Will and Testament (LWT)
                      </label>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Broker will publish an offline status if connection drops unexpectedly.</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={saveDevice} disabled={!currentDevice.id || !currentDevice.name}>Save</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
