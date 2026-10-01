import { Table, TableBody, TableHeader } from "@/components/ui/table"

export function DataTable({ header, children }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border bg-background pl-4 md:block">
      <Table>
        <TableHeader className="bg-background">{header}</TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  )
}

export function RecordCards({ children }) {
  return <div className="flex flex-col gap-2 md:hidden">{children}</div>
}

export function RecordCard({ children }) {
  return (
    <article className="rounded-2xl bg-background px-5 py-2 text-sm">
      {children}
    </article>
  )
}
