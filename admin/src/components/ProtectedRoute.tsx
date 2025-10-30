import React from 'react'
import { Navigate } from 'react-router-dom'

type Props = {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children }: Props) {
  // TODO: Wire up real auth. For now, always allow.
  const isAuthenticated = true

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}


