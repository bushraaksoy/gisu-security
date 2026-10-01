import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
export function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  if (!user) {
    return null
  }
  return (
    <div className="flex max-w-md flex-col gap-4">
      <article className="rounded-2xl bg-background px-5 py-3 text-sm">
        <p className="text-xs text-muted-foreground">Signed in as</p>
        <p className="font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.username}</p>
        {user.email &&
        user.email.toLowerCase() !== user.username.toLowerCase() ? (
          <p className="text-xs text-muted-foreground">{user.email}</p>
        ) : null}
      </article>
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
