/**
 * In-browser mock database for the frontend-only demo.
 * Collections start from the dummy data in src/data/seed.ts and are saved to localStorage,
 * so changes survive a page reload. Call resetDemoData() to go back to the original data.
 */
import * as seed from '../data/seed';

type Doc = Record<string, any> & { id?: string };

const STORAGE_KEY = 'idacs-demo-db-v1';

const initialCollections = (): Record<string, Doc[]> => ({
  devices: clone(seed.devices),
  tags: clone(seed.tags),
  connections: clone(seed.connections),
  rules: clone(seed.rules),
  questionnaires: clone(seed.questionnaires),
  alerts: clone(seed.alerts),
  'edge-workloads': clone(seed.edgeWorkloads),
  'predictive-models': clone(seed.predictiveModels),
  events: [],
  'data-quality/exceptions': clone(seed.dataQualityExceptions),
  'data-quality/schemas': clone(seed.validationSchemas),
});

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function load(): Record<string, Doc[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialCollections(), ...JSON.parse(raw) };
  } catch {
    // Storage blocked or corrupt: fall back to the dummy data.
  }
  return initialCollections();
}

const db = load();

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore: the demo still works in memory.
  }
}

export function resetDemoData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.location.reload();
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class MockHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const startedAt = Date.now();
let simulatedMessages = 0;
export const countSimulatedMessage = () => simulatedMessages++;

/** Handles a REST-style request the same way the real Express API did. */
export function handleRequest(method: string, url: string, body?: any): any {
  const path = url.replace(/^\/api\//, '').replace(/^\//, '').split('?')[0];

  if (path === 'mqtt/stats' || path === 'health/mqtt') {
    const uptime = Math.floor((Date.now() - startedAt) / 1000);
    if (path === 'health/mqtt') return 'Healthy';
    return {
      brokerUrl: 'tcp://localhost:1883 (simulated)',
      webSocketUrl: 'ws://localhost:9001/mqtt (simulated)',
      connectedClients: 3,
      messagesPerSecond: uptime > 0 ? Math.floor(simulatedMessages / uptime) : 0,
      activeTopics: 1,
      uptime,
      networkLatency: 0,
    };
  }

  if (path === 'alerts/acknowledge-all' && method === 'POST') {
    db.alerts.forEach((a) => a.status === 'Active' && (a.status = 'Resolved'));
    save();
    return sortAlerts(db.alerts);
  }

  // Whole-list endpoints (no ids)
  if (path === 'data-quality/schemas') {
    if (method === 'PUT') {
      if (!Array.isArray(body)) throw new MockHttpError(400, 'Expected an array of schemas');
      db[path] = body.map(({ topicPattern, requiredFields }: Doc) => ({ topicPattern, requiredFields }));
      save();
    }
    return db[path];
  }
  if (path === 'data-quality/exceptions') {
    if (method === 'DELETE') {
      db[path] = [];
      save();
      return undefined;
    }
    return db[path];
  }

  const [collection, id] = splitPath(path);
  const list = db[collection];
  if (!list) throw new MockHttpError(404, `Unknown endpoint /api/${path}`);

  switch (method) {
    case 'GET':
      if (!id) return collection === 'alerts' ? sortAlerts(list) : list;
      return findOr404(list, id);
    case 'POST': {
      const doc = { ...body, id: body?.id || newId() };
      if (list.some((x) => x.id === doc.id)) throw new MockHttpError(409, 'A record with this id already exists');
      list.push(doc);
      save();
      return doc;
    }
    case 'PUT': {
      const index = list.findIndex((x) => x.id === id);
      if (index < 0) throw new MockHttpError(404, 'Not found');
      list[index] = { ...body, id };
      save();
      return list[index];
    }
    case 'DELETE': {
      const index = list.findIndex((x) => x.id === id);
      if (index < 0) throw new MockHttpError(404, 'Not found');
      list.splice(index, 1);
      save();
      return undefined;
    }
    default:
      throw new MockHttpError(405, 'Method not allowed');
  }
}

/** Records a rule firing, like the backend rule engine did. */
export function addEvent(event: Doc): void {
  db.events.push({ id: newId(), timestamp: new Date().toISOString(), ...event });
  if (db.events.length > 200) db.events.splice(0, db.events.length - 200);
  save();
}

export const enabledRules = () => db.rules.filter((r) => r.enabled);

function splitPath(path: string): [string, string | undefined] {
  const parts = path.split('/');
  return parts.length > 1 ? [parts.slice(0, -1).join('/'), decodeURIComponent(parts[parts.length - 1])] : [parts[0], undefined];
}

function findOr404(list: Doc[], id: string): Doc {
  const doc = list.find((x) => x.id === id);
  if (!doc) throw new MockHttpError(404, 'Not found');
  return doc;
}

function sortAlerts(list: Doc[]): Doc[] {
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
