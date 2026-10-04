import { ChevronLeft } from "lucide-react"
import { useLocation, useMatch, useNavigate } from "react-router-dom"
import mark from "@/assets/galaxy_logo_only.png"
import { useAuth } from "@/lib/auth"
export function TopBar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const studentMatch = useMatch("/students/:studentId")
  const guardianMatch = useMatch("/guardians/:guardianId")
  const isGate = pathname === "/dropoff" || pathname === "/pickup"
  const isRecord = pathname === "/log-dropoff" || pathname === "/log-pickup"
  const isAssign = pathname.startsWith("/profile/assign")
  const isInSchool = pathname === "/in-school"
  const isDetail = Boolean(studentMatch || guardianMatch)
  const title = isDetail ? null : pageTitle(pathname, user?.role)
  const backTo = studentMatch
    ? "/students"
    : guardianMatch
      ? "/guardians"
      : isGate
        ? "/home"
        : isRecord
          ? "/logs"
          : isAssign
            ? "/profile"
            : isInSchool && user?.role === "SUPERADMIN"
              ? "/dashboard"
              : null
  return (
    <header className="sticky top-0 z-30 shrink-0 px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex min-w-0 items-center gap-1 pt-8 pb-4">
        {backTo ? (
          <button
            type="button"
            aria-label="Back"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted"
            onClick={() => navigate(backTo)}
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        {title ? (
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={mark}
              alt=""
              className="size-8 shrink-0 object-contain"
            />
            <h1
              className={
                isAssign
                  ? "min-w-0 text-lg font-bold leading-tight"
                  : "truncate text-2xl font-bold"
              }
            >
              {title}
            </h1>
          </div>
        ) : null}
        <div id="header-action" className="ml-auto shrink-0" />
      </div>
    </header>
  )
}
function pageTitle(pathname, role) {
  if (pathname.startsWith("/home")) {
    return "Home"
  }
  if (pathname.startsWith("/dropoff")) {
    return "Drop off"
  }
  if (pathname.startsWith("/pickup")) {
    return "Pick up"
  }
  if (pathname.startsWith("/dashboard")) {
    return "Dashboard"
  }
  if (pathname.startsWith("/in-school")) {
    return role === "ADMIN" ? "Students" : "In school"
  }
  if (pathname.startsWith("/profile/assign")) {
    return "Assign pickup/dropoff person"
  }
  if (pathname.startsWith("/profile")) {
    return "Profile"
  }
  if (pathname.startsWith("/settings")) {
    return "Settings"
  }
  if (pathname.startsWith("/students")) {
    return role === "PARENT" ? "My Kids" : "Students"
  }
  if (pathname.startsWith("/guardians")) {
    return "Guardians"
  }
  if (pathname.startsWith("/log-dropoff")) {
    return "Log drop off"
  }
  if (pathname.startsWith("/log-pickup")) {
    return "Log pick up"
  }
  if (pathname.startsWith("/today")) {
    return "Today"
  }
  if (pathname.startsWith("/logs")) {
    return role === "SECURITY" ? "Gate" : "Logs"
  }
  return "Users"
}
