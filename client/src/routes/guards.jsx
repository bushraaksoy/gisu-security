import { Navigate, Outlet } from "react-router-dom"
import { homeForRole } from "@/layouts/nav"
import { useAuth } from "@/lib/auth"
export function RequireAuth() {
  const { token, user, isLoading } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
export function GuestOnly({ children }) {
  const { token, user, isLoading } = useAuth()
  if (token && isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>
  }
  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />
  }
  return children
}
export function RequireRole({ roles, children }) {
  const { user } = useAuth()
  if (!user) {
    return null
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />
  }
  return children
}
