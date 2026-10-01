import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LogIn, LogOut, Plus } from "lucide-react"
import { useState } from "react"
import {
  listGatePermissions,
  lookupParent,
  saveGatePermission,
} from "@/api/gate"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/errors"
import { queryKeys } from "@/lib/queryClient"
import { cn } from "@/lib/utils"
function Choice({ pressed, onClick, icon: Icon, children, disabled }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-1 rounded-full bg-[oklch(0.97_0_0)] px-3 text-xs font-medium",
        pressed ? "text-[#0b3b5c] ring-2 ring-[#1070b3]" : "opacity-60"
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  )
}
export function AssignPersonPage() {
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [username, setUsername] = useState("")
  const [found, setFound] = useState(null)
  const [draft, setDraft] = useState({ canDropoff: false, canPickup: false })
  const [formError, setFormError] = useState("")
  const permissionsQuery = useQuery({
    queryKey: queryKeys.gatePermissions,
    queryFn: listGatePermissions,
  })
  const save = useMutation({
    mutationFn: saveGatePermission,
    onSuccess: async () => {
      closeAdd()
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gatePermissions,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.gateAllowed })
      await queryClient.invalidateQueries({ queryKey: queryKeys.gateToday })
    },
  })
  const lookup = useMutation({
    mutationFn: () => lookupParent(username.trim()),
    onSuccess: (parent) => {
      const rows = queryClient.getQueryData(queryKeys.gatePermissions) ?? []
      const existing = rows.some(
        (row) =>
          row.granteeId === parent.id && (row.canDropoff || row.canPickup)
      )
      setFound(existing ? null : parent)
      setDraft({ canDropoff: false, canPickup: false })
      setFormError(existing ? "They are already assigned." : "")
    },
    onError: (error) => {
      setFound(null)
      setFormError(errorMessage(error))
    },
  })
  function closeAdd() {
    setAdding(false)
    setFound(null)
    setUsername("")
    setDraft({ canDropoff: false, canPickup: false })
    setFormError("")
  }
  function changeFlags(row, next) {
    if (!next.canDropoff && !next.canPickup) {
      return
    }
    save.mutate({
      granteeId: row.granteeId,
      canDropoff: next.canDropoff,
      canPickup: next.canPickup,
    })
  }
  const people = (permissionsQuery.data ?? []).filter(
    (row) => row.canDropoff || row.canPickup
  )
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Add person"
          className="flex size-11 items-center justify-center rounded-full bg-background"
          onClick={() => {
            save.reset()
            setAdding(true)
          }}
        >
          <Plus className="size-5" />
        </button>
      </div>
      <Dialog
        open={adding}
        onOpenChange={(next) => {
          if (next) {
            setAdding(true)
          } else {
            closeAdd()
          }
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>Assign person</DialogTitle>
            <DialogDescription>
              Choose drop off, pick up, or both. It applies to all of your
              children.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-3 p-5"
            onSubmit={(event) => {
              event.preventDefault()
              setFormError("")
              lookup.mutate()
            }}
          >
            <div className="flex items-center gap-2">
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Sign-in name"
                aria-label="Sign-in name"
                autoComplete="off"
                className="h-9 rounded-full bg-background px-3 py-0 leading-9 placeholder:text-xs placeholder:leading-9 placeholder:text-[oklch(0.75_0_0)]"
              />
              <Button
                type="submit"
                variant="outline"
                className="h-9 rounded-full bg-background"
                disabled={username.trim().length < 3 || lookup.isPending}
              >
                Find
              </Button>
            </div>
            {found ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-background px-4 py-3">
                <p className="font-medium">{found.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Choice
                    pressed={draft.canDropoff}
                    icon={LogIn}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        canDropoff: !current.canDropoff,
                      }))
                    }
                  >
                    Drop off
                  </Choice>
                  <Choice
                    pressed={draft.canPickup}
                    icon={LogOut}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        canPickup: !current.canPickup,
                      }))
                    }
                  >
                    Pick up
                  </Choice>
                </div>
                <Button
                  type="button"
                  className="h-9"
                  disabled={
                    save.isPending || (!draft.canDropoff && !draft.canPickup)
                  }
                  onClick={() =>
                    save.mutate({
                      granteeId: found.id,
                      canDropoff: draft.canDropoff,
                      canPickup: draft.canPickup,
                    })
                  }
                >
                  Add
                </Button>
              </div>
            ) : null}
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            {save.error ? (
              <p className="text-sm text-destructive">
                {errorMessage(save.error)}
              </p>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>
      {!adding && save.error ? (
        <p className="text-sm text-destructive">{errorMessage(save.error)}</p>
      ) : null}
      {permissionsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : permissionsQuery.error ? (
        <p className="text-sm text-destructive">
          {errorMessage(permissionsQuery.error)}
        </p>
      ) : people.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one is assigned yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((row) => (
            <article
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl bg-background px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{row.name}</p>
                <button
                  type="button"
                  className="shrink-0 text-sm text-destructive"
                  disabled={save.isPending}
                  onClick={() =>
                    save.mutate({
                      granteeId: row.granteeId,
                      canDropoff: false,
                      canPickup: false,
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Choice
                  pressed={row.canDropoff}
                  icon={LogIn}
                  disabled={save.isPending}
                  onClick={() =>
                    changeFlags(row, {
                      canDropoff: !row.canDropoff,
                      canPickup: row.canPickup,
                    })
                  }
                >
                  Drop off
                </Choice>
                <Choice
                  pressed={row.canPickup}
                  icon={LogOut}
                  disabled={save.isPending}
                  onClick={() =>
                    changeFlags(row, {
                      canDropoff: row.canDropoff,
                      canPickup: !row.canPickup,
                    })
                  }
                >
                  Pick up
                </Choice>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
