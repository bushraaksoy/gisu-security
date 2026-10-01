import { NavLink, Outlet, useNavigate } from "react-router-dom"
import logo from "@/assets/galaxy_logo.png"
import { BottomNav } from "@/layouts/BottomNav"
import { GateAlerts } from "@/layouts/GateAlerts"
import { tabsForRole } from "@/layouts/nav"
import { TopBar } from "@/layouts/TopBar"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
export function RootLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const tabs = tabsForRole(user?.role)
  function handleSignOut() {
    signOut()
    navigate("/login")
  }
  return (
    <div className="flex h-dvh overflow-hidden bg-[oklch(0.97_0_0)] text-foreground">
      {user?.role === "SECURITY" ? <GateAlerts /> : null}
      <aside className="hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-4 py-5">
          <img
            src={logo}
            alt="Galaxy International School Uganda"
            className="h-auto w-full"
          />
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-2 rounded-md px-3 text-sm",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <tab.icon className="size-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
        {user?.role === "SECURITY" ? (
          <button
            type="button"
            className="mt-auto flex min-h-11 items-center px-6 text-sm text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        ) : null}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-[oklch(0.97_0_0)]">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(8rem+env(safe-area-inset-bottom))] md:p-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
