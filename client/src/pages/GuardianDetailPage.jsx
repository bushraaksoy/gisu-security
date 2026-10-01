import { useParams } from "react-router-dom"
import { DataTable, RecordCard, RecordCards } from "@/components/data-table"
import { StudentAvatar } from "@/components/student-avatar"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { errorMessage } from "@/lib/errors"
import {
  directoryName,
  relationLabels,
  studentsForGuardian,
} from "@/lib/directory"
import { useDirectory } from "@/lib/useDirectory"
export function GuardianDetailPage() {
  const { guardianId = "" } = useParams()
  const directory = useDirectory()
  const guardian = directory.data?.guardians.find(
    (person) => person.id === guardianId
  )
  const students = directory.data
    ? studentsForGuardian(directory.data, guardianId)
    : []
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {directory.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(directory.error)}
        </p>
      ) : null}
      {directory.isPending ? (
        <p className="text-sm text-muted-foreground">Loading guardian…</p>
      ) : null}
      {!directory.isPending && !directory.isError && !guardian ? (
        <p className="text-sm text-muted-foreground">Guardian not found.</p>
      ) : null}
      {guardian ? (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">{directoryName(guardian)}</h1>
            <p className="text-sm text-muted-foreground">
              {[guardian.phone, guardian.email].filter(Boolean).join(" · ") ||
                "No contact recorded"}
            </p>
          </div>
          <section className="flex flex-col gap-3">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground md:hidden">
                No students linked.
              </p>
            ) : (
              <RecordCards>
                {students.map(({ student, relation }) => (
                  <RecordCard key={student.id}>
                    <div className="flex items-center gap-3">
                      <StudentAvatar
                        id={student.id}
                        givenName={student.givenName}
                        surname={student.surname}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{directoryName(student)}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {student.studentNumber || "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                        <p>{student.classLabel || student.yearGroup || "—"}</p>
                        <p>{relationLabels[relation]}</p>
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
                  <TableHead>Relation</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Year</TableHead>
                </TableRow>
              }
            >
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No students linked.
                  </TableCell>
                </TableRow>
              ) : (
                students.map(({ student, relation }) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        <StudentAvatar
                          id={student.id}
                          givenName={student.givenName}
                          surname={student.surname}
                          className="size-7 text-[10px]"
                        />
                        {directoryName(student)}
                      </span>
                    </TableCell>
                    <TableCell>{relationLabels[relation]}</TableCell>
                    <TableCell>
                      ID: {student.studentNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {student.classLabel || student.yearGroup || "—"}
                    </TableCell>
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
