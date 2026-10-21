import { useState } from 'react';
import './QuestionnaireBuilder.css';
import type { Questionnaire, Question, QuestionType } from '../models/questionnaire.model';
import { questionnaireService } from '../services/questionnaire.service';
import { useObservable } from '../hooks/useObservable';
import { formatDate } from '../lib/format';

export default function QuestionnaireBuilder() {
  const questionnaires = useObservable<Questionnaire[]>(questionnaireService.getQuestionnaires(), []);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');

  const createNew = () => {
    setSelectedQuestionnaire({
      id: '',
      title: 'New Questionnaire',
      description: '',
      questions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setViewMode('edit');
  };

  const editQuestionnaire = (q: Questionnaire) => {
    setSelectedQuestionnaire(JSON.parse(JSON.stringify(q)));
    setViewMode('edit');
  };

  const deleteQuestionnaire = (id: string) => {
    if (confirm('Are you sure you want to delete this questionnaire?')) {
      questionnaireService.deleteQuestionnaire(id).subscribe();
    }
  };

  const saveQuestionnaire = () => {
    if (selectedQuestionnaire) {
      if (selectedQuestionnaire.id) {
        questionnaireService.updateQuestionnaire(selectedQuestionnaire).subscribe(() => {
          setViewMode('list');
        });
      } else {
        questionnaireService.addQuestionnaire(selectedQuestionnaire).subscribe(() => {
          setViewMode('list');
        });
      }
    }
  };

  const cancelEdit = () => {
    setSelectedQuestionnaire(null);
    setViewMode('list');
  };

  const patchQuestionnaire = (patch: Partial<Questionnaire>) =>
    setSelectedQuestionnaire(prev => (prev ? { ...prev, ...patch } : prev));

  const updateQuestions = (fn: (qs: Question[]) => Question[]) =>
    setSelectedQuestionnaire(prev => (prev ? { ...prev, questions: fn(prev.questions) } : prev));

  const updateQuestion = (i: number, fn: (q: Question) => Question) =>
    updateQuestions(qs => qs.map((q, idx) => (idx === i ? fn(q) : q)));

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: 'New Question',
      type: 'TEXT',
      required: false
    };
    updateQuestions(qs => [...qs, newQuestion]);
  };

  const removeQuestion = (index: number) => updateQuestions(qs => qs.filter((_, i) => i !== index));

  const addOption = (qi: number) =>
    updateQuestion(qi, q => ({
      ...q,
      options: [...(q.options ?? []), { id: `opt_${Date.now()}`, label: 'Option', value: 'option' }]
    }));

  const removeOption = (qi: number, index: number) =>
    updateQuestion(qi, q => (q.options ? { ...q, options: q.options.filter((_, i) => i !== index) } : q));

  const updateOption = (qi: number, oi: number, patch: { label?: string; value?: string }) =>
    updateQuestion(qi, q => ({
      ...q,
      options: q.options?.map((o, i) => (i === oi ? { ...o, ...patch } : o))
    }));

  const changeQuestionType = (qi: number, type: QuestionType) =>
    updateQuestion(qi, q => {
      const next: Question = { ...q, type };
      if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
        if (!next.options || next.options.length === 0) {
          next.options = [{ id: `opt_${Date.now()}`, label: 'Option 1', value: 'option1' }];
        }
      } else {
        delete next.options;
      }
      return next;
    });

  return (
    <div className="qb-page">
      <div className="qb-header">
        <div>
          <h2 className="qb-title">Questionnaire Builder</h2>
          <p className="qb-subtitle">Design dynamic data collection forms and diagnostics templates.</p>
        </div>
        {viewMode === 'list' && (
          <div>
            <button className="qb-btn qb-btn-primary" onClick={createNew}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Questionnaire
            </button>
          </div>
        )}
        {viewMode === 'edit' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="qb-btn qb-btn-secondary" onClick={cancelEdit}>Discard</button>
            <button className="qb-btn qb-btn-primary" onClick={saveQuestionnaire}>Save Questionnaire</button>
          </div>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div>
          <div className="qb-card">
            <table className="qb-table">
              <thead>
                <tr>
                  <th>Title &amp; Description</th>
                  <th>Questions</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questionnaires.map(q => (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--qb-text-main)', marginBottom: 4 }}>{q.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--qb-text-muted)' }}>{q.description || 'No description provided.'}</div>
                    </td>
                    <td><span className="qb-badge">{q.questions.length}</span></td>
                    <td style={{ color: 'var(--qb-text-muted)', fontSize: 13 }}>{formatDate(q.updatedAt, 'medium')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="qb-btn qb-btn-secondary" onClick={() => editQuestionnaire(q)} style={{ marginRight: 8, padding: '6px 12px', fontSize: 12 }}>Edit</button>
                      <button className="qb-btn qb-btn-danger-ghost" onClick={() => deleteQuestionnaire(q.id)} style={{ padding: '6px 12px', fontSize: 12 }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {questionnaires.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--qb-text-muted)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.5, marginBottom: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      <div>No questionnaires found. Create your first one to get started.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Create View */}
      {viewMode === 'edit' && selectedQuestionnaire && (
        <div className="qb-editor-layout">
          {/* Left Sidebar: Settings */}
          <div className="qb-card" style={{ padding: 24, position: 'sticky', top: 32 }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: 16, fontWeight: 700 }}>Questionnaire Settings</h3>

            <div className="qb-form-group">
              <label className="qb-label">Internal Title</label>
              <input type="text" className="qb-input" value={selectedQuestionnaire.title} onChange={e => patchQuestionnaire({ title: e.target.value })} placeholder="e.g. Machine Diagnostics" />
            </div>

            <div className="qb-form-group" style={{ marginBottom: 0 }}>
              <label className="qb-label">Description / Instructions</label>
              <textarea className="qb-textarea" value={selectedQuestionnaire.description} onChange={e => patchQuestionnaire({ description: e.target.value })} placeholder="Provide context for the operator..."></textarea>
            </div>
          </div>

          {/* Right Area: Questions Builder */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Form Schema</h3>
              <button className="qb-btn qb-btn-secondary" onClick={addQuestion}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Question
              </button>
            </div>

            {selectedQuestionnaire.questions.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--qb-text-muted)', border: '2px dashed var(--qb-border)', borderRadius: 'var(--qb-radius-lg)', background: 'white' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>The form is currently empty.</div>
                <div>Click "Add Question" to start building your schema.</div>
              </div>
            )}

            <div className="qb-question-list">
              {selectedQuestionnaire.questions.map((question, i) => (
                <div key={question.id} className="qb-question-card">
                  <div className="qb-question-header">
                    <div className="qb-question-number">Question {i + 1}</div>
                    <div className="qb-question-actions">
                      <button className="qb-btn qb-btn-danger-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => removeQuestion(i)}>Remove</button>
                    </div>
                  </div>

                  <div className="qb-form-group">
                    <input type="text" className="qb-input" style={{ fontSize: 16, fontWeight: 600, padding: '12px 16px' }} value={question.text} onChange={e => updateQuestion(i, q => ({ ...q, text: e.target.value }))} placeholder="Enter your question here" />
                  </div>

                  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
                    <div className="qb-form-group" style={{ flex: 1, margin: 0 }}>
                      <label className="qb-label">Response Type</label>
                      <select className="qb-select" value={question.type} onChange={e => changeQuestionType(i, e.target.value as QuestionType)}>
                        <option value="TEXT">Short Text Input</option>
                        <option value="NUMBER">Numeric Input</option>
                        <option value="YES_NO">Yes / No Toggle</option>
                        <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</option>
                      </select>
                    </div>

                    <div style={{ paddingBottom: 12 }}>
                      <label className="qb-switch-wrapper">
                        <input type="checkbox" style={{ display: 'none' }} checked={question.required} onChange={e => updateQuestion(i, q => ({ ...q, required: e.target.checked }))} />
                        <div className="qb-switch"></div>
                        <span className="qb-switch-label">Required</span>
                      </label>
                    </div>
                  </div>

                  {/* Options Builder for Choice Types */}
                  {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && (
                    <div className="qb-options-builder">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <label className="qb-label" style={{ margin: 0 }}>Choice Options</label>
                      </div>

                      {question.options?.map((opt, j) => (
                        <div key={opt.id} className="qb-option-row">
                          <input type="text" className="qb-input" value={opt.label} onChange={e => updateOption(i, j, { label: e.target.value })} placeholder="Display Label" />
                          <input type="text" className="qb-input" value={opt.value ?? ''} onChange={e => updateOption(i, j, { value: e.target.value })} placeholder="Internal Value (optional)" />
                          <button className="qb-btn qb-btn-danger-ghost" style={{ padding: 8, width: 38, flexShrink: 0 }} onClick={() => removeOption(i, j)} disabled={question.options?.length === 1}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}

                      <button className="qb-btn qb-btn-secondary" style={{ marginTop: 12, fontSize: 12, padding: '6px 12px', borderStyle: 'dashed' }} onClick={() => addOption(i)}>
                        + Add Option
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
