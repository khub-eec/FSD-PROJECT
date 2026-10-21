import { BehaviorSubject, timer } from 'rxjs';

export interface SimulationState {
  mqttThroughput: number;
  cpuUsage: number;
  memUsage: number;
  uptimeSeconds: number;
  bufferSize: number;
  anomalyScores: { [modelId: string]: number };
  systemHealth: number;
  mockLogs: string[];
}

export class SimulationService {
  private state: SimulationState = {
    mqttThroughput: 3450,
    cpuUsage: 2.4,
    memUsage: 48,
    uptimeSeconds: 1234500, // ~14 days
    bufferSize: 120,
    anomalyScores: {
      'pm1': 0.12,
      'pm2': 0.45,
      'pm4': 0.82
    },
    systemHealth: 98,
    mockLogs: [
      '[10:01:23] INFO: Connected to broker tcp://10.0.5.21:1883',
      '[10:01:25] DEBUG: MQTT SUB factory/#'
    ]
  };

  private stateSubject = new BehaviorSubject<SimulationState>(this.state);
  state$ = this.stateSubject.asObservable();

  constructor() {
    timer(0, 1000).subscribe(() => this.tick());
  }

  private tick() {
    // Fluctuate throughput
    this.state.mqttThroughput = Math.max(0, this.state.mqttThroughput + (Math.random() * 200 - 100));
    
    // Fluctuate CPU
    this.state.cpuUsage = Math.max(0.5, Math.min(100, this.state.cpuUsage + (Math.random() * 1 - 0.5)));
    
    // Fluctuate Mem
    this.state.memUsage = Math.max(20, Math.min(500, this.state.memUsage + (Math.random() * 4 - 2)));
    
    // Fluctuate Buffer
    this.state.bufferSize = Math.max(0, Math.min(10000, this.state.bufferSize + Math.floor(Math.random() * 50 - 25)));
    
    // Uptime
    this.state.uptimeSeconds += 1;

    // Anomaly Scores
    for (const key in this.state.anomalyScores) {
      this.state.anomalyScores[key] = Math.max(0, Math.min(1, this.state.anomalyScores[key] + (Math.random() * 0.04 - 0.02)));
    }

    // System Health (OEE)
    this.state.systemHealth = Math.max(80, Math.min(100, this.state.systemHealth + (Math.random() * 0.6 - 0.3)));

    // Mock logs
    if (Math.random() > 0.7) {
      const topics = ['factory/line1/motor1', 'factory/hvac/unitA', 'logistics/agv/04', 'facility/env/temp1'];
      const top = topics[Math.floor(Math.random() * topics.length)];
      const val = (Math.random() * 100).toFixed(2);
      const time = new Date().toLocaleTimeString();
      this.state.mockLogs.push(`[${time}] RECV: ${top} payload={"val":${val}}`);
      if (this.state.mockLogs.length > 50) {
        this.state.mockLogs.shift();
      }
    }

    this.stateSubject.next({ ...this.state });
  }
}

export const simulationService = new SimulationService();
