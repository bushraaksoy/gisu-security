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
      className="shrink-0 border-t bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex pt-2 pb-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex min-w-11 flex-1 flex-col items-center gap-1 text-[11px] leading-none",
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
                <span className="relative pb-1.5">
                  {tab.label}
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-0 mx-auto h-1 rounded-full",
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
