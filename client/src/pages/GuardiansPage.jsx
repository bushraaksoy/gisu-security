import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { DataTable, RecordCard, RecordCards } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import { TableCell, TableHead, TableRow } from "@/components/ui/table"
import { errorMessage } from "@/lib/errors"
import { directoryName, matchesDirectoryQuery } from "@/lib/directory"
import { useDirectory } from "@/lib/useDirectory"
export function GuardiansPage() {
  const directory = useDirectory()
  const [query, setQuery] = useState("")
  const guardians = useMemo(() => {
    const all = directory.data?.guardians ?? []
    return all.filter((guardian) =>
      matchesDirectoryQuery(
        `${directoryName(guardian)} ${guardian.phone ?? ""}`,
        query
      )
    )
  }, [directory.data, query])
  return (
    <div className="flex flex-col gap-6">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search guardians"
        aria-label="Search guardians"
        className="h-9 rounded-full bg-background px-3 py-0 leading-9 placeholder:text-xs placeholder:leading-9 placeholder:text-[oklch(0.75_0_0)]"
      />
      {directory.isError ? (
        <p className="text-sm text-destructive">
          {errorMessage(directory.error)}
        </p>
      ) : null}
      {directory.isPending ? (
        <p className="text-sm text-muted-foreground">Loading guardians…</p>
      ) : (
        <>
          {guardians.length === 0 ? (
            <p className="text-sm text-muted-foreground md:hidden">
              No guardians found.
            </p>
          ) : (
            <RecordCards>
              {guardians.map((guardian) => (
                <RecordCard key={guardian.id}>
                  <Link
                    to={`/guardians/${guardian.id}`}
                    className="font-medium hover:underline"
                  >
                    {directoryName(guardian)}
                  </Link>
                </RecordCard>
              ))}
            </RecordCards>
          )}
          <DataTable
            header={
              <TableRow>
                <TableHead className="w-14">#</TableHead>
                <TableHead>Name</TableHead>
              </TableRow>
            }
          >
            {guardians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  No guardians found.
                </TableCell>
              </TableRow>
            ) : (
              guardians.map((guardian, index) => (
                <TableRow key={guardian.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/guardians/${guardian.id}`}
                      className="font-medium hover:underline"
                    >
                      {directoryName(guardian)}
                    </Link>
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
