const bars = [
  { label: 'Mon', title: 'Monday: 60%', height: '60%', active: true },
  { label: 'Tue', title: 'Tuesday: 85%', height: '85%', active: true },
  { label: 'Wed', title: 'Wednesday: 70%', height: '70%', active: true },
  { label: 'Thu', title: 'Thursday: 90%', height: '90%', active: true },
  { label: 'Fri', title: 'Friday: 65%', height: '65%', active: true },
  { label: 'Sat', title: 'Saturday: 30%', height: '30%', active: false },
  { label: 'Sun', title: 'Sunday: 15%', height: '15%', active: false },
];

const exportsList = [
  { name: 'OEE_Report_Oct.csv', generated: 'Generated 2h ago' },
  { name: 'Shift2_Energy.xlsx', generated: 'Generated yesterday' },
  { name: 'Quality_Rejects.pdf', generated: 'Generated 3 days ago' },
  { name: 'Monthly_Audit.csv', generated: 'Generated 1 week ago' },
];

export default function DashboardsReports() {
  return (
    <section className="page">
      <div className="page-header">
        <div className="row-between">
          <div>
            <h1>Dashboards & Reports</h1>
            <div className="page-sub">Historical telemetry trends and custom reporting views.</div>
          </div>
          <div>
            <button className="btn">Export CSV</button>
            <button className="btn btn-primary" style={{ marginLeft: 8 }}>+ New Dashboard</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14, background: 'var(--bg-2)' }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Saved Views</h3>
        <div className="chip-group">
          <span className="chip" style={{ background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' }}>Daily OEE Summary</span>
          <span className="chip">Shift 1 Production</span>
          <span className="chip">Energy Consumption</span>
          <span className="chip">Quality Rejects</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Large Chart Mock */}
        <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <h3 style={{ fontSize: 14, marginBottom: 4 }}>Machine Utilization (Last 7 Days)</h3>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>Aggregated active run time vs idle time</div>

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '8%', padding: '0 20px 20px 20px' }}>
            {/* CSS Bar Chart Mock */}
            {bars.map((bar) => (
              <div key={bar.label} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                <div
                  style={{ width: '60%', height: bar.height, background: bar.active ? 'var(--red)' : 'var(--bg-3)', borderRadius: '4px 4px 0 0', position: 'relative', cursor: 'pointer' }}
                  title={bar.title}
                ></div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8 }}>{bar.label}</div>
              </div>
            ))}

            {/* Axis Lines */}
            <div style={{ position: 'absolute', left: 20, right: 20, bottom: 35, height: 1, background: 'var(--border-strong)' }}></div>
            <div style={{ position: 'absolute', left: 20, right: 20, top: '10%', height: 1, background: 'var(--border-strong)', opacity: 0.3, borderTop: '1px dashed var(--border-strong)' }}></div>
            <div style={{ position: 'absolute', left: 20, right: 20, top: '40%', height: 1, background: 'var(--border-strong)', opacity: 0.3, borderTop: '1px dashed var(--border-strong)' }}></div>
          </div>
        </div>

        {/* Small List Mock */}
        <div className="card" style={{ height: 350 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Recent Exports</h3>
          <table style={{ fontSize: 12 }}>
            <tbody>
              {exportsList.map((item) => (
                <tr key={item.name}>
                  <td style={{ padding: '10px 0' }}>
                    <div style={{ fontWeight: 500 }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{item.generated}</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px 0' }}><button className="btn btn-sm">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
