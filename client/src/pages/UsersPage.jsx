import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { DataTable, RecordCard, RecordCards } from "@/components/data-table"
import { PasswordInput } from "@/components/password-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { createUser, deleteUser, listUsers, updateUser } from "@/api/users"
import { useAuth } from "@/lib/auth"
import {
  directoryName,
  matchesDirectoryQuery,
  studentsForGuardian,
} from "@/lib/directory"
import { assignableRoles, roleLabels } from "@/lib/models"
import { errorMessage } from "@/lib/errors"
import { queryKeys } from "@/lib/queryClient"
import { usernameFromName } from "@/lib/username"
import { useDirectory } from "@/lib/useDirectory"
import { cn } from "@/lib/utils"
const fieldClass = "h-10 rounded-lg bg-background px-3"
const emptyDraft = () => ({
  name: "",
  username: "",
  email: "",
  password: "",
  role: "ADMIN",
  guardianId: "",
})
const studentPreviewCount = 2
const stickyAction =
  "sticky right-0 z-10 bg-background pl-3 shadow-[-6px_0_8px_-6px_rgb(0_0_0/0.15)]"
function studentNameList(user, directory) {
  if (user.role !== "PARENT" || !user.guardianId || !directory) {
    return []
  }
  return studentsForGuardian(directory, user.guardianId).map(({ student }) =>
    directoryName(student)
  )
}
function studentNames(user, directory) {
  const names = studentNameList(user, directory)
  return names.length > 0 ? names.join(", ") : "—"
}
function studentPreview(names, expanded) {
  if (names.length === 0) {
    return "—"
  }
  if (expanded || names.length <= studentPreviewCount) {
    return names.join(", ")
  }
  const shown = names.slice(0, studentPreviewCount).join(", ")
  return `${shown} +${names.length - studentPreviewCount} more`
}
export function UsersPage() {
  const { user: actor } = useAuth()
  const queryClient = useQueryClient()
  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: listUsers,
  })
  const directory = useDirectory()
  const users = usersQuery.data ?? []
  const roleChoices = assignableRoles(actor?.role)
  const [draft, setDraft] = useState(emptyDraft)
  const [guardianQuery, setGuardianQuery] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState("")
  const [userQuery, setUserQuery] = useState("")
  const [headerSlot, setHeaderSlot] = useState(null)
  const [expandedStudents, setExpandedStudents] = useState(() => new Set())
  useEffect(() => {
    setHeaderSlot(document.getElementById("header-action"))
  }, [])
  function toggleStudents(id) {
    setExpandedStudents((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  const visibleUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesDirectoryQuery(
          `${user.name} ${user.username} ${user.email ?? ""} ${roleLabels[user.role]} ${studentNames(user, directory.data)}`,
          userQuery
        )
      ),
    [users, userQuery, directory.data]
  )
  const guardianChoices = useMemo(() => {
    const guardians = directory.data?.guardians ?? []
    const taken = new Set(
      users
        .filter((user) => user.guardianId && user.id !== editingId)
        .map((user) => user.guardianId)
    )
    return guardians
      .filter(
        (guardian) =>
          !taken.has(guardian.id) &&
          matchesDirectoryQuery(
            `${directoryName(guardian)} ${guardian.email ?? ""} ${guardian.phone ?? ""}`,
            guardianQuery
          )
      )
      .slice(0, 8)
  }, [directory.data, users, editingId, guardianQuery])
  const selectedGuardian = directory.data?.guardians.find(
    (guardian) => guardian.id === draft.guardianId
  )
  const saveUser = useMutation({
    mutationFn: async () => {
      const payload = {
        name: draft.name,
        username: draft.username.trim() ? draft.username : undefined,
        email: draft.email.trim() ? draft.email : null,
        role: draft.role,
        guardianId: draft.role === "PARENT" ? draft.guardianId : null,
      }
      if (draft.password) {
        payload.password = draft.password
      }
      if (editingId) {
        return updateUser(editingId, payload)
      }
      return createUser(payload)
    },
    onSuccess: async () => {
      toast.success(editingId ? "User updated" : "User created")
      await queryClient.invalidateQueries({ queryKey: queryKeys.users })
      setOpen(false)
    },
  })
  const removeUser = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      toast.success("User deleted")
      await queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
  const pageError = usersQuery.error ?? directory.error ?? removeUser.error
  function openCreate() {
    setEditingId(null)
    setDraft(emptyDraft())
    setGuardianQuery("")
    setFormError("")
    saveUser.reset()
    setOpen(true)
  }
  function openEdit(user) {
    setEditingId(user.id)
    setDraft({
      name: user.name,
      username: user.username ?? "",
      email: user.email ?? "",
      password: "",
      role: user.role,
      guardianId: user.guardianId ?? "",
    })
    setGuardianQuery("")
    setFormError("")
    saveUser.reset()
    setOpen(true)
  }
  function chooseGuardian(guardian) {
    setDraft((current) => ({
      ...current,
      guardianId: guardian.id,
      name: editingId ? current.name : directoryName(guardian),
      username: editingId
        ? current.username
        : usernameFromName(directoryName(guardian)),
      email: editingId ? current.email : guardian.email || current.email,
    }))
    setGuardianQuery("")
  }
  return (
    <div className="flex flex-col gap-4">
      {headerSlot
        ? createPortal(
            <Button
              size="icon"
              className="size-9 shrink-0 rounded-full"
              aria-label="New user"
              onClick={openCreate}
            >
              <Plus className="size-5" />
            </Button>,
            headerSlot
          )
        : null}
      <Input
        value={userQuery}
        onChange={(event) => setUserQuery(event.target.value)}
        placeholder="Search users"
        aria-label="Search users"
        className="h-9 min-w-0 flex-1 rounded-full bg-background px-3 py-0 leading-9 placeholder:text-xs placeholder:leading-9 placeholder:text-[oklch(0.75_0_0)]"
      />

      {pageError && !open ? (
        <p className="text-sm text-destructive">{errorMessage(pageError)}</p>
      ) : null}

      {usersQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <>
          {visibleUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground md:hidden">
              {users.length === 0 ? "No users yet." : "No users found."}
            </p>
          ) : (
            <RecordCards>
              {visibleUsers.map((user) => {
                const names = studentNameList(user, directory.data)
                const canExpand = names.length > studentPreviewCount
                const expanded = expandedStudents.has(user.id)
                return (
                  <RecordCard key={user.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left",
                        canExpand ? "" : "cursor-default"
                      )}
                      onClick={() => {
                        if (canExpand) {
                          toggleStudents(user.id)
                        }
                      }}
                      aria-expanded={canExpand ? expanded : undefined}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.username}
                          </p>
                          {user.email &&
                          user.email.toLowerCase() !==
                            user.username.toLowerCase() ? (
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full bg-[oklch(0.97_0_0)] px-2 py-1 text-xs">
                          {roleLabels[user.role]}
                        </span>
                      </div>
                      {user.role === "PARENT" ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Students · {studentPreview(names, expanded)}
                        </p>
                      ) : null}
                    </button>
                    <div className="mt-2 flex gap-1 border-t border-border pt-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEdit(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          if (window.confirm(`Delete ${user.name}?`)) {
                            removeUser.mutate(user.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </RecordCard>
                )
              })}
            </RecordCards>
          )}
          <DataTable
            header={
              <TableRow>
                <TableHead className="w-14 pl-4">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className={cn("w-32 text-right", stickyAction)} />
              </TableRow>
            }
          >
            {visibleUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="pl-4 text-muted-foreground"
                >
                  {users.length === 0 ? "No users yet." : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              visibleUsers.map((user, index) => {
                const names = studentNames(user, directory.data)
                return (
                  <TableRow key={user.id}>
                    <TableCell className="pl-4 text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>{roleLabels[user.role]}</TableCell>
                    <TableCell>
                      <div
                        className="max-w-56 overflow-x-auto"
                        title={names}
                      >
                        {names}
                      </div>
                    </TableCell>
                    <TableCell className={cn("text-right", stickyAction)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete ${user.name}?`)) {
                            removeUser.mutate(user.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </DataTable>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          <DialogHeader className="gap-1 border-b px-5 py-4">
            <DialogTitle className="text-lg font-semibold">
              {editingId ? "Edit user" : "Add a user"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this sign-in."
                : "Create a sign-in for staff or a guardian."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              if (draft.role === "PARENT" && !draft.guardianId) {
                setFormError("Choose a guardian")
                return
              }
              if (!editingId && draft.password.length < 8) {
                setFormError("Password must be at least 8 characters")
                return
              }
              setFormError("")
              saveUser.mutate()
            }}
          >
            <div className="flex flex-col gap-5 px-5 py-4">
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-medium">Account</h2>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-name">Name</Label>
                  <Input
                    id="user-name"
                    value={draft.name}
                    className={fieldClass}
                    onChange={(event) => {
                      const name = event.target.value
                      setDraft((current) => {
                        const next = { ...current, name }
                        if (!editingId) {
                          const previous = usernameFromName(current.name)
                          if (
                            !current.username ||
                            current.username === previous
                          ) {
                            next.username = usernameFromName(name)
                          }
                        }
                        return next
                      })
                    }}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-username">Username</Label>
                  <Input
                    id="user-username"
                    value={draft.username}
                    className={fieldClass}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    required
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to sign in.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-email">
                    Email
                    <span className="font-normal text-muted-foreground">
                      Optional
                    </span>
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={draft.email}
                    className={fieldClass}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-medium">Access</h2>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="user-password">Password</Label>
                  <PasswordInput
                    id="user-password"
                    value={draft.password}
                    className={fieldClass}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    required={!editingId}
                    minLength={editingId ? undefined : 8}
                  />
                  <p className="text-xs text-muted-foreground">
                    {editingId
                      ? "Leave blank to keep the current password."
                      : "At least 8 characters."}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Role</Label>
                  <Select
                    value={draft.role}
                    onValueChange={(role) =>
                      setDraft((current) => ({
                        ...current,
                        role,
                        guardianId: role === "PARENT" ? current.guardianId : "",
                      }))
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full data-[size=default]:h-10",
                        fieldClass
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleChoices.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>
              {draft.role === "PARENT" ? (
                <section className="flex flex-col gap-3">
                  <h2 className="text-sm font-medium">Guardian</h2>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="guardian-search">Linked guardian</Label>
                    <p className="flex h-10 items-center rounded-lg border bg-background px-3 text-sm">
                      {selectedGuardian
                        ? directoryName(selectedGuardian)
                        : "None selected"}
                    </p>
                    <Input
                      id="guardian-search"
                      value={guardianQuery}
                      onChange={(event) => setGuardianQuery(event.target.value)}
                      placeholder="Search guardians"
                      className={cn(
                        fieldClass,
                        "placeholder:text-xs placeholder:text-[oklch(0.75_0_0)]"
                      )}
                    />
                    {guardianQuery.trim() ? (
                      <div className="flex max-h-40 flex-col overflow-y-auto rounded-lg border bg-background">
                        {guardianChoices.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground">
                            No guardians found.
                          </p>
                        ) : (
                          guardianChoices.map((guardian) => (
                            <button
                              key={guardian.id}
                              type="button"
                              className="min-h-11 px-3 text-left text-sm hover:bg-muted"
                              onClick={() => chooseGuardian(guardian)}
                            >
                              {directoryName(guardian)}
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}
              {formError || (saveUser.error && open) ? (
                <p className="text-sm text-destructive">
                  {formError || errorMessage(saveUser.error)}
                </p>
              ) : null}
            </div>
            <DialogFooter className="mx-0 mb-0 rounded-none border-t bg-background p-4 sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-10">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="h-10"
                disabled={saveUser.isPending}
              >
                {saveUser.isPending
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
