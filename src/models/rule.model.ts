export interface RuleCondition {
  deviceId: string;
  tag: string;
  operator: string;
  value: number;
  not: boolean;
  unit?: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  actionType: string;
  severity: string;
  notification: string;
  questionnaireId?: string; // For Questionnaire triggers
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  type: string;
  conditions: RuleCondition[];
  logicalOperator: 'AND' | 'OR';
  action: string; // Keep for legacy
  actions?: RuleAction[];
  priority?: string;
  enabled: boolean;
  status?: string; // e.g. Active, Disabled, Triggered
  
  // Optional legacy fields for backward compatibility/migration
  deviceId?: string;
  tag?: string;
  operator?: string;
  value?: number;
}
