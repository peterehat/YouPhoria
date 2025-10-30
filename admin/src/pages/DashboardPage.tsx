import { Card } from '../components/Card'
import { Users, FileText, Activity, DollarSign, UserCog, ClipboardCheck, BadgeCheck, LayoutGrid } from 'lucide-react'

export function DashboardPage() {
  return (
    <div className="dashboard-grid">
      <div className="metrics-grid">
        <Card title="Total Users">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} style={{ opacity: 0.85 }} />
            <div className="metric">30</div>
          </div>
          <div className="metric-sub">+12.3% vs last month</div>
        </Card>
        <Card title="Quotes">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} style={{ opacity: 0.85 }} />
            <div className="metric">73</div>
          </div>
          <div className="metric-sub">74% accepted this month</div>
        </Card>
        <Card title="Active Coaches">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} style={{ opacity: 0.85 }} />
            <div className="metric">8</div>
          </div>
          <div className="metric-sub">+23.1% vs last month</div>
        </Card>
        <Card title="Revenue">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DollarSign size={22} style={{ opacity: 0.85 }} />
            <div className="metric">$48,392</div>
          </div>
          <div className="metric-sub">+15.2% vs last month</div>
        </Card>
      </div>

      <div className="panels-grid">
        <Card title="Recent Activity" footer={<button className="btn">View All Activity</button>}>
          <ul className="activity-list">
            <li>New quote created by John Smith · 2 minutes ago</li>
            <li>New user registered: jane.doe@email.com · 15 minutes ago</li>
            <li>Coach application approved: Mike Johnson · 1 hour ago</li>
            <li>Invoice paid: Premium plan · 2 hours ago</li>
          </ul>
        </Card>
        <Card title="Quick Actions">
          <div className="quick-actions">
            <button className="btn btn-outline"><UserCog size={16} style={{ marginRight: 8 }} /> Manage Users</button>
            <button className="btn btn-outline"><ClipboardCheck size={16} style={{ marginRight: 8 }} /> Review Quotes</button>
            <button className="btn btn-outline"><BadgeCheck size={16} style={{ marginRight: 8 }} /> Approve Coaches</button>
            <button className="btn btn-outline"><LayoutGrid size={16} style={{ marginRight: 8 }} /> Manage Programs</button>
          </div>
        </Card>
      </div>
    </div>
  )
}


