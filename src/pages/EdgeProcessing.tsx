import { useState } from 'react';
import { edgeProcessingService } from '../services/edge-processing.service';
import { useObservable } from '../hooks/useObservable';
import type { EdgeWorkload } from '../models/edge-workload.model';

const getEmptyWorkload = (): Partial<EdgeWorkload> => ({
  name: `Processor-${Math.floor(Math.random() * 1000)}`,
  type: 'starlark',
  device: 'MTR-001',
  status: 'Stopped',
  cpuMem: '0% / 0MB',
});

export default function EdgeProcessing() {
  const workloads = useObservable(edgeProcessingService.getWorkloads(), [] as EdgeWorkload[]);
  const [showModal, setShowModal] = useState(false);
  const [currentWorkload, setCurrentWorkload] = useState<Partial<EdgeWorkload>>(getEmptyWorkload);

  const patch = (p: Partial<EdgeWorkload>) => setCurrentWorkload((w) => ({ ...w, ...p }));

  const openModal = (workload?: EdgeWorkload) => {
    setCurrentWorkload(workload ? { ...workload } : getEmptyWorkload());
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const saveWorkload = () => {
    if (!currentWorkload.name || !currentWorkload.device || !currentWorkload.type) {
      alert('Name, Type, and Target Edge Node are required.');
      return;
    }
    if (currentWorkload.id) {
      edgeProcessingService.updateWorkload(currentWorkload as EdgeWorkload);
    } else {
      edgeProcessingService.addWorkload(currentWorkload as EdgeWorkload);
    }
    closeModal();
  };

  const deleteWorkload = (id: string) => {
    if (confirm('Are you sure you want to delete this processor?')) {
      edgeProcessingService.deleteWorkload(id);
    }
  };

  const toggleStatus = (id: string) => edgeProcessingService.toggleStatus(id);

  return (
    <>
      <section className="page">
        <div className="page-header">
          <div className="row-between">
            <div>
              <h1>Telegraf Edge Processors</h1>
              <div className="page-sub">Define Telegraf processor plugins (Regex, Starlark, Execd) to modify MQTT metrics at the edge.</div>
            </div>
            <button className="btn btn-primary" onClick={() => openModal()}>+ Deploy Processor</button>
          </div>
        </div>
        <div className="card">
          <table>
            <thead><tr><th>Processor Name</th><th>Plugin Type</th><th>Target Edge Node</th><th>Status</th><th>CPU / Mem</th><th>Actions</th></tr></thead>
            <tbody>
              {workloads.map((wl) => (
                <tr key={wl.id}>
                  <td className="mono" style={{ fontWeight: 500 }}>{wl.name}</td>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--blue)' }}>Processor ({wl.type})</span></td>
                  <td>{wl.device}</td>
                  <td><span className={`pill ${wl.status === 'Running' ? 'pill-online' : 'pill-offline'}`}><span className="dot"></span>{wl.status}</span></td>
                  <td className="mono">{wl.cpuMem}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-sm" onClick={() => openModal(wl)}>Edit</button>
                      <button className="btn btn-sm" onClick={() => toggleStatus(wl.id)}>{wl.status === 'Running' ? 'Stop' : 'Start'}</button>
                      <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }} onClick={() => deleteWorkload(wl.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {workloads.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No processors deployed.</td>
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
              <h2 style={{ fontSize: 16 }}>{currentWorkload.id ? 'Edit Processor' : 'Deploy New Processor'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Processor Name *</label>
                <input type="text" value={currentWorkload.name ?? ''} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Filter-Spikes" />
              </div>
              <div className="form-field">
                <label>Target Edge Node *</label>
                <input type="text" value={currentWorkload.device ?? ''} onChange={(e) => patch({ device: e.target.value })} placeholder="e.g. CNC-Line1-01" />
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>Telegraf Plugin Type *</label>
                <select value={currentWorkload.type ?? ''} onChange={(e) => patch({ type: e.target.value })}>
                  <option value="starlark">Starlark (Custom Python-like scripting)</option>
                  <option value="regex">Regex (Pattern matching and replacement)</option>
                  <option value="scale">Scale (Multiplier/Offset calibration)</option>
                  <option value="execd">Execd (External custom binary)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={saveWorkload}>{currentWorkload.id ? 'Save Changes' : 'Deploy'}</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
