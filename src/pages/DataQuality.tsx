import { useState } from 'react';
import { dataQualityService } from '../services/data-quality.service';
import type { DataQualityException, ValidationSchema } from '../services/data-quality.service';
import { useObservable } from '../hooks/useObservable';

export default function DataQuality() {
  const exceptions = useObservable(dataQualityService.exceptions$, [] as DataQualityException[]);
  const schemas = useObservable(dataQualityService.schemas$, [] as ValidationSchema[]);
  const [showModal, setShowModal] = useState(false);
  // Clone for editing
  const [editingSchemas, setEditingSchemas] = useState<ValidationSchema[]>([]);

  const clearExceptions = () => {
    if (confirm('Are you sure you want to clear all validation logs?')) {
      dataQualityService.clearExceptions();
    }
  };

  const openSchemaModal = () => {
    // Deep clone the schemas array so edits don't reflect until saved
    setEditingSchemas(JSON.parse(JSON.stringify(schemas)));
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const addSchemaRow = () => setEditingSchemas((s) => [...s, { topicPattern: '', requiredFields: '' }]);

  const removeSchemaRow = (index: number) => setEditingSchemas((s) => s.filter((_, i) => i !== index));

  const updateRow = (index: number, p: Partial<ValidationSchema>) =>
    setEditingSchemas((s) => s.map((row, i) => (i === index ? { ...row, ...p } : row)));

  const saveSchemas = () => {
    // Basic validation
    const cleaned = editingSchemas.filter((s) => s.topicPattern.trim() !== '');
    setEditingSchemas(cleaned);
    dataQualityService.saveSchemas(cleaned);
    closeModal();
  };

  return (
    <>
      <section className="page">
        <div className="page-header">
          <h1>MQTT Payload Validation & Cleansing</h1>
          <div className="page-sub">Monitor and configure JSON schema validation, deadbanding, and missing field handling for incoming telemetry.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="stat-label">Valid Payload Yield</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>98.5%</div>
            <div className="stat-note">Successfully parsed & mapped</div>
          </div>
          <div className="card stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="stat-label">Schema Violations</div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{exceptions.length * 12 + 18}</div>
            <div className="stat-note">Missing fields / Wrong types</div>
          </div>
          <div className="card stat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="stat-label">Dropped Messages</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{exceptions.length * 3 + 2}</div>
            <div className="stat-note">Malformed JSON payloads</div>
          </div>
        </div>
        <div className="card">
          <div className="row-between">
            <h3 style={{ fontSize: 14, marginBottom: 0 }}>Recent Validation Exceptions</h3>
            <div>
              <button className="btn btn-sm" onClick={clearExceptions} style={{ marginRight: 8 }}>Clear Logs</button>
              <button className="btn btn-sm btn-primary" onClick={openSchemaModal}>Configure Validation Schemas</button>
            </div>
          </div>
          <table style={{ marginTop: 16 }}>
            <thead><tr><th>Timestamp</th><th>MQTT Topic</th><th>Validation Error</th><th>Action Taken</th></tr></thead>
            <tbody>
              {exceptions.map((ex) => (
                <tr key={ex.id}>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>{ex.time}</td>
                  <td className="mono" style={{ color: 'var(--blue)' }}>{ex.topic}</td>
                  <td>{ex.rule}</td>
                  <td><span className={`pill pill-${ex.type}`}><span className="dot"></span>{ex.action}</span></td>
                </tr>
              ))}
              {exceptions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No exceptions logged. Payloads are valid.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inline modal */}
      <div className={`modal-overlay${showModal ? ' open' : ''}`}>
        {showModal && (
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16 }}>Configure JSON Schemas</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Define the required fields for MQTT topic patterns. If a payload arrives on a topic matching the pattern but is missing these fields, it will generate an exception.
              </p>

              {editingSchemas.map((schema, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input type="text" value={schema.topicPattern} onChange={(e) => updateRow(i, { topicPattern: e.target.value })} placeholder="Topic Pattern (e.g. factory/+/motor)" />
                  <input type="text" value={schema.requiredFields} onChange={(e) => updateRow(i, { requiredFields: e.target.value })} placeholder="Required Fields (comma separated)" />
                  <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)', padding: 4 }} onClick={() => removeSchemaRow(i)}>✕</button>
                </div>
              ))}

              <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={addSchemaRow}>+ Add Pattern</button>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSchemas}>Save Schemas</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
