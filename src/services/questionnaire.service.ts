import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { api } from '../lib/api';
import { Questionnaire } from '../models/questionnaire.model';

export class QuestionnaireService {
  private apiPath = '/api/questionnaires';

  private questionnairesSubject = new BehaviorSubject<Questionnaire[]>([]);
  questionnaires$ = this.questionnairesSubject.asObservable();

  constructor() {
    this.loadQuestionnaires();
  }

  private loadQuestionnaires() {
    api.get<Questionnaire[]>(this.apiPath).subscribe({
      next: (qs) => this.questionnairesSubject.next(qs),
      error: (err) => console.error('Error loading questionnaires', err)
    });
  }

  getQuestionnaires(): Observable<Questionnaire[]> {
    return this.questionnaires$;
  }

  getQuestionnaireById(id: string): Observable<Questionnaire | undefined> {
    return api.get<Questionnaire>(`${this.apiPath}/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  addQuestionnaire(questionnaire: Questionnaire): Observable<Questionnaire> {
    return api.post<Questionnaire>(this.apiPath, questionnaire).pipe(
      tap(() => this.loadQuestionnaires())
    );
  }

  updateQuestionnaire(questionnaire: Questionnaire): Observable<Questionnaire> {
    return api.put<Questionnaire>(`${this.apiPath}/${questionnaire.id}`, questionnaire).pipe(
      tap(() => this.loadQuestionnaires())
    );
  }

  deleteQuestionnaire(id: string): Observable<any> {
    return api.delete(`${this.apiPath}/${id}`).pipe(
      tap(() => this.loadQuestionnaires())
    );
  }
}

export const questionnaireService = new QuestionnaireService();
