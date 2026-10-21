import { BehaviorSubject, Observable, timer } from 'rxjs';

// MotorTelemetry is now used by realtime-analysis but data comes from SignalR
export interface MotorTelemetry {
  measurement: string;
  tags: {
    machine_id: string;
    location: string;
    sensor_type: string;
  };
  fields: {
    voltage_l_n: number;
    current: number;
    active_power: number;
    power_factor: number;
    frequency: number;
    total_kwh: number;
    kvar: number;
    kva: number;
    rpm: number;
    readings_count: number;
    vibration_x_rms: number;
    vibration_velocity: number;
    vibration_acceleration: number;
    vibration_displacement: number;
    dom_freq: number;
  };
  timestamp: string;
}

export interface MqttBrokerStats {
  brokerUrl: string;
  connectedClients: number;
  messagesPerSecond: number;
  activeTopics: number;
  uptime: number; // in seconds
  networkLatency: number; // in ms
  webSocketUrl: string;
}

export class MqttMockService {
  private statsSubject = new BehaviorSubject<MqttBrokerStats>(this.generateInitialStats());
  brokerStats$: Observable<MqttBrokerStats> = this.statsSubject.asObservable();

  private uptime = 12054; // Starts at some uptime

  constructor() {
    // Broker stats ticker
    timer(0, 2000).subscribe(() => {
      this.statsSubject.next(this.generateBrokerStats());
    });
  }

  private generateInitialStats(): MqttBrokerStats {
    return {
      brokerUrl: 'tcp://broker.emqx.io:1883',
      connectedClients: 42,
      messagesPerSecond: 1250,
      activeTopics: 18,
      uptime: this.uptime,
      networkLatency: 45,
      webSocketUrl: 'ws://broker.emqx.io:8083/mqtt'
    };
  }

  private generateBrokerStats(): MqttBrokerStats {
    this.uptime += 2;
    const baseClients = 42;
    const baseTopics = 18;
    
    return {
      brokerUrl: 'tcp://broker.emqx.io:1883',
      connectedClients: baseClients + Math.floor(Math.random() * 5 - 2),
      messagesPerSecond: 1250 + Math.floor(Math.random() * 150 - 75),
      activeTopics: baseTopics + Math.floor(Math.random() * 3 - 1),
      uptime: this.uptime,
      networkLatency: 45 + Math.floor(Math.random() * 10 - 5),
      webSocketUrl: 'ws://broker.emqx.io:8083/mqtt'
    };
  }

}

export const mqttMockService = new MqttMockService();
