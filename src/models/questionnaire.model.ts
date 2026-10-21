export type QuestionType = 'TEXT' | 'NUMBER' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'YES_NO';

export interface QuestionnaireOption {
  id: string;
  label: string;
  value: any;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionnaireOption[]; // For choice-based questions
  required: boolean;
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}
