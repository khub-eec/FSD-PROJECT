import { Observable, Subject, timer } from 'rxjs';
import { addEvent, countSimulatedMessage, enabledRules } from '../lib/mockDb';

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/**
 * Live telemetry feed for the frontend-only demo.
 * Publishes a simulated motor reading every second (the same shape the real broker relayed),
 * and every 40 seconds simulates a rule firing so new alerts appear on the Alerts page.
 * (The file keeps its original name so the pages need no changes.)
 */
export class SignalrService {
  private telemetrySubject = new Subject<{ topic: string; payload: any }>();
  public telemetry$: Observable<{ topic: string; payload: any }> = this.telemetrySubject.asObservable();
  private readingsCount = 84920;

  constructor() {
    timer(500, 1000).subscribe(() => this.publishMotorReading());
    timer(20000, 40000).subscribe(() => this.simulateRuleTrigger());
  }

  private publishMotorReading() {
    this.readingsCount++;
    countSimulatedMessage();
    this.telemetrySubject.next({
      topic: 'factory/motor/MTR-001/data',
      payload: {
        measurement: 'motor_telemetry',
        tags: { machine_id: 'MTR-001', location: 'line_2', sensor_type: 'vibration_power' },
        fields: {
          voltage_l_n: round(230 + Math.random() * 2, 1),
          current: round(7.2 + Math.random() * 0.3, 2),
          active_power: round(4.2 + Math.random() * 0.2, 2),
          power_factor: 0.894,
          frequency: round(49.9 + Math.random() * 0.1, 2),
          total_kwh: 62289.0 + this.readingsCount * 0.001,
          kvar: 0.632,
          kva: 4.821,
          rpm: Math.round(1218 + (Math.random() - 0.5) * 10),
          readings_count: this.readingsCount,
          vibration_x_rms: round(0.9 + Math.random() * 0.1, 2),
          vibration_velocity: round(1.3 + Math.random() * 0.2, 3),
          vibration_acceleration: round(0.09 + Math.random() * 0.02, 4),
          vibration_displacement: round(11.9 + Math.random() * 0.5, 2),
          dom_freq: 67.8,
        },
        Timestamp: new Date().toISOString(),
      },
    });
  }

  private simulateRuleTrigger() {
    const rules = enabledRules();
    if (rules.length === 0) return;
    const rule = rules[Math.floor(Math.random() * rules.length)];
    addEvent({
      ruleId: rule.id,
      ruleName: rule.name,
      questionnaireId: rule.actions?.[0]?.questionnaireId,
      payload: JSON.stringify({ simulated: true }),
    });
  }
}

export const signalrService = new SignalrService();
