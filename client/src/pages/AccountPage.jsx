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
export function AccountPage() {
  const { user } = useAuth()
  if (!user) {
    return null
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
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
    </div>
  )
}
