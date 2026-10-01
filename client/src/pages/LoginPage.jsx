import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "@/assets/galaxy_logo.png"
import { PasswordInput } from "@/components/password-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { homeForRole } from "@/layouts/nav"
import { useAuth } from "@/lib/auth"
import { errorMessage } from "@/lib/errors"
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const signIn = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: (user) => {
      navigate(homeForRole(user.role), { replace: true })
    },
  })
  function onSubmit(event) {
    event.preventDefault()
    signIn.mutate()
  }
  return (
    <div className="flex min-h-dvh justify-center bg-[oklch(0.97_0_0)] px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-8 md:items-center md:pt-8">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col md:rounded-2xl md:bg-background md:px-8 md:py-10"
      >
        <img
          src={logo}
          alt="Galaxy International School Uganda"
          className="mx-auto mb-[5.5rem] h-auto w-40 md:mb-8"
        />
        <h1 className="text-xl font-semibold">Sign in</h1>
        <div className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="h-12 rounded-lg border-border bg-background px-3"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-12 rounded-lg border-border bg-background px-3"
            />
          </div>
        </div>
        {signIn.error ? (
          <p className="mt-4 text-sm text-destructive">
            {errorMessage(signIn.error)}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={signIn.isPending}
          className="mt-10 h-12 w-full rounded-lg bg-[#0b3b5c] text-white hover:bg-[#0b3b5c]/90"
        >
          {signIn.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
