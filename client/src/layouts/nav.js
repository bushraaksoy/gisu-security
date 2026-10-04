import {
  CircleUser,
  ClipboardList,
  Contact,
  DoorOpen,
  GraduationCap,
  House,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
} from "lucide-react"
export const primaryTabs = [
  { to: "/home", label: "Home", icon: House, roles: ["PARENT"] },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["SUPERADMIN", "ADMIN"],
  },
  { to: "/users", label: "Users", icon: Users, roles: ["SUPERADMIN", "ADMIN"] },
  {
    to: "/in-school",
    label: "Students",
    icon: GraduationCap,
    roles: ["ADMIN"],
  },
  {
    to: "/students",
    label: "Students",
    icon: GraduationCap,
    roles: ["SUPERADMIN"],
  },
  {
    to: "/students",
    label: "My Kids",
    icon: GraduationCap,
    roles: ["PARENT"],
  },
  {
    to: "/guardians",
    label: "Guardians",
    icon: Contact,
    roles: ["SUPERADMIN"],
  },
  {
    to: "/logs",
    label: "Gate",
    icon: DoorOpen,
    roles: ["SECURITY"],
  },
  {
    to: "/today",
    label: "Today",
    icon: ListChecks,
    roles: ["SECURITY"],
  },
  {
    to: "/logs",
    label: "Logs",
    icon: ClipboardList,
    roles: ["SUPERADMIN", "ADMIN"],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    to: "/profile",
    label: "Profile",
    icon: CircleUser,
    roles: ["PARENT", "SUPERADMIN", "SECURITY"],
  },
]
export function tabsForRole(role) {
  return primaryTabs.filter((tab) => tab.roles.includes(role))
}
export function homeForRole(role) {
  return tabsForRole(role)[0]?.to ?? "/login"
}
