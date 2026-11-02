import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { changePassword } from "@/api/auth"
import { PasswordInput } from "@/components/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { errorMessage } from "@/lib/errors"
import { queryKeys } from "@/lib/queryClient"
export function ChangePasswordForm() {
  const queryClient = useQueryClient()
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const mutation = useMutation({
    mutationFn: () => changePassword(oldPassword, newPassword),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated")
    },
    onError: (error) => {
      toast.error(errorMessage(error))
    },
  })
  function handleSubmit(event) {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    mutation.mutate()
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="ios-list flex flex-col gap-0 overflow-hidden text-sm"
    >
      <div className="ios-row flex flex-col gap-1.5">
        <p className="text-sm font-medium">Change password</p>
        <p className="text-xs text-[color:var(--ios-label-secondary)]">
          Enter your current password, then choose a new one.
        </p>
      </div>
      <div className="ios-row flex flex-col gap-1.5">
        <Label htmlFor="change-old-password">Current password</Label>
        <PasswordInput
          id="change-old-password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(event) => setOldPassword(event.target.value)}
          required
        />
      </div>
      <div className="ios-row flex flex-col gap-1.5">
        <Label htmlFor="change-new-password">New password</Label>
        <PasswordInput
          id="change-new-password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
      </div>
      <div className="ios-row flex flex-col gap-1.5">
        <Label htmlFor="change-confirm-password">Confirm new password</Label>
        <PasswordInput
          id="change-confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>
      <div className="ios-row">
        <Button
          type="submit"
          className="h-11 w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  )
}
