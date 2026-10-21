import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { api } from './api';

/**
 * A list of records kept in MongoDB behind a REST collection (`/api/<path>`), mirrored in a
 * BehaviorSubject for the UI.
 *
 * - `create` / `update` / `remove` wait for the server and update the list from its response.
 * - the `*Optimistic` variants update the list immediately and sync in the background,
 *   reloading from the server if the request fails.
 */
export class RemoteCollection<T extends { id: string }> {
  protected readonly subject = new BehaviorSubject<T[]>([]);
  readonly items$: Observable<T[]> = this.subject.asObservable();

  constructor(protected readonly path: string) {
    this.reload();
  }

  get value(): T[] {
    return this.subject.value;
  }

  reload(): void {
    api.get<T[]>(this.path).subscribe({
      next: (items) => this.subject.next(items),
      error: (err) => console.error(`Error loading ${this.path}`, err),
    });
  }

  create(item: T, { prepend = false } = {}): Observable<T> {
    return api.post<T>(this.path, item).pipe(
      tap((created) => this.subject.next(prepend ? [created, ...this.value] : [...this.value, created]))
    );
  }

  update(item: T): Observable<T> {
    return api.put<T>(`${this.path}/${item.id}`, item).pipe(
      tap((updated) => this.subject.next(this.value.map((x) => (x.id === updated.id ? updated : x))))
    );
  }

  remove(id: string): Observable<void> {
    return api.delete(`${this.path}/${id}`).pipe(
      tap(() => this.subject.next(this.value.filter((x) => x.id !== id)))
    );
  }

  createOptimistic(item: T, { prepend = false } = {}): void {
    this.subject.next(prepend ? [item, ...this.value] : [...this.value, item]);
    this.sync(api.post<T>(this.path, item));
  }

  updateOptimistic(item: T): void {
    this.subject.next(this.value.map((x) => (x.id === item.id ? item : x)));
    this.sync(api.put<T>(`${this.path}/${item.id}`, item));
  }

  removeOptimistic(id: string): void {
    this.subject.next(this.value.filter((x) => x.id !== id));
    this.sync(api.delete(`${this.path}/${id}`));
  }

  /** Fire-and-forget request; the local list is reconciled with the server if it fails. */
  protected sync(request: Observable<unknown>): void {
    request.subscribe({
      error: (err) => {
        console.error(`Error saving ${this.path}`, err);
        this.reload();
      },
    });
  }
}
