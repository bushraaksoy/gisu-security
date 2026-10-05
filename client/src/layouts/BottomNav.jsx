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
      className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex min-w-11 flex-1 flex-col items-center gap-1 pt-2 pb-2 text-[11px] leading-none",
                isActive
                  ? "font-medium text-[#108040]"
                  : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex size-8 items-center justify-center rounded-full">
                  <tab.icon className="size-5" />
                </span>
                <span className="inline-grid items-end justify-items-center">
                  <span className="col-start-1 row-start-1">{tab.label}</span>
                  <span
                    className={cn(
                      "col-start-1 row-start-2 mt-1 h-1 w-full rounded-full",
                      isActive ? "bg-[#108040]" : "bg-transparent"
                    )}
                  />
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
