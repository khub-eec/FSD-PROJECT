import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ruleService } from '../services/rule.service';
import { deviceService } from '../services/device.service';
import { tagService } from '../services/tag.service';
import { questionnaireService } from '../services/questionnaire.service';
import { useObservable } from '../hooks/useObservable';
import type { Rule, RuleCondition, RuleAction } from '../models/rule.model';
import type { Device } from '../models/device.model';
import type { Tag } from '../models/tag.model';
import type { Questionnaire } from '../models/questionnaire.model';

const EMPTY_RULES: Rule[] = [];
const EMPTY_DEVICES: Device[] = [];
const EMPTY_TAGS: Tag[] = [];
const EMPTY_QUESTIONNAIRES: Questionnaire[] = [];

const getEmptyRule = (): Partial<Rule> => ({
  name: '',
  description: '',
  type: 'THRESHOLD',
  conditions: [],
  logicalOperator: 'AND',
  action: 'Trigger Alert', // legacy
  actions: [],
  enabled: true,
  priority: 'High',
  status: 'Active'
});

const cardStyle: CSSProperties = { padding: 20, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const statCardStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const statIconBase: CSSProperties = { width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const statValueStyle: CSSProperties = { fontSize: 24, fontWeight: 700, color: '#0F172A' };
const statLabelStyle: CSSProperties = { fontSize: 13, color: '#64748B' };
const statDeltaLabelStyle: CSSProperties = { fontSize: 11, color: '#94A3B8' };
const pagerBtn: CSSProperties = { border: '1px solid #E2E8F0', background: 'white', borderRadius: 4, width: 24, height: 24, cursor: 'pointer' };
const addBtnStyle: CSSProperties = { marginTop: 8, fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#F1F5F9', color: '#475569', border: 'none', cursor: 'pointer' };
const rowCardStyle: CSSProperties = { background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 12, position: 'relative' };
const connectorStyle: CSSProperties = { position: 'absolute', left: -22, top: 20, width: 20, height: 2, background: '#DC2626' };
const removeBtnStyle: CSSProperties = { padding: 8, borderColor: '#FEE2E2', color: '#DC2626', background: '#FEF2F2' };
const iconBtnBase: CSSProperties = { padding: 4, border: '1px solid #E2E8F0', background: 'white', borderRadius: 4, cursor: 'pointer' };
const thStyle = (align: 'left' | 'center'): CSSProperties => ({ padding: '12px 8px', textAlign: align });

const tabStyle = (active: boolean): CSSProperties => ({
  paddingBottom: 12,
  fontWeight: 600,
  cursor: 'pointer',
  color: active ? '#DC2626' : '#64748B',
  borderBottom: active ? '2px solid #DC2626' : 'none'
});

export default function RuleEngine() {
  const rules = useObservable<Rule[]>(ruleService.getRules(), EMPTY_RULES);
  const allDevices = useObservable<Device[]>(deviceService.getDevices(), EMPTY_DEVICES);
  const allTags = useObservable<Tag[]>(tagService.getTags(), EMPTY_TAGS);
  const questionnaires = useObservable<Questionnaire[]>(questionnaireService.getQuestionnaires(), EMPTY_QUESTIONNAIRES);

  // Only include MQTT related devices for the Rule Engine
  const devices = useMemo(() => allDevices.filter(d => d.protocol?.toLowerCase() === 'mqtt'), [allDevices]);

  // UI State
  const [activeTab, setActiveTab] = useState('Rules');
  const [viewMode, setViewMode] = useState('Visual Builder');

  // Stats
  const [totalRules, setTotalRules] = useState(12);
  const [activeRules, setActiveRules] = useState(8);
  const [triggeredRules, setTriggeredRules] = useState(3);
  const [disabledRules, setDisabledRules] = useState(1);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Simulation
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Active Rule Editor model
  const [currentRule, setCurrentRule] = useState<Partial<Rule>>(getEmptyRule);

  // Latest values for use inside handlers/effects
  const devicesRef = useRef<Device[]>(devices);
  devicesRef.current = devices;
  const tagsRef = useRef<Tag[]>(allTags);
  tagsRef.current = allTags;
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const ts = timers.current;
    return () => {
      ts.forEach(t => window.clearTimeout(t));
    };
  }, []);

  const getTagsForDevice = (deviceId: string): Tag[] => allTags.filter(t => t.deviceId === deviceId);

  const makeCondition = (): RuleCondition => {
    const deviceId = devicesRef.current.length > 0 ? devicesRef.current[0].id : '';
    const tags = tagsRef.current.filter(t => t.deviceId === deviceId);
    return {
      deviceId,
      tag: tags.length > 0 ? tags[0].name : '',
      operator: '>',
      value: 0,
      not: false,
      logicalOperator: 'AND'
    };
  };

  const makeAction = (): RuleAction => ({
    actionType: 'Trigger Alert',
    severity: 'High',
    notification: 'Email + Dashboard'
  });

  const resetEditor = () => {
    setCurrentRule({
      ...getEmptyRule(),
      conditions: [makeCondition()],
      actions: [makeAction()]
    });
  };

  // Rules -> stats
  useEffect(() => {
    setTotalRules(rules.length);
    setActiveRules(rules.filter(r => r.enabled || r.status === 'Active').length);
    setDisabledRules(rules.filter(r => !r.enabled && r.status !== 'Active').length);
    setTriggeredRules(Math.floor(Math.random() * 5)); // Mock metric
  }, [rules]);

  // Devices -> seed empty editor with a condition / action
  useEffect(() => {
    setCurrentRule(prev => {
      let next = prev;
      if (devices.length > 0 && next.conditions && next.conditions.length === 0) {
        next = { ...next, conditions: [makeCondition()] };
      }
      if (next.actions && next.actions.length === 0) {
        next = { ...next, actions: [makeAction()] };
      }
      return next;
    });
  }, [devices]);

  const totalPages = Math.ceil(rules.length / pageSize) || 1;
  const paginatedRules = rules.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize);
  const showingStart = rules.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min(currentPage * pageSize, rules.length);

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const onPageSizeChange = (val: string) => {
    setPageSize(parseInt(val, 10));
    setCurrentPage(1);
  };

  const updateCondition = (index: number, patch: Partial<RuleCondition>) =>
    setCurrentRule(prev => ({
      ...prev,
      conditions: (prev.conditions ?? []).map((c, i) => (i === index ? { ...c, ...patch } : c))
    }));

  const onConditionDeviceChange = (index: number, deviceId: string) => {
    const tags = tagsRef.current.filter(t => t.deviceId === deviceId);
    updateCondition(index, { deviceId, tag: tags.length > 0 ? tags[0].name : '' });
  };

  const addCondition = () =>
    setCurrentRule(prev => ({ ...prev, conditions: [...(prev.conditions ?? []), makeCondition()] }));

  const removeCondition = (index: number) =>
    setCurrentRule(prev => ({ ...prev, conditions: (prev.conditions ?? []).filter((_, i) => i !== index) }));

  const updateAction = (index: number, patch: Partial<RuleAction>) =>
    setCurrentRule(prev => ({
      ...prev,
      actions: (prev.actions ?? []).map((a, i) => (i === index ? { ...a, ...patch } : a))
    }));

  const addAction = () =>
    setCurrentRule(prev => ({ ...prev, actions: [...(prev.actions ?? []), makeAction()] }));

  const removeAction = (index: number) =>
    setCurrentRule(prev => ({ ...prev, actions: (prev.actions ?? []).filter((_, i) => i !== index) }));

  const saveRule = () => {
    if (!currentRule.name || !currentRule.conditions || currentRule.conditions.length === 0) {
      alert('Please provide a rule name and at least one condition.');
      return;
    }

    for (const c of currentRule.conditions) {
      if (!c.deviceId || !c.tag || c.value === null || c.value === undefined) {
        alert('Please fill out all fields for all conditions.');
        return;
      }
    }

    if (currentRule.id) {
      ruleService.updateRule(currentRule as Rule).subscribe(() => resetEditor());
    } else {
      ruleService.createRule(currentRule as Rule).subscribe(() => resetEditor());
    }
  };

  const editRule = (rule: Rule) => {
    // Deep copy to avoid modifying the original before saving
    const copy: Partial<Rule> = JSON.parse(JSON.stringify(rule));
    if (!copy.conditions || copy.conditions.length === 0) {
      copy.conditions = [makeCondition()];
    }
    if (!copy.actions || copy.actions.length === 0) {
      // Migrate legacy action to actions array
      if (copy.action) {
        copy.actions = [{
          actionType: copy.action,
          severity: 'Medium',
          notification: 'Email'
        }];
      } else {
        copy.actions = [makeAction()];
      }
    }
    setCurrentRule(copy);
  };

  const deleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      ruleService.deleteRule(id).subscribe();
    }
  };

  const toggleRuleEnabled = (rule: Rule) => {
    if (rule.enabled) {
      ruleService.disableRule(rule.id).subscribe();
    } else {
      ruleService.enableRule(rule.id).subscribe();
    }
  };

  const runSimulation = () => {
    setSimulationResult('Running simulation...');
    timers.current.push(window.setTimeout(() => {
      const triggers = Math.floor(Math.random() * 20);
      setSimulationResult(`Simulation complete: Rule would have triggered ${triggers} times in the last 7 days.`);
    }, 1500));
  };

  const testRule = () => {
    if (!currentRule.conditions || currentRule.conditions.length === 0) {
      setTestResult('Please add at least one condition to test.');
      return;
    }
    setTestResult('Evaluating current rule against live telemetry...');
    timers.current.push(window.setTimeout(() => {
      const isMatch = Math.random() > 0.5;
      setTestResult(isMatch ? 'Match Found! Rule conditions are currently met.' : 'No match. Rule conditions are not currently met.');
    }, 1000));
  };

  const cancelEdit = () => resetEditor();

  const conditions = currentRule.conditions ?? [];
  const actions = currentRule.actions ?? [];

  const allRulesList: ReactNode = (
    <div className="card" style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <div>
          <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700, color: '#0F172A' }}>All Rules</h2>
          <div style={{ fontSize: 12, color: '#64748B' }}>View and manage configured rules</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="form-field" style={{ margin: 0, padding: 8, flex: 1 }}>
          <option>All Devices</option>
        </select>
        <select className="form-field" style={{ margin: 0, padding: 8, flex: 1 }}>
          <option>All Status</option>
        </select>
        <select className="form-field" style={{ margin: 0, padding: 8, flex: 1 }}>
          <option>All Severity</option>
        </select>
        <div className="form-field" style={{ margin: 0, flex: 1.5 }}>
          <input type="text" placeholder="Search rules..." style={{ padding: 8 }} />
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
            <th style={thStyle('left')}>Rule Name</th>
            <th style={thStyle('left')}>Target Device/Tag</th>
            <th style={thStyle('left')}>Condition</th>
            <th style={thStyle('left')}>Action</th>
            <th style={thStyle('left')}>Status</th>
            <th style={thStyle('left')}>Priority</th>
            <th style={thStyle('center')}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRules.map(rule => {
            const status = rule.status || (rule.enabled ? 'Active' : 'Disabled');
            const priority = rule.priority || 'Medium';
            const first = rule.conditions && rule.conditions.length > 0 ? rule.conditions[0] : null;
            return (
              <tr key={rule.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: 13, color: '#1E293B' }}>
                <td style={{ padding: '16px 8px', fontWeight: 600 }}>{rule.name}</td>
                <td style={{ padding: '16px 8px', color: '#64748B' }}>
                  {first && <span>{first.deviceId}</span>}
                </td>
                <td style={{ padding: '16px 8px' }} className="mono">
                  {first && <span>{first.tag} {first.operator} {first.value}</span>}
                </td>
                <td style={{ padding: '16px 8px' }}>{rule.actions && rule.actions.length > 0 ? rule.actions[0].actionType : rule.action}</td>
                <td style={{ padding: '16px 8px' }}>
                  <span className="pill" style={{ background: status === 'Active' ? '#D1FAE5' : '#F1F5F9', color: status === 'Active' ? '#10B981' : '#64748B', fontWeight: 600 }}>
                    <span className="dot" style={{ display: 'none' }}></span>{status}
                  </span>
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <span className="pill" style={{ background: priority === 'High' ? '#FEE2E2' : (priority === 'Medium' ? '#FEF3C7' : '#DBEAFE'), color: priority === 'High' ? '#EF4444' : (priority === 'Medium' ? '#F59E0B' : '#3B82F6'), fontWeight: 600 }}>
                    <span className="dot" style={{ display: 'none' }}></span>{priority}
                  </span>
                </td>
                <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                  <div className="actions-cell" style={{ justifyContent: 'center', gap: 8 }}>
                    <button type="button" title="Edit Rule" className="btn btn-sm" style={iconBtnBase} onClick={() => editRule(rule)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button type="button" title={rule.enabled ? 'Disable Rule' : 'Enable Rule'} className="btn btn-sm" style={{ ...iconBtnBase, color: '#64748B' }} onClick={() => toggleRuleEnabled(rule)}>
                      {rule.enabled && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      )}
                      {!rule.enabled && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      )}
                    </button>
                    <button type="button" title="Delete Rule" className="btn btn-sm" style={{ ...iconBtnBase, color: '#64748B' }} onClick={() => deleteRule(rule.id)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {rules.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No rules found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Mock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 13, color: '#64748B' }}>
        <div>Showing {showingStart}-{showingEnd} of {rules.length} rules</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" style={pagerBtn} onClick={() => changePage(currentPage - 1)}>&lt;</button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button type="button" key={i}
              style={{
                background: currentPage === i + 1 ? '#DC2626' : 'white',
                color: currentPage === i + 1 ? 'white' : 'black',
                border: currentPage === i + 1 ? 'none' : '1px solid #E2E8F0',
                borderRadius: 4, width: 24, height: 24, cursor: 'pointer'
              }}
              onClick={() => changePage(i + 1)}>
              {i + 1}
            </button>
          ))}

          <button type="button" style={pagerBtn} onClick={() => changePage(currentPage + 1)}>&gt;</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Show
          <select style={{ padding: 4, border: '1px solid #E2E8F0', borderRadius: 4, background: 'white' }} value={pageSize} onChange={e => onPageSizeChange(e.target.value)}>
            <option value={3}>3</option>
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          per page
        </div>
      </div>
    </div>
  );

  return (
    <section className="page rule-engine-page" style={{ background: '#F8FAFC', padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="row-between">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Rule Engine</h1>
            <div className="page-sub" style={{ fontSize: 14, color: '#64748B' }}>Create and manage intelligent rules to monitor your factory in real-time.</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="form-field" style={{ margin: 0, position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search rules, devices, tags..." style={{ width: 250, background: 'white', paddingLeft: 32, border: '1px solid #E2E8F0', borderRadius: 6 }} />
            </div>
            <button type="button" className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626', color: 'white', borderRadius: 6, padding: '8px 16px', fontWeight: 600 }} onClick={cancelEdit}>+ Create Rule</button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Total Rules */}
        <div className="card" style={statCardStyle}>
          <div style={{ ...statIconBase, background: '#EFF6FF', color: '#2563EB' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{totalRules}</div>
            <div style={statLabelStyle}>Total Rules</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#10B981', fontWeight: 600, fontSize: 14 }}>↑ 20%</div>
            <div style={statDeltaLabelStyle}>vs last month</div>
          </div>
        </div>

        {/* Active Rules */}
        <div className="card" style={statCardStyle}>
          <div style={{ ...statIconBase, background: '#ECFDF5', color: '#10B981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{activeRules}</div>
            <div style={statLabelStyle}>Active Rules</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#10B981', fontWeight: 600, fontSize: 14 }}>↑ 14%</div>
            <div style={statDeltaLabelStyle}>vs last month</div>
          </div>
        </div>

        {/* Triggered (24h) */}
        <div className="card" style={statCardStyle}>
          <div style={{ ...statIconBase, background: '#FEF2F2', color: '#EF4444' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{triggeredRules}</div>
            <div style={statLabelStyle}>Triggered (24h)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#EF4444', fontWeight: 600, fontSize: 14 }}>↓ 25%</div>
            <div style={statDeltaLabelStyle}>vs last month</div>
          </div>
        </div>

        {/* Disabled Rules */}
        <div className="card" style={statCardStyle}>
          <div style={{ ...statIconBase, background: '#F1F5F9', color: '#64748B' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{disabledRules}</div>
            <div style={statLabelStyle}>Disabled Rules</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
        <div className="tab" style={tabStyle(activeTab === 'Rules')} onClick={() => setActiveTab('Rules')}>Rules</div>
        <div className="tab" style={tabStyle(activeTab === 'Rule Templates')} onClick={() => setActiveTab('Rule Templates')}>Rule Templates</div>
        <div className="tab" style={tabStyle(activeTab === 'Rule History')} onClick={() => setActiveTab('Rule History')}>Rule History</div>
        <div className="tab" style={tabStyle(activeTab === 'Simulation')} onClick={() => setActiveTab('Simulation')}>Simulation</div>
      </div>

      {activeTab === 'Rules' && (
        <div>
          {/* Main Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {/* Right Column: Create/Edit Rule */}
            <div className="card" style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: '#DC2626', background: '#FEF2F2', padding: 6, borderRadius: 6 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 16, margin: 0, fontWeight: 700, color: '#0F172A' }}>Create / Edit Rule</h2>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Build complex conditions using AND / OR logic</div>
                  </div>
                </div>
                <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                  <button type="button" className={viewMode === 'Visual Builder' ? 'active-view' : undefined} onClick={() => setViewMode('Visual Builder')} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', color: viewMode === 'Visual Builder' ? '#DC2626' : '#64748B', background: viewMode === 'Visual Builder' ? '#FEE2E2' : 'white' }}>Visual Builder</button>
                  <button type="button" className={viewMode === 'JSON View' ? 'active-view' : undefined} onClick={() => setViewMode('JSON View')} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', borderLeft: '1px solid #E2E8F0', color: viewMode === 'JSON View' ? '#DC2626' : '#64748B', background: viewMode === 'JSON View' ? '#FEE2E2' : 'white' }}>JSON View</button>
                </div>
              </div>

              {viewMode === 'JSON View' && (
                <div>
                  <textarea style={{ width: '100%', height: 400, padding: 12, fontFamily: 'monospace', border: '1px solid var(--border)', borderRadius: 6, background: '#f9f9f9' }} disabled value={JSON.stringify(currentRule, null, 2)}></textarea>
                </div>
              )}

              {viewMode === 'Visual Builder' && (
                <div>
                  {/* Rule Meta */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Rule Name <span style={{ color: 'var(--red)' }}>*</span></label>
                      <input type="text" value={currentRule.name ?? ''} onChange={e => setCurrentRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g. High Spindle Temperature" />
                    </div>
                    <div className="form-field" style={{ margin: 0 }}>
                      <label>Description</label>
                      <input type="text" value={currentRule.description ?? ''} onChange={e => setCurrentRule(p => ({ ...p, description: e.target.value }))} placeholder="Trigger alert when spindle temp exceeds limit" />
                    </div>
                  </div>

                  {/* IF Conditions */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>IF (Conditions)</div>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: 20, borderLeft: '2px solid #DC2626', marginLeft: 8 }}>
                      {conditions.map((cond, i) => {
                        const logical = cond.logicalOperator || 'AND';
                        return (
                          <div key={i} style={rowCardStyle}>
                            {/* connecting line connector */}
                            <div style={connectorStyle}></div>

                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                              <div className="form-field" style={{ margin: 0, flex: 1 }}>
                                <label style={{ fontSize: 11 }}>Device</label>
                                <select value={cond.deviceId} onChange={e => onConditionDeviceChange(i, e.target.value)} style={{ padding: 8 }}>
                                  {devices.map(dev => (
                                    <option key={dev.id} value={dev.id}>{dev.id}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-field" style={{ margin: 0, flex: 1 }}>
                                <label style={{ fontSize: 11 }}>Tag</label>
                                <select value={cond.tag} onChange={e => updateCondition(i, { tag: e.target.value })} style={{ padding: 8 }}>
                                  {getTagsForDevice(cond.deviceId).map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-field" style={{ margin: 0, width: 80 }}>
                                <label style={{ fontSize: 11 }}>Operator</label>
                                <select value={cond.operator} onChange={e => updateCondition(i, { operator: e.target.value })} style={{ padding: 8 }}>
                                  <option value=">">&gt;</option>
                                  <option value="<">&lt;</option>
                                  <option value="==">==</option>
                                  <option value="!=">!=</option>
                                </select>
                              </div>
                              <div className="form-field" style={{ margin: 0, width: 100 }}>
                                <label style={{ fontSize: 11 }}>Value</label>
                                <input type="number" value={cond.value ?? ''} onChange={e => updateCondition(i, { value: (e.target.value === '' ? null : Number(e.target.value)) as number })} style={{ padding: 8 }} />
                              </div>
                              <div className="form-field" style={{ margin: 0, width: 80 }}>
                                <label style={{ fontSize: 11 }}>Unit</label>
                                <select value={cond.unit ?? ''} onChange={e => updateCondition(i, { unit: e.target.value })} style={{ padding: 8 }}>
                                  {cond.unit === undefined && <option value="" hidden></option>}
                                  <option value="°C">°C</option>
                                  <option value="RPM">RPM</option>
                                  <option value="bar">bar</option>
                                  <option value="%">%</option>
                                </select>
                              </div>
                              <button type="button" className="btn btn-sm" style={removeBtnStyle} onClick={() => removeCondition(i)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                              </button>
                            </div>

                            {/* Logical operator badge between items if not last */}
                            {i < conditions.length - 1 && (
                              <div style={{ position: 'absolute', bottom: -20, left: -10, zIndex: 1 }}>
                                <button type="button" onClick={() => updateCondition(i, { logicalOperator: cond.logicalOperator === 'OR' ? 'AND' : 'OR' })} style={{ borderRadius: 12, padding: '2px 12px', fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid #E2E8F0', color: logical === 'AND' ? '#DC2626' : '#2563EB', borderColor: logical === 'AND' ? '#FCA5A5' : '#93C5FD', background: logical === 'AND' ? '#FEF2F2' : '#EFF6FF' }}>{logical}</button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button type="button" className="btn btn-sm" style={addBtnStyle} onClick={addCondition}>+ Add Condition</button>
                    </div>
                  </div>

                  {/* THEN Actions */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: '#0F172A' }}>THEN (Actions)</div>

                    <div style={{ position: 'relative', paddingLeft: 20, borderLeft: '2px solid #DC2626', marginLeft: 8 }}>
                      {actions.map((act, i) => (
                        <div key={i} style={rowCardStyle}>
                          {/* connecting line connector */}
                          <div style={connectorStyle}></div>

                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div className="form-field" style={{ margin: 0, flex: 1 }}>
                              <label style={{ fontSize: 11 }}>Action Type</label>
                              <select value={act.actionType} onChange={e => updateAction(i, { actionType: e.target.value })} style={{ padding: 8 }}>
                                <option value="Trigger Alert">Trigger Alert</option>
                                <option value="Send Notification">Send Notification</option>
                                <option value="Log Event">Log Event</option>
                                <option value="Trigger Questionnaire">Trigger Questionnaire</option>
                              </select>
                            </div>
                            {act.actionType !== 'Trigger Questionnaire' && (
                              <div className="form-field" style={{ margin: 0, flex: 1 }}>
                                <label style={{ fontSize: 11 }}>Severity</label>
                                <div style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: 8, top: 11, width: 8, height: 8, borderRadius: '50%', background: act.severity === 'High' ? '#EF4444' : (act.severity === 'Medium' ? '#F59E0B' : '#3B82F6') }}></div>
                                  <select value={act.severity} onChange={e => updateAction(i, { severity: e.target.value })} style={{ padding: 8, paddingLeft: 24, width: '100%' }}>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                  </select>
                                </div>
                              </div>
                            )}
                            {act.actionType !== 'Trigger Questionnaire' && (
                              <div className="form-field" style={{ margin: 0, flex: 1.5 }}>
                                <label style={{ fontSize: 11 }}>Notification</label>
                                <select value={act.notification} onChange={e => updateAction(i, { notification: e.target.value })} style={{ padding: 8 }}>
                                  <option value="Email + Dashboard">Email + Dashboard</option>
                                  <option value="SMS + Dashboard">SMS + Dashboard</option>
                                  <option value="Dashboard Only">Dashboard Only</option>
                                </select>
                              </div>
                            )}

                            {act.actionType === 'Trigger Questionnaire' && (
                              <div className="form-field" style={{ margin: 0, flex: 2.5 }}>
                                <label style={{ fontSize: 11 }}>Select Questionnaire</label>
                                <select value={act.questionnaireId ?? ''} onChange={e => updateAction(i, { questionnaireId: e.target.value })} style={{ padding: 8, width: '100%' }}>
                                  {act.questionnaireId === undefined && <option value="" hidden></option>}
                                  {questionnaires.map(q => (
                                    <option key={q.id} value={q.id}>{q.title}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <button type="button" className="btn btn-sm" style={removeBtnStyle} onClick={() => removeAction(i)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      ))}

                      <button type="button" className="btn btn-sm" style={addBtnStyle} onClick={addAction}>+ Add Action</button>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button type="button" className="btn" style={{ display: 'flex', alignItems: 'center', gap: 8, borderColor: '#E2E8F0', background: 'white' }} onClick={testRule}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Test Rule
                      </button>
                      {testResult && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: testResult.includes('Match') ? '#10B981' : '#64748B' }}>
                          {testResult}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="button" className="btn" style={{ background: 'white', border: '1px solid #E2E8F0' }} onClick={cancelEdit}>Cancel</button>
                      <button type="button" className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626', color: 'white' }} onClick={saveRule}>Save Rule</button>
                    </div>
                  </div>

                  {/* Simulation Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#FEF2F2', borderRadius: 8, marginTop: 24 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ color: '#DC2626', marginTop: 2 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>Simulation Mode</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{simulationResult || 'Test your rule with historical data before activating.'}</div>
                      </div>
                    </div>
                    <button type="button" className="btn" style={{ color: '#DC2626', border: '1px solid #FCA5A5', background: 'white', fontWeight: 600 }} onClick={runSimulation}>Run Simulation</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rule Templates Tab */}
      {activeTab === 'Rule Templates' && <div>{allRulesList}</div>}

      {/* Rule History Tab */}
      {activeTab === 'Rule History' && <div>{allRulesList}</div>}

      {/* Simulation Tab */}
      {activeTab === 'Simulation' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 8 }}>
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: 16, borderRadius: '50%', marginBottom: 16 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h3 style={{ fontSize: 18, color: '#0F172A', margin: '0 0 8px 0' }}>Advanced Simulation Environment</h3>
          <p style={{ color: '#64748B', fontSize: 14, textAlign: 'center', maxWidth: 400, margin: '0 0 24px 0' }}>
            Backtest complex rule logic against historical datasets to tune thresholds and prevent false positives before deploying to production.
          </p>
          <button type="button" className="btn btn-primary" style={{ background: '#DC2626', borderColor: '#DC2626', color: 'white' }}>Configure Simulation (Coming Soon)</button>
        </div>
      )}
    </section>
  );
}
