import { Table, TableBody, TableHeader } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function DataTable({ header, children }) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border bg-background md:block">
      <Table>
        <TableHeader className="bg-background">{header}</TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  )
}

export function RecordCards({ children }) {
  return <div className="ios-list md:hidden">{children}</div>
}

export function RecordCard({ children, className, ...props }) {
  return (
    <article
      className={cn("ios-row text-sm", className)}
      {...props}
    >
      {children}
    </article>
  )
}
