import { useQuery } from "@tanstack/react-query"
import { Check, ChevronRight, LogIn, LogOut, Moon, Sun } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { getGateToday } from "@/api/gate"
import { errorMessage } from "@/lib/errors"
import { gateStates, StatusBadge } from "@/lib/gateStatus"
import { queryKeys } from "@/lib/queryClient"
import { dayGreeting, dayPart } from "@/lib/schoolDay"
const greetingMarks = {
  morning: {
    icon: Sun,
    bar: "bg-[#e8b48a]",
    iconColor: "text-[#8c4314]",
  },
  afternoon: {
    icon: Sun,
    bar: "bg-[#e8cf70]",
    iconColor: "text-[#8a6414]",
  },
  evening: {
    icon: Moon,
    bar: "bg-[#b9d0f0]",
    iconColor: "text-[#3d6494]",
  },
}
function showsOnToday(child) {
  return child.state !== "none" && (child.own || child.acted)
}
export function HomePage() {
  const todayQuery = useQuery({
    queryKey: queryKeys.gateToday,
    queryFn: getGateToday,
    refetchInterval: 5000,
    staleTime: 0,
  })
  const children = (todayQuery.data?.children ?? []).filter(showsOnToday)
  const greeting = greetingMarks[dayPart()]
  const GreetingIcon = greeting.icon
  const previous = useRef(null)
  const timers = useRef([])
  const [celebrating, setCelebrating] = useState(() => new Set())
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])
  useEffect(() => {
    const next = todayQuery.data?.children
    if (!next) {
      return
    }
    if (!previous.current) {
      previous.current = new Map(next.map((child) => [child.id, child.state]))
      return
    }
    for (const child of next) {
      if (!showsOnToday(child)) {
        continue
      }
      const before = previous.current.get(child.id)
      if (
        before === "waiting" &&
        (child.state === "at-school" || child.state === "picked-up")
      ) {
        toast.success(
          child.state === "at-school"
            ? `${child.name} is at school`
            : `${child.name} was picked up`
        )
        setCelebrating((current) => new Set(current).add(child.id))
        timers.current.push(
          window.setTimeout(() => {
            setCelebrating((current) => {
              const updated = new Set(current)
              updated.delete(child.id)
              return updated
            })
          }, 1500)
        )
      }
      if (before === "waiting" && child.state === "rejected") {
        toast.error(`${child.name} was not accepted`)
      }
    }
    previous.current = new Map(next.map((child) => [child.id, child.state]))
  }, [todayQuery.data])
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div
        className="flex items-center gap-2 py-1"
      >
        <span className={`w-1.5 self-stretch rounded-full ${greeting.bar}`} />
        <GreetingIcon className={`size-4 shrink-0 ${greeting.iconColor}`} />
        <span className="inline-block min-w-0 leading-tight shadow-[4px_0_8px_-2px_rgb(0_0_0/0.22)]">
          <span className="block text-sm font-semibold">{dayGreeting()}</span>
          <span className="block text-[11px] text-muted-foreground">
            Hope you're having a great day!
          </span>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link
          to="/dropoff"
          className="flex h-28 items-center gap-4 rounded-2xl bg-background px-4 shadow-md"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f6c9a4] text-[#8c4314]">
            <LogIn className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Drop off</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Bring them to school
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
        <Link
          to="/pickup"
          className="flex h-28 items-center gap-4 rounded-2xl bg-background px-4 shadow-md"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#c5dff3] text-[#145a86]">
            <LogOut className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Pick up</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              Take them home
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      </div>
      {todayQuery.error ? (
        <p className="text-sm text-destructive">
          {errorMessage(todayQuery.error)}
        </p>
      ) : null}
      {todayQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading today…</p>
      ) : children.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Today</h2>
          {children.map((child) => {
            const status = gateStates[child.state]
            const Icon = status?.icon
            return (
              <article
                key={child.id}
                className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-background px-4 py-3"
              >
                {celebrating.has(child.id) ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70">
                    <span className="animate-gate-check flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="size-8" />
                    </span>
                  </span>
                ) : null}
                {Icon ? (
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${status.iconWrap}`}
                  >
                    <Icon className="size-5" />
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{child.name}</p>
                  {child.classLabel ? (
                    <p className="text-[11px] text-muted-foreground">
                      {child.classLabel}
                    </p>
                  ) : null}
                </div>
                <StatusBadge state={child.state} />
              </article>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
