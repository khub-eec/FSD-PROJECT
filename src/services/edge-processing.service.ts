import { Observable } from 'rxjs';
import { RemoteCollection } from '../lib/remoteCollection';
import { EdgeWorkload } from '../models/edge-workload.model';

export class EdgeProcessingService extends RemoteCollection<EdgeWorkload> {
  workloads$ = this.items$;

  constructor() {
    super('/api/edge-workloads');
  }

  getWorkloads(): Observable<EdgeWorkload[]> {
    return this.workloads$;
  }

  addWorkload(workload: EdgeWorkload) {
    this.createOptimistic({ ...workload, id: `w${Date.now()}`, cpuMem: '0% / 0MB', status: 'Stopped' as const });
  }

  updateWorkload(workload: EdgeWorkload) {
    this.updateOptimistic({ ...workload });
  }

  deleteWorkload(id: string) {
    this.removeOptimistic(id);
  }

  toggleStatus(id: string) {
    const workload = this.value.find(w => w.id === id);
    if (!workload) return;

    const status = workload.status === 'Running' ? 'Stopped' : 'Running';
    // Mock some CPU/Mem usage change
    const cpuMem = status === 'Running'
      ? `${Math.floor(Math.random() * 5 + 1)}% / ${Math.floor(Math.random() * 30 + 10)}MB`
      : '0% / 0MB';
    this.updateOptimistic({ ...workload, status, cpuMem });
  }
}

export const edgeProcessingService = new EdgeProcessingService();
