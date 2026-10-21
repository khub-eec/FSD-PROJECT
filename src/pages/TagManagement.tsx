import { useEffect, useState } from 'react';
import { tagService } from '../services/tag.service';
import type { Tag } from '../models/tag.model';

const getEmptyTag = (): Partial<Tag> => ({
  name: '',
  deviceId: '',
  topic: '',
  jsonPath: '',
  dataType: 'Numeric',
  engineeringUnit: '',
  quality: 'Good',
});

export default function TagManagement() {
  const [showModal, setShowModal] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentTag, setCurrentTag] = useState<Partial<Tag>>(getEmptyTag());
  const [selectedDevice, setSelectedDevice] = useState('All Devices');
  const [reloadKey, setReloadKey] = useState(0);

  // getTagsByDevice emits a snapshot; reloadKey re-fetches after add/update/delete.
  useEffect(() => {
    const sub = tagService.getTagsByDevice(selectedDevice).subscribe((data) => setTags(data));
    return () => sub.unsubscribe();
  }, [selectedDevice, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);
  const patch = (p: Partial<Tag>) => setCurrentTag((t) => ({ ...t, ...p }));

  const openModal = (tag?: Tag) => {
    setCurrentTag(tag ? { ...tag } : getEmptyTag());
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const saveTag = () => {
    if (!currentTag.name || !currentTag.deviceId || !currentTag.topic || !currentTag.jsonPath) {
      alert('Name, Device ID, Topic, and JSON Path are required.');
      return;
    }
    if (currentTag.id) {
      tagService.updateTag(currentTag as Tag).subscribe(() => {
        closeModal();
        reload();
      });
    } else {
      tagService.addTag(currentTag as Tag).subscribe(() => {
        closeModal();
        reload();
      });
    }
  };

  const deleteTag = (id: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      tagService.deleteTag(id).subscribe(() => reload());
    }
  };

  return (
    <>
      <section className="page">
        <div className="page-header">
          <div className="row-between">
            <div>
              <h1>Tag Management</h1>
              <div className="page-sub">Map incoming MQTT JSON payloads to standard internal tags.</div>
            </div>
            <button className="btn btn-primary" onClick={() => openModal()}>+ Map New Tag</button>
          </div>
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="form-field" style={{ maxWidth: 280 }}>
            <label>Filter by Device</label>
            <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>
              <option value="All Devices">All Devices</option>
              <option value="CNC-01">CNC-01</option>
              <option value="CNC-02">CNC-02</option>
              <option value="ROBOT-01">ROBOT-01</option>
              <option value="HVAC-A">HVAC-A</option>
            </select>
          </div>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Internal Tag Name</th>
                <th>Device ID</th>
                <th>MQTT Topic Payload</th>
                <th>JSON Path</th>
                <th>Quality</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--text-1)' }}>{tag.name}</td>
                  <td>{tag.deviceId}</td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tag.topic}</td>
                  <td className="mono" style={{ color: 'var(--blue)' }}>{tag.jsonPath}</td>
                  <td>
                    <span className={`pill ${tag.quality === 'Good' ? 'pill-online' : (tag.quality === 'Warning' ? 'pill-warning' : 'pill-offline')}`}>
                      <span className="dot"></span>{tag.quality}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-sm" onClick={() => openModal(tag)}>Edit</button>
                      <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red-border)' }} onClick={() => deleteTag(tag.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {tags.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No tags found.</td>
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
              <h2 style={{ fontSize: 16 }}>{currentTag.id ? 'Edit Mapped Tag' : 'Map New MQTT Tag'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Internal Tag Name *</label>
                <input type="text" value={currentTag.name ?? ''} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Spindle_Temp" />
              </div>
              <div className="form-field">
                <label>Device ID *</label>
                <input type="text" value={currentTag.deviceId ?? ''} onChange={(e) => patch({ deviceId: e.target.value })} placeholder="e.g. CNC-01" />
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>MQTT Topic Payload *</label>
                <input type="text" value={currentTag.topic ?? ''} onChange={(e) => patch({ topic: e.target.value })} placeholder="e.g. factory/line1/motor1" />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>The topic from which the JSON payload is published.</div>
              </div>

              <div className="form-field" style={{ gridColumn: 'span 2' }}>
                <label>JSON Path *</label>
                <input type="text" value={currentTag.jsonPath ?? ''} onChange={(e) => patch({ jsonPath: e.target.value })} placeholder="e.g. $.fields.temperature" />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>JSONPath expression to extract the value from the payload.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTag}>Save Mapping</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
