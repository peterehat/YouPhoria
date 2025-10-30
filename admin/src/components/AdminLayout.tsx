import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

type Props = {
  children: React.ReactNode
}

export function AdminLayout({ children }: Props) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}


