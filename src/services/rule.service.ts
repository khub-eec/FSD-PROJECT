import { BehaviorSubject, Observable, Subscription, of, timer } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { api } from '../lib/api';
import { Rule } from '../models/rule.model';
import { Alert } from '../models/alert.model';
import { AlertService, alertService } from './alert.service';

export class RuleService {
  private rulesPath = '/api/rules';
  private eventsPath = '/api/events';

  private rulesSubject = new BehaviorSubject<Rule[]>([]);
  rules$ = this.rulesSubject.asObservable();

  private eventsPollSub?: Subscription;
  private knownEventIds = new Set<string>();

  constructor(private alertService: AlertService) {
    this.loadRules();

    // Poll for events from backend
    this.eventsPollSub = timer(0, 5000).subscribe(() => this.pollEvents());
  }

  destroy() {
    this.eventsPollSub?.unsubscribe();
  }

  private loadRules() {
    api.get<Rule[]>(this.rulesPath).subscribe({
      next: (rules) => this.rulesSubject.next(rules),
      error: (err) => console.error('Error loading rules', err)
    });
  }

  private pollEvents() {
    api.get<any[]>(this.eventsPath).subscribe({
      next: (events) => {
        for (const ev of events) {
          if (!this.knownEventIds.has(ev.id)) {
            this.knownEventIds.add(ev.id);

            // Create a frontend alert for this event
            const newAlert: Alert = {
                id: ev.id,
                ruleId: ev.ruleId,
                deviceId: 'N/A', // From payload if parsed
                tag: 'N/A',
                message: `Rule "${ev.ruleName}" triggered!`,
                actualValue: 0,
                threshold: 0,
                severity: 'HIGH',
                createdAt: new Date(ev.timestamp),
                status: 'Active',
                questionnaireId: ev.questionnaireId ?? undefined
            };
            this.alertService.addAlert(newAlert);
          }
        }
      },
      error: (err) => console.error('Error polling events', err)
    });
  }

  getRules(): Observable<Rule[]> {
    return this.rules$;
  }

  getRule(id: string): Observable<Rule | undefined> {
    return api.get<Rule>(`${this.rulesPath}/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  createRule(rule: Rule): Observable<any> {
    return api.post(this.rulesPath, rule).pipe(
      tap(() => this.loadRules())
    );
  }

  updateRule(updatedRule: Rule): Observable<any> {
    return api.put(`${this.rulesPath}/${updatedRule.id}`, updatedRule).pipe(
      tap(() => this.loadRules())
    );
  }

  deleteRule(id: string): Observable<any> {
    return api.delete(`${this.rulesPath}/${id}`).pipe(
      tap(() => this.loadRules())
    );
  }

  enableRule(id: string): Observable<any> {
    const rules = this.rulesSubject.value;
    const rule = rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = true;
      return this.updateRule(rule);
    }
    return of(false);
  }

  disableRule(id: string): Observable<any> {
    const rules = this.rulesSubject.value;
    const rule = rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = false;
      return this.updateRule(rule);
    }
    return of(false);
  }
}

export const ruleService = new RuleService(alertService);
