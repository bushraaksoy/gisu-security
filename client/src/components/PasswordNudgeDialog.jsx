import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth"
const dismissKey = "password-nudge-dismissed"
export function PasswordNudgeDialog() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!user?.mustChangePassword || user.role === "DISPLAY") {
      setOpen(false)
      return
    }
    if (sessionStorage.getItem(dismissKey) === "1") {
      setOpen(false)
      return
    }
    setOpen(true)
  }, [user?.mustChangePassword, user?.role])
  function dismiss() {
    sessionStorage.setItem(dismissKey, "1")
    setOpen(false)
  }
  function goChange() {
    sessionStorage.setItem(dismissKey, "1")
    setOpen(false)
    navigate("/settings/password")
  }
  if (!user || user.role === "DISPLAY") {
    return null
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          dismiss()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="duration-200 ease-out data-open:slide-in-from-bottom-2 data-open:zoom-in-95 data-closed:slide-out-to-bottom-1 data-closed:zoom-out-95"
      >
        <DialogHeader>
          <DialogTitle>Update your password</DialogTitle>
          <DialogDescription>
            You&apos;re still using the password that was set for your account.
            For security, open Change password under Settings and pick a new
            one.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={dismiss}>
            Later
          </Button>
          <Button type="button" onClick={goChange}>
            Change password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
