import { Bell, ChevronDown, LogOut, Search, Settings, User } from 'lucide-react'
import React from 'react'

export function Header() {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      const el = menuRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <header className="admin-header">
      <div className="header-title">Dashboard</div>
      <div className="header-actions">
        <button className="icon-btn" aria-label="Search">
          <Search size={18} />
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="user-chip user-chip-button" onClick={() => setOpen((v) => !v)}>
          <span className="user-avatar">AU</span>
          <div className="user-meta">
            <div className="user-name">Admin User</div>
            <div className="user-email">admin@youphoria.app</div>
          </div>
          <ChevronDown size={16} style={{ opacity: 0.7 }} />
        </div>
        {open ? (
          <div className="dropdown" ref={menuRef}>
            <button className="dropdown-item">
              <User size={16} />
              Profile
            </button>
            <button className="dropdown-item">
              <Settings size={16} />
              Settings
            </button>
            <div className="dropdown-sep" />
            <button className="dropdown-item">
              <LogOut size={16} />
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}


