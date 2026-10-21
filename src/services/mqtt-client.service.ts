import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface MqttMessage {
  topic: string;
  payload: any;
  qos: number;
  retain: boolean;
  timestamp: Date;
}

export interface MqttConnectionOptions {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  clean?: boolean;
  reconnectPeriod?: number;
  connectTimeout?: number;
  keepalive?: number;
  will?: { topic: string; payload: string; qos: 0 | 1 | 2; retain: boolean };
}

export interface MqttConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  brokerUrl: string;
  clientId: string;
  connectedAt?: Date;
  lastError?: string;
  messagesReceived: number;
  messagesSent: number;
}

const EMPTY_STATE: MqttConnectionState = { status: 'disconnected', brokerUrl: '', clientId: '', messagesReceived: 0, messagesSent: 0 };

/**
 * Simulated MQTT client for the frontend-only demo. No network connection is made:
 * connect() succeeds after a short delay when a broker URL and user name are given,
 * and published messages are looped back to matching subscriptions.
 */
export class MqttClientService {
  private connected = false;
  private messageSubject = new Subject<MqttMessage>();
  public messages$: Observable<MqttMessage> = this.messageSubject.asObservable();
  private stateSubject = new BehaviorSubject<MqttConnectionState>(EMPTY_STATE);
  public state$: Observable<MqttConnectionState> = this.stateSubject.asObservable();
  private subscriptions = new Map<string, Set<(msg: MqttMessage) => void>>();

  connect(options: MqttConnectionOptions): Promise<void> {
    const clientId = options.clientId || `idacs_${Math.random().toString(36).slice(2, 11)}`;
    this.updateState({ ...EMPTY_STATE, status: 'connecting', brokerUrl: options.brokerUrl, clientId });
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!options.brokerUrl || !options.username) {
          const message = 'Not authorized: user name and password are required (simulated broker)';
          this.updateState({ status: 'error', lastError: message });
          reject(new Error(message));
          return;
        }
        this.connected = true;
        this.updateState({ status: 'connected', connectedAt: new Date(), lastError: undefined });
        resolve();
      }, 800);
    });
  }

  disconnect(): void {
    this.connected = false;
    this.subscriptions.clear();
    this.stateSubject.next(EMPTY_STATE);
  }

  subscribe(topic: string, _qos: 0 | 1 | 2 = 0): Observable<MqttMessage> {
    const subject = new Subject<MqttMessage>();
    if (!this.subscriptions.has(topic)) this.subscriptions.set(topic, new Set());
    this.subscriptions.get(topic)!.add((msg) => subject.next(msg));
    return subject.asObservable();
  }

  unsubscribe(topic: string): Promise<void> {
    this.subscriptions.delete(topic);
    return Promise.resolve();
  }

  publish(topic: string, payload: any, qos: 0 | 1 | 2 = 0, retain = false): Promise<void> {
    if (!this.connected) return Promise.reject(new Error('Not connected'));
    const state = this.stateSubject.value;
    this.updateState({ messagesSent: state.messagesSent + 1 });
    const message: MqttMessage = { topic, payload, qos, retain, timestamp: new Date() };
    setTimeout(() => this.deliver(message), 50);
    return Promise.resolve();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionState(): MqttConnectionState {
    return this.stateSubject.value;
  }

  private deliver(message: MqttMessage): void {
    let matched = false;
    for (const [pattern, callbacks] of this.subscriptions) {
      if (this.topicMatches(pattern, message.topic)) {
        matched = true;
        callbacks.forEach((cb) => cb(message));
      }
    }
    if (matched) {
      this.updateState({ messagesReceived: this.stateSubject.value.messagesReceived + 1 });
      this.messageSubject.next(message);
    }
  }

  private topicMatches(pattern: string, topic: string): boolean {
    const p = pattern.split('/');
    const t = topic.split('/');
    for (let i = 0; i < p.length; i++) {
      if (p[i] === '#') return true;
      if (p[i] !== '+' && p[i] !== t[i]) return false;
    }
    return p.length === t.length;
  }

  private updateState(partial: Partial<MqttConnectionState>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partial });
  }
}

export const mqttClientService = new MqttClientService();
