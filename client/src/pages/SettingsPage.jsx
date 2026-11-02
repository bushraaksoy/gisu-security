import { useNavigate } from "react-router-dom"
import { ChangePasswordForm } from "@/components/ChangePasswordForm"
import { useAuth } from "@/lib/auth"
export function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  if (!user) {
    return null
  }
  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="ios-list px-0 text-sm">
        <div className="ios-row">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.username}</p>
          {user.email &&
          user.email.toLowerCase() !== user.username.toLowerCase() ? (
            <p className="text-xs text-muted-foreground">{user.email}</p>
          ) : null}
        </div>
      </div>
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
