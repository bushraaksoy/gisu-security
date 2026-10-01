import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, Check, LogIn, LogOut, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  approveGateLog,
  approveVisit,
  rejectGateLog,
  rejectVisit,
} from "@/api/gate"
import { listGateLogs } from "@/api/gateLogs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuth } from "@/lib/auth"
import { errorMessage } from "@/lib/errors"
import { formatWhen } from "@/lib/models"
import { queryKeys } from "@/lib/queryClient"
import { formatGateTime, isSchoolToday, schoolDayKey } from "@/lib/schoolDay"
import { transportLabels, transports } from "@/lib/transport"
import { cn } from "@/lib/utils"
const typeLabels = {
  DROPOFF: "Drop off",
  PICKUP: "Pick up",
}
function personName(log) {
  if (log.parent?.name) {
    return log.parent.name
  }
  if (log.alone) {
    return "Alone"
  }
  if (log.escortName) {
    return log.escortName
  }
  return "Guardian"
}
function groupVisits(logs) {
  const groups = new Map()
  for (const log of logs) {
    const key = log.visitId ?? log.id
    const list = groups.get(key) ?? []
    list.push(log)
    groups.set(key, list)
  }
  return [...groups.values()].map((children) => {
    const first = children[0]
    return {
      key: first.visitId ?? first.id,
      visitId: first.visitId,
      logId: first.id,
      type: first.type,
      transport: first.transport,
      parentName: personName(first),
      occurredAt: first.occurredAt,
      children: [...children].sort((a, b) =>
        a.studentName.localeCompare(b.studentName)
      ),
    }
  })
}
function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}
function keyFromDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}
const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
})
function visitSubtitle(visit) {
  const transport = transportLabels[visit.transport]
  return [typeLabels[visit.type], transport].filter(Boolean).join(" · ")
}
export function LogsPage({ view = "today" }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const todayKey = schoolDayKey()
  const canPickDay =
    view === "today" && (user?.role === "ADMIN" || user?.role === "SUPERADMIN")
  const [day, setDay] = useState(todayKey)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [openKey, setOpenKey] = useState(null)
  const [chosen, setChosen] = useState({})
  const logsQuery = useQuery({
    queryKey: canPickDay ? queryKeys.gateLogsOn(day) : queryKeys.gateLogs,
    queryFn: () => listGateLogs(canPickDay ? day : undefined),
    refetchInterval: canPickDay && day !== todayKey ? false : 5000,
    staleTime: 0,
  })
  const review = useMutation({
    mutationFn: ({ visitId, logId, status, transport }) => {
      if (status === "APPROVED") {
        return visitId
          ? approveVisit(visitId, transport)
          : approveGateLog(logId, transport)
      }
      return visitId ? rejectVisit(visitId) : rejectGateLog(logId)
    },
    onSuccess: async (_data, { status, type }) => {
      const label = typeLabels[type] ?? "Visit"
      if (status === "APPROVED") {
        toast.success(`${label} accepted`)
      } else {
        toast.error(`${label} declined`)
      }
      setOpenKey(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.gateLogs })
      await queryClient.invalidateQueries({ queryKey: queryKeys.present })
    },
  })
  const logs = logsQuery.data ?? []
  const pending = groupVisits(
    logs.filter((log) => log.status === "PENDING")
  ).sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
  const approved = groupVisits(
    logs.filter(
      (log) =>
        log.status === "APPROVED" &&
        (canPickDay || isSchoolToday(log.occurredAt))
    )
  ).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
  const openVisit = [...pending, ...approved].find(
    (visit) => visit.key === openKey
  )
  const pageError = logsQuery.error ?? review.error
  function decide(visit, status, event) {
    event.stopPropagation()
    review.mutate({
      visitId: visit.visitId,
      logId: visit.logId,
      status,
      type: visit.type,
      transport: chosen[visit.key],
    })
  }
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      {pageError ? (
        <p className="text-sm text-destructive">{errorMessage(pageError)}</p>
      ) : null}
      {view === "waiting" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link
            to="/log-dropoff"
            className="flex h-16 items-center gap-4 rounded-2xl bg-background px-4 shadow-md"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f6c9a4] text-[#8c4314]">
              <LogIn className="size-5" />
            </span>
            <span className="font-semibold">Log drop off</span>
          </Link>
          <Link
            to="/log-pickup"
            className="flex h-16 items-center gap-4 rounded-2xl bg-background px-4 shadow-md"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#c5dff3] text-[#145a86]">
              <LogOut className="size-5" />
            </span>
            <span className="font-semibold">Log pick up</span>
          </Link>
        </div>
      ) : null}
      {view === "today" ? null : (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Waiting</h2>
          {logsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading logs…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing waiting.</p>
          ) : (
            pending.map((visit) => (
              <VisitCard
                key={visit.key}
                visit={visit}
                pending
                transport={chosen[visit.key]}
                disabled={review.isPending}
                onOpen={() => setOpenKey(visit.key)}
                onChoose={(value) =>
                  setChosen((current) => ({ ...current, [visit.key]: value }))
                }
                onDecide={decide}
              />
            ))
          )}
        </section>
      )}
      {view === "waiting" ? null : (
        <section className="flex flex-col gap-2">
          {canPickDay ? (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-fit rounded-full bg-background px-3 font-normal"
                >
                  <CalendarIcon />
                  {dayLabel.format(dateFromKey(day))}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto overflow-hidden rounded-3xl p-2"
              >
                <Calendar
                  mode="single"
                  selected={dateFromKey(day)}
                  disabled={{ after: dateFromKey(todayKey) }}
                  onSelect={(next) => {
                    if (!next) {
                      return
                    }
                    const key = keyFromDate(next)
                    if (key > todayKey) {
                      return
                    }
                    setDay(key)
                    setCalendarOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          ) : null}
          {logsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Loading logs…</p>
          ) : approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {canPickDay && day !== todayKey
                ? "No visits on this day."
                : "No accepted logs yet."}
            </p>
          ) : (
            approved.map((visit) => (
              <VisitCard
                key={visit.key}
                visit={visit}
                onOpen={() => setOpenKey(visit.key)}
              />
            ))
          )}
        </section>
      )}
      <Dialog
        open={Boolean(openVisit)}
        onOpenChange={(open) => {
          if (!open) {
            setOpenKey(null)
          }
        }}
      >
        <DialogContent>
          {openVisit ? (
            <>
              <DialogHeader>
                <DialogTitle>{openVisit.parentName}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {visitSubtitle(openVisit)} · {formatWhen(openVisit.occurredAt)}
              </p>
              <div className="flex flex-col gap-3">
                {openVisit.children.map((child) => (
                  <div key={child.id}>
                    <p className="font-medium">{child.studentName}</p>
                    {child.classLabel ? (
                      <p className="text-xs text-muted-foreground">
                        {child.classLabel}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              {pending.some((visit) => visit.key === openVisit.key) ? (
                <div className="flex flex-col gap-3">
                  <TransportChoices
                    value={chosen[openVisit.key]}
                    onChoose={(value) =>
                      setChosen((current) => ({
                        ...current,
                        [openVisit.key]: value,
                      }))
                    }
                  />
                  <div className="flex justify-end gap-1">
                    <ReviewButtons
                      visit={openVisit}
                      transport={chosen[openVisit.key]}
                      disabled={review.isPending}
                      onDecide={decide}
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
function VisitCard({
  visit,
  pending = false,
  transport,
  disabled,
  onOpen,
  onChoose,
  onDecide,
}) {
  const shown = visit.children.slice(0, 2)
  const extra = visit.children.length - shown.length
  return (
    <article className="rounded-2xl bg-background px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onOpen}
        >
          <p className="font-medium">{visit.parentName}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                visit.type === "PICKUP"
                  ? "bg-sky-100 text-sky-950"
                  : "bg-orange-100 text-orange-950"
              )}
            >
              {typeLabels[visit.type]}
            </span>
            {transportLabels[visit.transport] ? (
              <span className="text-xs text-muted-foreground">
                {transportLabels[visit.transport]}
              </span>
            ) : null}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {shown.map((child) => (
              <p key={child.id} className="text-sm">
                {child.studentName}
                {child.classLabel ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {child.classLabel}
                  </span>
                ) : null}
              </p>
            ))}
            {extra > 0 ? (
              <p className="text-sm text-muted-foreground">and {extra} more</p>
            ) : null}
          </div>
        </button>
        {pending ? (
          <ReviewButtons
            visit={visit}
            transport={transport}
            disabled={disabled}
            onDecide={onDecide}
          />
        ) : null}
      </div>
      {pending ? (
        <TransportChoices value={transport} onChoose={onChoose} />
      ) : (
        <div className="mt-3 flex justify-end border-t border-border pt-2">
          <time
            dateTime={visit.occurredAt}
            className="text-xs text-foreground/80"
          >
            {formatGateTime(visit.occurredAt)}
          </time>
        </div>
      )}
    </article>
  )
}
function TransportChoices({ value, onChoose }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {transports.map(([mode, label, Icon]) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={(event) => {
            event.stopPropagation()
            onChoose(mode)
          }}
          className={cn(
            "flex h-9 items-center justify-center gap-1 rounded-full bg-[oklch(0.97_0_0)] text-xs font-medium",
            value === mode
              ? "text-[#0b3b5c] ring-2 ring-[#1070b3]"
              : "opacity-60"
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
function ReviewButtons({ visit, transport, disabled, onDecide }) {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        aria-label={`Approve ${visit.parentName}`}
        className="flex size-11 items-center justify-center rounded-full text-green-700 hover:bg-muted"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          if (!transport) {
            toast.error("Select a transport first")
            return
          }
          onDecide(visit, "APPROVED", event)
        }}
      >
        <Check className="size-5" />
      </button>
      <button
        type="button"
        aria-label={`Reject ${visit.parentName}`}
        className="flex size-11 items-center justify-center rounded-full text-destructive hover:bg-muted"
        disabled={disabled}
        onClick={(event) => onDecide(visit, "REJECTED", event)}
      >
        <X className="size-5" />
      </button>
    </div>
  )
}
