export interface Connection {
  id: string;
  name: string;
  type: 'Protocol' | 'Vendor' | 'Cloud';
  protocol: string;
  details: any; // Flexible for different protocols (e.g. MQTT broker, Modbus IP)
  status: 'Connected' | 'Error' | 'Offline';
  lastTested?: Date;
}
