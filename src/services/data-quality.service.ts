import { BehaviorSubject } from 'rxjs';
import { api } from '../lib/api';

export interface DataQualityException {
  id: string;
  time: string;
  topic: string;
  rule: string;
  action: string;
  type: string;
}

export interface ValidationSchema {
  topicPattern: string;
  requiredFields: string;
}

export class DataQualityService {
  private exceptionsSubject = new BehaviorSubject<DataQualityException[]>([]);
  private schemasSubject = new BehaviorSubject<ValidationSchema[]>([]);

  exceptions$ = this.exceptionsSubject.asObservable();
  schemas$ = this.schemasSubject.asObservable();

  constructor() {
    this.reload();
  }

  private reload() {
    api.get<DataQualityException[]>('/api/data-quality/exceptions').subscribe({
      next: (items) => this.exceptionsSubject.next(items),
      error: (err) => console.error('Error loading data quality exceptions', err),
    });
    api.get<ValidationSchema[]>('/api/data-quality/schemas').subscribe({
      next: (items) => this.schemasSubject.next(items),
      error: (err) => console.error('Error loading validation schemas', err),
    });
  }

  clearExceptions() {
    this.exceptionsSubject.next([]);
    api.delete('/api/data-quality/exceptions').subscribe({ error: () => this.reload() });
  }

  saveSchemas(schemas: ValidationSchema[]) {
    this.schemasSubject.next([...schemas]);
    api.put<ValidationSchema[]>('/api/data-quality/schemas', schemas).subscribe({
      next: (saved) => this.schemasSubject.next(saved),
      error: () => this.reload(),
    });
  }
}

export const dataQualityService = new DataQualityService();
