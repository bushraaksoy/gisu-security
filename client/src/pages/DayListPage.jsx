import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { getPresent } from "@/api/gate"
import { DataTable, RecordCard, RecordCards } from "@/components/data-table"
import { StudentAvatar } from "@/components/student-avatar"
import { Input } from "@/components/ui/input"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { errorMessage } from "@/lib/errors"
import { matchesDirectoryQuery } from "@/lib/directory"
import { queryKeys } from "@/lib/queryClient"
const lists = {
  present: {
    key: "present",
    subtitle: "Students currently at school",
    empty: "No one is at school.",
    pill: {
      label: "At school",
      className: "bg-[#f3faf4] text-[#6a9a78]",
    },
  },
  absent: {
    key: "absent",
    subtitle: "Students who have not arrived today",
    empty: "Everyone has arrived.",
    pill: {
      label: "Not arrived",
      className: "bg-[#f8eadc] text-[#c47a32]",
    },
  },
  pickedUp: {
    key: "pickedUp",
    subtitle: "Students picked up today",
    empty: "No one has been picked up yet.",
    pill: {
      label: "Picked up",
      className: "bg-[#e3eefb] text-[#3a6eae]",
    },
  },
}
function classText(student) {
  return student.classLabel || "—"
}
function StatusPill({ pill }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${pill.className}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {pill.label}
    </span>
  )
}
export function DayListPage({ list }) {
  const config = lists[list]
  const [query, setQuery] = useState("")
  const dayQuery = useQuery({
    queryKey: queryKeys.present,
    queryFn: getPresent,
    refetchInterval: 5000,
    staleTime: 0,
  })
  const students = useMemo(() => {
    const all = dayQuery.data?.[config.key]?.students ?? []
    return all.filter((student) =>
      matchesDirectoryQuery(
        `${student.name} ${student.classLabel ?? ""}`,
        query
      )
    )
  }, [dayQuery.data, config.key, query])
  const empty = query.trim() ? "No students found." : config.empty
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted-foreground">{config.subtitle}</p>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students"
        aria-label="Search students"
        className="h-9 ios-search rounded-full px-3 py-0 leading-9 placeholder:text-xs placeholder:leading-9 placeholder:text-[oklch(0.75_0_0)]"
      />
      {dayQuery.error ? (
        <p className="text-sm text-destructive">{errorMessage(dayQuery.error)}</p>
      ) : dayQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : (
        <>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground md:hidden">{empty}</p>
          ) : (
            <RecordCards>
              {students.map((student) => (
                <RecordCard key={student.id}>
                  <div className="flex items-center gap-3">
                    <StudentAvatar id={student.id} name={student.name} />
                    <p className="min-w-0 flex-1 font-semibold">
                      {student.name}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-xs text-muted-foreground">
                        {classText(student)}
                      </p>
                      <StatusPill pill={config.pill} />
                    </div>
                  </div>
                </RecordCard>
              ))}
            </RecordCards>
          )}
          <DataTable
            header={
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
              </TableRow>
            }
          >
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
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
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span>{classText(student)}</span>
                      <StatusPill pill={config.pill} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </DataTable>
        </>
      )}
    </div>
  )
}
export function InSchoolPage() {
  return <DayListPage list="present" />
}
export function AbsentPage() {
  return <DayListPage list="absent" />
}
export function PickedUpPage() {
  return <DayListPage list="pickedUp" />
}
