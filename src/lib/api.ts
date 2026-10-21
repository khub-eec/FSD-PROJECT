import { Observable, from } from 'rxjs';
import { MockHttpError, handleRequest } from './mockDb';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Simulated network delay so loading states behave like a real API. */
const LATENCY_MS = 150;

/**
 * Frontend-only demo: every request is answered by the in-browser mock database
 * (src/lib/mockDb.ts) instead of a real server.
 */
async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const method = init?.method ?? 'GET';
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  try {
    const body = init?.body === undefined ? undefined : JSON.parse(JSON.stringify(init.body));
    const result = handleRequest(method, path, body);
    return (result === undefined ? undefined : JSON.parse(JSON.stringify(result))) as T;
  } catch (err) {
    const status = err instanceof MockHttpError ? err.status : 500;
    throw new ApiError(`${method} ${path} failed: ${status}`, status);
  }
}

/** Small HTTP-style client returning Observables. */
export const api = {
  get: <T>(path: string): Observable<T> => from(request<T>(path)),
  post: <T>(path: string, body?: unknown): Observable<T> => from(request<T>(path, { method: 'POST', body })),
  put: <T>(path: string, body: unknown): Observable<T> => from(request<T>(path, { method: 'PUT', body })),
  delete: <T = void>(path: string): Observable<T> => from(request<T>(path, { method: 'DELETE' })),
};
