import { ChevronRight } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
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
      <article className="rounded-2xl bg-background px-5 text-sm">
        {fields
          .map(([label, value]) => [label, value(user)])
          .filter(([, value]) => value)
          .map(([label, value], index) => (
            <div
              key={label}
              className={index === 0 ? "py-3" : "border-t border-border py-3"}
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
      </article>
      {user.role === "PARENT" ? (
        <Link
          to="/profile/assign"
          className="flex h-14 items-center justify-between rounded-2xl bg-background px-5 text-left text-sm font-medium"
        >
          Assign pickup/dropoff person
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      ) : null}
      <Button
        variant="outline"
        className="h-11 bg-background"
        onClick={() => {
          signOut()
          navigate("/login")
        }}
      >
        Sign out
      </Button>
    </div>
  )
}
