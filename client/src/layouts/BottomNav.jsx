import { NavLink } from "react-router-dom"
import { tabsForRole } from "@/layouts/nav"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
export function BottomNav() {
  const { user } = useAuth()
  const tabs = tabsForRole(user?.role)
  return (
    <nav
      aria-label="Primary"
      className="ios-tabbar fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <div className="flex pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] leading-none",
                isActive
                  ? "ios-tab-active font-medium"
                  : "text-muted-foreground"
              )
            }
          >
            <tab.icon className="size-6" strokeWidth={1.75} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
