import { useState } from 'react';
import { predictiveMaintenanceService } from '../services/predictive-maintenance.service';
import type { PredictiveModel } from '../services/predictive-maintenance.service';
import { useObservable } from '../hooks/useObservable';
import { formatNumber } from '../lib/format';

const getEmptyModel = (): Partial<PredictiveModel> => ({
  name: `AI-Model-${Math.floor(Math.random() * 1000)}`,
  target: 'MTR-001',
  version: 'v1.0.0',
  status: 'Training',
  confidence: '--',
});

const statusPill = (status: string): string =>
  'pill' + (status === 'Running' ? ' pill-online' : '') + (status === 'Training' ? ' pill-warning' : '') + (status === 'Stopped' ? ' pill-offline' : '');

const scoreColor = (score: number): string => (score > 0.75 ? 'var(--red)' : (score > 0.4 ? 'var(--amber)' : 'var(--green)'));

export default function PredictiveMaintenance() {
  const models = useObservable(predictiveMaintenanceService.models$, [] as PredictiveModel[]);
  const [showModal, setShowModal] = useState(false);
  const [newModel, setNewModel] = useState<Partial<PredictiveModel>>(getEmptyModel);

  const patch = (p: Partial<PredictiveModel>) => setNewModel((m) => ({ ...m, ...p }));

  const openModal = () => {
    setNewModel(getEmptyModel());
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const deployModel = () => {
    if (!newModel.name || !newModel.target) {
      alert('Name and Target Asset are required.');
      return;
    }
    predictiveMaintenanceService.addModel(newModel as PredictiveModel);
    closeModal();
  };

  const deleteModel = (id: string) => {
    if (confirm('Are you sure you want to remove this model?')) {
      predictiveMaintenanceService.deleteModel(id);
    }
  };

  return (
    <>
      <section className="page">
        <div className="page-header">
          <div className="row-between">
            <div>
              <h1>Predictive Maintenance (AI/ML)</h1>
              <div className="page-sub">Deploy machine learning models to the edge and monitor real-time anomaly scores via MQTT.</div>
            </div>
            <button className="btn btn-primary" onClick={openModal}>+ Deploy Model (.onnx)</button>
          </div>
        </div>

        {/* Anomaly Score Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          {models.map((model) => (
            <div className="card" key={model.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="row-between" style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, marginBottom: 0 }}>{model.name}</h3>
                <span className={statusPill(model.status)}>
                  <span className="dot"></span>{model.status}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 20 }}>Target: {model.target}</div>

              {model.status === 'Running' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 42, fontWeight: 600, fontFamily: 'var(--font-mono)', lineHeight: 1, color: scoreColor(model.anomalyScore) }}>
                    {formatNumber(model.anomalyScore, '1.2-2')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>
                    {model.anomalyScore > 0.75 ? 'Critical Anomaly Detected' : 'Normal Range (< 0.75)'}
                  </div>

                  <div style={{ width: '100%', height: 6, background: 'var(--bg-3)', borderRadius: 3, marginTop: 20, position: 'relative', overflow: 'hidden' }}>
                    <div
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, transition: 'width 0.3s ease',
                        width: (model.anomalyScore * 100) + '%',
                        background: scoreColor(model.anomalyScore),
                      }}
                    ></div>
                    <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: 2, background: 'var(--text-1)', opacity: 0.5 }}></div>
                  </div>
                </div>
              )}

              {model.status !== 'Running' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontStyle: 'italic', fontSize: 13 }}>
                  Anomaly detection inactive.
                </div>
              )}

              <div className="row-between" style={{ marginTop: 20, marginBottom: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Conf: {model.confidence} | {model.version}</div>
                <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'transparent', background: 'transparent' }} onClick={() => deleteModel(model.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>All Deployed Models</h3>
          <table>
            <thead><tr><th>Model Name</th><th>Target Asset</th><th>Version</th><th>Status</th><th>Confidence</th><th>Actions</th></tr></thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td style={{ fontWeight: 500 }}>{model.name}</td>
                  <td>{model.target}</td>
                  <td className="mono">{model.version}</td>
                  <td><span className={statusPill(model.status)}><span className="dot"></span>{model.status}</span></td>
                  <td>{model.confidence}</td>
                  <td><button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }} onClick={() => deleteModel(model.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inline modal */}
      <div className={`modal-overlay${showModal ? ' open' : ''}`}>
        {showModal && (
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize: 16 }}>Deploy ML Model</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Model Name *</label>
                <input type="text" value={newModel.name ?? ''} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Bearing-Predictor" />
              </div>
              <div className="form-field">
                <label>Target Asset *</label>
                <input type="text" value={newModel.target ?? ''} onChange={(e) => patch({ target: e.target.value })} placeholder="e.g. MTR-001" />
              </div>
              <div className="form-field">
                <label>Version</label>
                <input type="text" value={newModel.version ?? ''} onChange={(e) => patch({ version: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Initial Status</label>
                <select value={newModel.status ?? ''} onChange={(e) => patch({ status: e.target.value as PredictiveModel['status'] })}>
                  <option value="Training">Training (Shadow Mode)</option>
                  <option value="Running">Running (Active Inference)</option>
                  <option value="Stopped">Stopped</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={deployModel}>Deploy to Edge</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
