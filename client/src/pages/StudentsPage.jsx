import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { getGateToday, listAllowedStudents } from "@/api/gate"
import { DataTable, RecordCard, RecordCards } from "@/components/data-table"
import { StudentAvatar } from "@/components/student-avatar"
import { StatusBadge } from "@/lib/gateStatus"
import { Input } from "@/components/ui/input"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth"
import { queryKeys } from "@/lib/queryClient"
import { errorMessage } from "@/lib/errors"
import { directoryName, matchesDirectoryQuery } from "@/lib/directory"
import { useDirectory } from "@/lib/useDirectory"
function studentId(student) {
  return `ID: ${student.studentNumber || "—"}`
}
function classText(student) {
  return student.classLabel || student.yearGroup || "—"
}
function TodayPlace({ state }) {
  if (state === "waiting") {
    return <StatusBadge state="waiting" />
  }
  if (state === "at-school") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f3faf4] px-2 py-0.5 text-[10px] font-medium text-[#6a9a78]">
        <span className="size-1.5 rounded-full bg-current" />
        At school
      </span>
    )
  }
  if (state === "none" || state === "picked-up" || state === "rejected") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f4f2f6] px-2 py-0.5 text-[10px] font-medium text-[#8d8794]">
        <span className="size-1.5 rounded-full bg-current" />
        At home
      </span>
    )
  }
  return null
}
function collectLabel(student) {
  if (student.canDropoff && student.canPickup) {
    return "Drop off · Pick up"
  }
  if (student.canDropoff) {
    return "Drop off"
  }
  return "Pick up"
}
export function StudentsPage() {
  const { user } = useAuth()
  const directory = useDirectory()
  const [query, setQuery] = useState("")
  const allowedQuery = useQuery({
    queryKey: queryKeys.gateAllowed,
    queryFn: listAllowedStudents,
    enabled: user?.role === "PARENT",
  })
  const allowed = allowedQuery.data ?? []
  const todayQuery = useQuery({
    queryKey: queryKeys.gateToday,
    queryFn: getGateToday,
    enabled: user?.role === "PARENT",
    refetchInterval: 5000,
    staleTime: 0,
  })
  const placeById = useMemo(() => {
    const places = new Map()
    for (const child of todayQuery.data?.children ?? []) {
      places.set(child.id, child.state)
    }
    return places
  }, [todayQuery.data])
  const canSearch = user?.role !== "PARENT"
  const students = useMemo(() => {
    const all = directory.data?.students ?? []
    return all.filter((student) =>
      matchesDirectoryQuery(
        `${directoryName(student)} ${student.studentNumber ?? ""}`,
        query
      )
    )
  }, [directory.data, query])
  return (
    <div className="flex flex-col gap-6">
      {canSearch ? (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students"
          aria-label="Search students"
          className="h-9 rounded-full bg-background px-3 py-0 leading-9 placeholder:text-xs placeholder:leading-9 placeholder:text-[oklch(0.75_0_0)]"
        />
      ) : null}
      {directory.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(directory.error)}
        </p>
      ) : null}
      {directory.isPending ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : (
        <>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground md:hidden">
              No students found.
            </p>
          ) : (
            <RecordCards>
              {students.map((student) => (
                <RecordCard key={student.id}>
                  <div className="flex items-center gap-3">
                    <StudentAvatar
                      id={student.id}
                      givenName={student.givenName}
                      surname={student.surname}
                    />
                    <div className="min-w-0 flex-1">
                      {user?.role === "PARENT" ? (
                        <p className="font-semibold">
                          {directoryName(student)}
                        </p>
                      ) : (
                        <Link
                          to={`/students/${student.id}`}
                          className="font-semibold hover:underline"
                        >
                          {directoryName(student)}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {studentId(student)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-xs text-muted-foreground">
                        {classText(student)}
                      </p>
                      {user?.role === "PARENT" ? (
                        <TodayPlace state={placeById.get(student.id)} />
                      ) : null}
                    </div>
                  </div>
                </RecordCard>
              ))}
            </RecordCards>
          )}
          <DataTable
            header={
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Year</TableHead>
              </TableRow>
            }
          >
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {user?.role === "PARENT" ? (
                      <span className="flex items-center gap-2 font-medium">
                        <StudentAvatar
                          id={student.id}
                          givenName={student.givenName}
                          surname={student.surname}
                          className="size-7 text-[10px]"
                        />
                        {directoryName(student)}
                      </span>
                    ) : (
                      <Link
                        to={`/students/${student.id}`}
                        className="flex items-center gap-2 font-medium hover:underline"
                      >
                        <StudentAvatar
                          id={student.id}
                          givenName={student.givenName}
                          surname={student.surname}
                          className="size-7 text-[10px]"
                        />
                        {directoryName(student)}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>{studentId(student)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span>{classText(student)}</span>
                      {user?.role === "PARENT" ? (
                        <TodayPlace state={placeById.get(student.id)} />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </DataTable>
        </>
      )}
      {user?.role === "PARENT" && allowed.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Can collect</h2>
          <RecordCards>
            {allowed.map((student) => (
              <RecordCard key={student.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar id={student.id} name={student.name} />
                    <div className="min-w-0">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {collectLabel(student)}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-xs">
                    {student.classLabel || "—"}
                  </p>
                </div>
              </RecordCard>
            ))}
          </RecordCards>
          <DataTable
            header={
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Allowed</TableHead>
              </TableRow>
            }
          >
            {allowed.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <span className="flex items-center gap-2 font-medium">
                    <StudentAvatar
                      id={student.id}
                      name={student.name}
                      className="size-7 text-[10px]"
                    />
                    {student.name}
                  </span>
                </TableCell>
                <TableCell>{student.classLabel || "—"}</TableCell>
                <TableCell>{collectLabel(student)}</TableCell>
              </TableRow>
            ))}
          </DataTable>
        </section>
      ) : null}
    </div>
  )
}
