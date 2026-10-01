import { Link, useParams } from "react-router-dom"
import { DataTable, RecordCard, RecordCards } from "@/components/data-table"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { errorMessage } from "@/lib/errors"
import {
  directoryName,
  guardiansForStudent,
  relationLabels,
} from "@/lib/directory"
import { useDirectory } from "@/lib/useDirectory"
export function StudentDetailPage() {
  const { studentId = "" } = useParams()
  const directory = useDirectory()
  const student = directory.data?.students.find(
    (person) => person.id === studentId
  )
  const guardians = directory.data
    ? guardiansForStudent(directory.data, studentId)
    : []
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {directory.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(directory.error)}
        </p>
      ) : null}
      {directory.isPending ? (
        <p className="text-sm text-muted-foreground">Loading student…</p>
      ) : null}
      {!directory.isPending && !directory.isError && !student ? (
        <p className="text-sm text-muted-foreground">Student not found.</p>
      ) : null}
      {student ? (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{directoryName(student)}</h1>
            <p className="text-sm text-muted-foreground">
              {[student.studentNumber, student.classLabel || student.yearGroup]
                .filter(Boolean)
                .join(" · ") || "No class recorded"}
            </p>
          </div>
          <section className="flex flex-col gap-3">
            {guardians.length === 0 ? (
              <p className="text-sm text-muted-foreground md:hidden">
                No guardians linked.
              </p>
            ) : (
              <RecordCards>
                {guardians.map(({ guardian, relation }) => (
                  <RecordCard key={guardian.id}>
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/guardians/${guardian.id}`}
                        className="min-w-0 font-medium hover:underline"
                      >
                        {directoryName(guardian)}
                      </Link>
                      <p className="shrink-0 text-xs">
                        {relationLabels[relation]}
                      </p>
                    </div>
                  </RecordCard>
                ))}
              </RecordCards>
            )}
            <DataTable
              header={
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relation</TableHead>
                </TableRow>
              }
            >
              {guardians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    No guardians linked.
                  </TableCell>
                </TableRow>
              ) : (
                guardians.map(({ guardian, relation }) => (
                  <TableRow key={guardian.id}>
                    <TableCell>
                      <Link
                        to={`/guardians/${guardian.id}`}
                        className="font-medium hover:underline"
                      >
                        {directoryName(guardian)}
                      </Link>
                    </TableCell>
                    <TableCell>{relationLabels[relation]}</TableCell>
                  </TableRow>
                ))
              )}
            </DataTable>
          </section>
        </>
      ) : null}
    </div>
  )
}
