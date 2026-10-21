import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { Telemetry } from '../models/telemetry.model';

export class TelemetryService {
  private latestTelemetrySubject = new BehaviorSubject<Telemetry | null>(null);
  latestTelemetry$ = this.latestTelemetrySubject.asObservable();
  
  private isSimulating = false;
  private simulationSub?: Subscription;

  // Simple mock state for the simulation
  private mockState = {
    'CNC-01': { 'SpindleTemp': 95, 'SpindleSpeed': 2100, 'MachineState': 'RUNNING' },
    'CNC-02': { 'SpindleTemp': 90, 'SpindleSpeed': 2000 },
    'ROBOT-01': { 'MotorTemp': 80, 'MotorSpeed': 1500, 'RobotState': 'IDLE' }
  };

  constructor() { }

  getLatestTelemetry(): Observable<Telemetry | null> {
    return this.latestTelemetry$;
  }

  startSimulation() {
    if (this.isSimulating) return;
    this.isSimulating = true;
    
    // Emit a mock telemetry event every 2 seconds
    this.simulationSub = timer(0, 2000).subscribe(() => {
      const devices = Object.keys(this.mockState);
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      
      const tagsObj = (this.mockState as any)[randomDevice];
      const tags = Object.keys(tagsObj);
      const randomTag = tags[Math.floor(Math.random() * tags.length)];
      
      let currentValue = tagsObj[randomTag as keyof typeof tagsObj] as number | string;
      
      // Slightly fluctuate numeric values
      if (typeof currentValue === 'number') {
        const fluctuation = (Math.random() * 4) - 2; // -2 to +2
        currentValue = parseFloat((currentValue + fluctuation).toFixed(1));
        // Update state
        (this.mockState as any)[randomDevice][randomTag] = currentValue;
      }

      const telemetry: Telemetry = {
        deviceId: randomDevice,
        tag: randomTag,
        value: currentValue as any,
        quality: 'GOOD',
        timestamp: new Date()
      };
      
      this.latestTelemetrySubject.next(telemetry);
    });
  }

  stopSimulation() {
    this.isSimulating = false;
    if (this.simulationSub) {
      this.simulationSub.unsubscribe();
      this.simulationSub = undefined;
    }
  }

  isSimulationActive(): boolean {
    return this.isSimulating;
  }

  // Allow the UI to inject an abnormal value manually (e.g. SpindleTemp = 125)
  injectTelemetry(deviceId: string, tag: string, value: any) {
    if ((this.mockState as any)[deviceId]) {
      (this.mockState as any)[deviceId][tag] = value;
    }
    
    const telemetry: Telemetry = {
      deviceId,
      tag,
      value,
      quality: 'GOOD',
      timestamp: new Date()
    };
    this.latestTelemetrySubject.next(telemetry);
  }

  // Retrieve the latest known state for a specific tag
  getTagState(deviceId: string, tag: string): number | string | undefined {
    return (this.mockState as any)[deviceId]?.[tag];
  }
}

export const telemetryService = new TelemetryService();
