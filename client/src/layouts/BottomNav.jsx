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
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden"
    >
      <div className="flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex min-w-11 flex-1 flex-col items-center text-[11px] leading-none",
                isActive
                  ? "font-medium text-[#108040]"
                  : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex h-16 flex-col items-center justify-center gap-1">
                  <span className="flex size-8 items-center justify-center rounded-full">
                    <tab.icon className="size-5" />
                  </span>
                  {tab.label}
                </span>
                <span className="inline-grid h-[calc(1.5rem+env(safe-area-inset-bottom))] items-end overflow-hidden">
                  <span className="invisible col-start-1 row-start-1">
                    {tab.label}
                  </span>
                  {isActive ? (
                    <span className="col-start-1 row-start-1 h-1 rounded-full bg-[#108040]" />
                  ) : null}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
