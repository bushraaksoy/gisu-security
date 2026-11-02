import { ChevronRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { ChangePasswordForm } from "@/components/ChangePasswordForm"
import { roleLabels } from "@/lib/models"
import { useAuth } from "@/lib/auth"
const fields = [
  ["Name", (user) => user.name],
  ["Username", (user) => user.username],
  [
    "Email",
    (user) =>
      user.email && user.email.toLowerCase() !== user.username.toLowerCase()
        ? user.email
        : null,
  ],
  ["Role", (user) => roleLabels[user.role]],
]
export function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  if (!user) {
    return null
  }
  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="ios-list text-sm">
        {fields
          .map(([label, value]) => [label, value(user)])
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="ios-row">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
      </div>
      {user.role === "PARENT" ? (
        <Link
          to="/profile/assign"
          className="ios-list flex h-14 items-center justify-between px-4 text-left text-sm font-medium"
        >
          Assign pickup/dropoff person
          <ChevronRight className="size-5 shrink-0 text-[color:var(--ios-label-secondary)]" />
        </Link>
      ) : null}
      <ChangePasswordForm />
      <button
        type="button"
        className="ios-list flex h-11 w-full items-center justify-center text-sm font-medium text-destructive"
        onClick={() => {
          signOut()
          navigate("/login")
        }}
      >
        Sign out
      </button>
    </div>
  )
}
