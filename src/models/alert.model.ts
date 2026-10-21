export interface Alert {
  id: string;
  ruleId?: string;
  deviceId: string;
  tag?: string;
  message: string;
  actualValue: string | number;
  threshold: string | number;
  severity: string;
  createdAt: Date;
  status: 'Active' | 'Resolved';
  actionType?: string;
  questionnaireId?: string;
}
