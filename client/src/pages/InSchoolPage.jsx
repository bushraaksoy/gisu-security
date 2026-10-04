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
function classText(student) {
  return student.classLabel || "—"
}
function AtSchool() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f3faf4] px-2 py-0.5 text-[10px] font-medium text-[#6a9a78]">
      <span className="size-1.5 rounded-full bg-current" />
      At school
    </span>
  )
}
export function InSchoolPage() {
  const [query, setQuery] = useState("")
  const presentQuery = useQuery({
    queryKey: queryKeys.present,
    queryFn: getPresent,
    refetchInterval: 5000,
    staleTime: 0,
  })
  const students = useMemo(() => {
    const all = presentQuery.data?.students ?? []
    return all.filter((student) =>
      matchesDirectoryQuery(
        `${student.name} ${student.classLabel ?? ""}`,
        query
      )
    )
  }, [presentQuery.data, query])
  const empty = query.trim() ? "No students found." : "No one is at school."
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-muted-foreground">
        Students currently at school
      </p>
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students"
        aria-label="Search students"
        className="h-9 rounded-full bg-background px-3 py-0 leading-9 placeholder:text-xs placeholder:leading-9 placeholder:text-[oklch(0.75_0_0)]"
      />
      {presentQuery.error ? (
        <p className="text-sm text-destructive">
          {errorMessage(presentQuery.error)}
        </p>
      ) : presentQuery.isPending ? (
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
                      <AtSchool />
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
                      <AtSchool />
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
