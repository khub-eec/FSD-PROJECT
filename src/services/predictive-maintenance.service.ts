import { RemoteCollection } from '../lib/remoteCollection';

export interface PredictiveModel {
  id: string;
  name: string;
  target: string;
  version: string;
  status: 'Running' | 'Training' | 'Stopped';
  confidence: string;
  lastUpdated: Date;
  anomalyScore: number;
}

export class PredictiveMaintenanceService extends RemoteCollection<PredictiveModel> {
  models$ = this.items$;

  constructor() {
    super('/api/predictive-models');
  }

  addModel(model: PredictiveModel) {
    this.createOptimistic({ ...model, id: `pm-${Date.now()}`, lastUpdated: new Date(), anomalyScore: Math.random() * 0.5 });
  }

  deleteModel(id: string) {
    this.removeOptimistic(id);
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceService();
