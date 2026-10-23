import { useQuery } from "@tanstack/react-query"
import { ChevronRight, LogOut, School, UserX } from "lucide-react"
import { Link } from "react-router-dom"
import { getPresent } from "@/api/gate"
import { errorMessage } from "@/lib/errors"
import { queryKeys } from "@/lib/queryClient"
const cards = [
  {
    to: "/in-school",
    key: "present",
    label: "in school",
    icon: School,
    wrap: "bg-emerald-50 text-emerald-950",
    iconWrap: "bg-emerald-100 text-emerald-800",
    muted: "text-emerald-800",
  },
  {
    to: "/absent",
    key: "absent",
    label: "not arrived",
    icon: UserX,
    wrap: "bg-orange-50 text-orange-950",
    iconWrap: "bg-orange-100 text-orange-800",
    muted: "text-orange-800",
  },
  {
    to: "/picked-up",
    key: "pickedUp",
    label: "picked up",
    icon: LogOut,
    wrap: "bg-sky-50 text-sky-950",
    iconWrap: "bg-sky-100 text-sky-800",
    muted: "text-sky-800",
  },
]
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
    <div className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        const count = presentQuery.data[card.key]?.count ?? 0
        return (
          <Link
            key={card.key}
            to={card.to}
            className={`relative block rounded-2xl px-6 py-8 ${card.wrap}`}
          >
            <ChevronRight
              className={`absolute top-6 right-5 size-5 ${card.muted}`}
            />
            <span
              className={`flex size-12 items-center justify-center rounded-full ${card.iconWrap}`}
            >
              <Icon className="size-6" />
            </span>
            <p className="mt-4 text-5xl font-bold">{count}</p>
            <p className={`text-sm ${card.muted}`}>{card.label}</p>
          </Link>
        )
      })}
    </div>
  )
}
