export interface Device {
  id: string;
  name: string;
  protocol: string;
  broker?: string;
  port?: number;
  topic?: string;
  enabled: boolean;
  status: 'Online' | 'Offline' | 'Warning';
  lastSeen?: Date;
  qos?: number;
  keepAlive?: number;
  lwtEnabled?: boolean;
  parameters?: string[];
}
