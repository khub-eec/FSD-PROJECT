import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { resetDemoData } from './lib/mockDb';
import Dashboard from './pages/Dashboard';
import DeviceManagement from './pages/DeviceManagement';
import TagManagement from './pages/TagManagement';
import Connectivity from './pages/Connectivity';
import DataQuality from './pages/DataQuality';
import EdgeProcessing from './pages/EdgeProcessing';
import Diagnostics from './pages/Diagnostics';
import RealtimeAnalysis from './pages/RealtimeAnalysis';
import RuleEngine from './pages/RuleEngine';
import AlertsNotifications from './pages/AlertsNotifications';
import DashboardsReports from './pages/DashboardsReports';
import QuestionnaireBuilder from './pages/QuestionnaireBuilder';
import StandardApis from './pages/StandardApis';
import PredictiveMaintenance from './pages/PredictiveMaintenance';

const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link');

function NavItem({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink className={navLinkClass} to={to}>
      <span className="nav-icon">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function App() {
  return (
    <div id="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">i</div>
          <div>
            <div className="brand-name">iDACS</div>
            <div className="brand-sub">Smart DA · Operator</div>
          </div>
        </div>
        <nav>
          <NavItem to="/dashboard" icon="◆" label="Dashboard" />
          <NavItem to="/device-management" icon="▣" label="Device Management" />
          <NavItem to="/tag-management" icon="#" label="Tag Management" />
          <NavItem to="/connectivity" icon="⇄" label="Connectivity" />
          <NavItem to="/data-quality" icon="✓" label="Data Quality" />
          <NavItem to="/edge-processing" icon="▤" label="Edge Processing" />
          <NavItem to="/diagnostics" icon="◎" label="Diagnostics" />
          <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px' }} />
          <NavItem to="/realtime-analysis" icon="∿" label="Real-Time Analysis" />
          <NavItem to="/rule-engine" icon="⚙" label="Rule Engine" />
          <NavItem to="/questionnaires" icon="📋" label="Questionnaires" />
          <NavItem to="/alerts-notifications" icon="⚠" label="Alerts & Notifications" />
          <NavItem to="/dashboards-reports" icon="▦" label="Dashboards & Reports" />
          <NavItem to="/standard-apis" icon="</>" label="Standard APIs" />
          <NavItem to="/predictive-maintenance" icon="★" label="Predictive Maintenance" />
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-dot" />
            <span>demo.operator</span>
          </div>
          <div className="demo-badge">Demo mode &middot; dummy data</div>
          <button className="btn logout-btn" onClick={() => { if (confirm('Reset all demo data to the original dummy data?')) resetDemoData(); }}>Reset demo data</button>
        </div>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/device-management" element={<DeviceManagement />} />
          <Route path="/tag-management" element={<TagManagement />} />
          <Route path="/connectivity" element={<Connectivity />} />
          <Route path="/data-quality" element={<DataQuality />} />
          <Route path="/edge-processing" element={<EdgeProcessing />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/realtime-analysis" element={<RealtimeAnalysis />} />
          <Route path="/rule-engine" element={<RuleEngine />} />
          <Route path="/alerts-notifications" element={<AlertsNotifications />} />
          <Route path="/dashboards-reports" element={<DashboardsReports />} />
          <Route path="/questionnaires" element={<QuestionnaireBuilder />} />
          <Route path="/standard-apis" element={<StandardApis />} />
          <Route path="/predictive-maintenance" element={<PredictiveMaintenance />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
