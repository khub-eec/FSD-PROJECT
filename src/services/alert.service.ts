import { Observable } from 'rxjs';
import { api } from '../lib/api';
import { RemoteCollection } from '../lib/remoteCollection';
import { Alert } from '../models/alert.model';

export class AlertService extends RemoteCollection<Alert> {
  alerts$ = this.items$;

  constructor() {
    super('/api/alerts');
  }

  getAlerts(): Observable<Alert[]> {
    return this.alerts$;
  }

  getAlert(id: string): Alert | undefined {
    return this.value.find(a => a.id === id);
  }

  addAlert(alert: Alert) {
    if (this.getAlert(alert.id)) return;
    this.subject.next([alert, ...this.value]);
    api.post<Alert>(this.path, alert).subscribe({
      // 409: the alert was already stored (e.g. before a page reload), so just resync
      error: () => this.reload(),
    });
  }

  resolveAlert(id: string) {
    const alert = this.getAlert(id);
    if (alert) this.updateOptimistic({ ...alert, status: 'Resolved' });
  }

  acknowledgeAll() {
    this.subject.next(this.value.map(a => (a.status === 'Active' ? { ...a, status: 'Resolved' as const } : a)));
    api.post<Alert[]>(`${this.path}/acknowledge-all`).subscribe({
      next: (alerts) => this.subject.next(alerts),
      error: () => this.reload(),
    });
  }
}

export const alertService = new AlertService();
