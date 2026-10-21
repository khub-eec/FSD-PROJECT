import { alertService } from '../services/alert.service';
import { useObservable } from '../hooks/useObservable';
import { formatDate } from '../lib/format';
import type { Alert } from '../models/alert.model';

export default function AlertsNotifications() {
  const alerts = useObservable(alertService.alerts$, [] as Alert[]);

  const resolveAlert = (id: string) => alertService.resolveAlert(id);

  const acknowledgeAll = () => alertService.acknowledgeAll();

  const openQuestionnaire = (questionnaireId?: string) => {
    if (questionnaireId) {
      alert('In a real implementation, this would open a modal to fill out Questionnaire: ' + questionnaireId);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div className="row-between">
          <div>
            <h1>Alerts & Notifications</h1>
            <div className="page-sub">Active system alerts, warnings, and triggered events.</div>
          </div>
          <button className="btn" onClick={acknowledgeAll}>Acknowledge All</button>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Severity</th>
              <th>Message</th>
              <th>MQTT Topic / Node</th>
              <th>Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id}>
                <td className="mono">{formatDate(a.createdAt, 'short')}</td>
                <td>
                  <span className={`pill ${a.severity === 'HIGH' ? 'pill-offline' : 'pill-warning'}`}>
                    <span className="dot"></span>{a.severity}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{a.message}</td>
                <td>{a.deviceId}</td>
                <td className="mono" style={{ fontSize: 11 }}>
                  Value: <span style={{ color: 'var(--red)' }}>{a.actualValue}</span> (Threshold: {a.threshold})
                </td>
                <td style={{ color: a.status === 'Resolved' ? 'var(--text-muted)' : undefined }}>{a.status}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" disabled={a.status === 'Resolved'} onClick={() => resolveAlert(a.id)}>Ack</button>
                    {a.actionType === 'Trigger Questionnaire' && (
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ background: '#DC2626', borderColor: '#DC2626', color: 'white' }}
                        disabled={a.status === 'Resolved'}
                        onClick={() => openQuestionnaire(a.questionnaireId)}
                      >
                        Fill Questionnaire
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No alerts. System is normal.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
