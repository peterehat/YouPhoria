import { NavLink } from 'react-router-dom'
import { LayoutGrid, Users, LineChart, Settings } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutGrid },
  { to: '/users', label: 'Users', Icon: Users },
  { to: '/analytics', label: 'Analytics', Icon: LineChart },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">YouPhoria Admin</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' is-active' : ''}`
            }
          >
            <item.Icon size={16} style={{ marginRight: 10, opacity: 0.9 }} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}


