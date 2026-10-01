import { useQuery } from "@tanstack/react-query"
import { School } from "lucide-react"
import { getPresent } from "@/api/gate"
import { errorMessage } from "@/lib/errors"
import { queryKeys } from "@/lib/queryClient"
export function DashboardPage() {
  const presentQuery = useQuery({
    queryKey: queryKeys.present,
    queryFn: getPresent,
    refetchInterval: 5000,
    staleTime: 0,
  })
  if (presentQuery.error) {
    return (
      <p className="text-sm text-destructive">
        {errorMessage(presentQuery.error)}
      </p>
    )
  }
  if (!presentQuery.data) {
    return null
  }
  return (
    <article className="max-w-sm rounded-2xl bg-emerald-50 px-6 py-8">
      <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
        <School className="size-6" />
      </span>
      <p className="mt-4 text-5xl font-bold text-emerald-950">
        {presentQuery.data.count}
      </p>
      <p className="text-sm text-emerald-800">in school</p>
    </article>
  )
}
