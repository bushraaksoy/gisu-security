import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { dropoffStudents, getGateToday, pickupStudents } from "@/api/gate"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/lib/errors"
import { queryKeys } from "@/lib/queryClient"
import { cn } from "@/lib/utils"
export function GateVisitPage({ mode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const todayQuery = useQuery({
    queryKey: queryKeys.gateToday,
    queryFn: getGateToday,
    refetchInterval: 5000,
    staleTime: 0,
  })
  const children = todayQuery.data?.children ?? []
  const choices = children.filter((child) =>
    mode === "pickup"
      ? child.canPickup && child.state === "at-school" && child.dropoffId
      : child.canDropoff &&
        (child.state === "none" ||
          child.state === "rejected" ||
          child.state === "picked-up")
  )
  const permitted = children.filter((child) =>
    mode === "pickup" ? child.canPickup : child.canDropoff
  )
  const [touched, setTouched] = useState(false)
  const [picked, setPicked] = useState(() => new Set())
  const [othersOpen, setOthersOpen] = useState(false)
  const ownChoices =
    mode === "pickup" ? choices : choices.filter((child) => child.own)
  const otherChoices =
    mode === "pickup" ? [] : choices.filter((child) => !child.own)
  const defaultIds = ownChoices.map((child) =>
    mode === "pickup" ? child.dropoffId : child.id
  )
  const selected = touched ? picked : new Set(defaultIds)
  const save = useMutation({
    mutationFn: () => {
      const ids = [...selected]
      return mode === "pickup" ? pickupStudents(ids) : dropoffStudents(ids)
    },
    onSuccess: async () => {
      toast.success("Sent to the gate")
      await queryClient.invalidateQueries({ queryKey: queryKeys.gateToday })
      await queryClient.invalidateQueries({ queryKey: queryKeys.present })
      navigate("/home")
    },
  })
  function toggle(id) {
    setPicked(() => {
      const next = new Set(touched ? picked : defaultIds)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setTouched(true)
  }
  function toggleOthers() {
    if (othersOpen) {
      const otherIds = new Set(otherChoices.map((child) => child.id))
      setPicked(() => {
        const next = new Set(touched ? picked : defaultIds)
        for (const id of otherIds) {
          next.delete(id)
        }
        return next
      })
      setTouched(true)
    }
    setOthersOpen((open) => !open)
  }
  const empty =
    permitted.length === 0
      ? mode === "pickup"
        ? "No students you can pick up."
        : "No students you can drop off."
      : mode === "pickup"
        ? "No one is at school yet."
        : "Everyone is already at the gate today."
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 md:mx-0">
      {todayQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : todayQuery.error ? (
        <p className="text-sm text-destructive">
          {errorMessage(todayQuery.error)}
        </p>
      ) : choices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {mode === "pickup"
              ? "Clear anyone who is not leaving."
              : "Clear anyone who is not here."}
          </p>
          <div className="flex flex-col gap-2">
            {ownChoices.map((child) => (
              <ChildChoice
                key={child.id}
                child={child}
                mode={mode}
                selected={selected.has(
                  mode === "pickup" ? child.dropoffId : child.id
                )}
                onToggle={() =>
                  toggle(mode === "pickup" ? child.dropoffId : child.id)
                }
              />
            ))}
            {otherChoices.length > 0 ? (
              <button
                type="button"
                aria-pressed={othersOpen}
                aria-expanded={othersOpen}
                onClick={toggleOthers}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-5 py-4 text-left",
                  othersOpen
                    ? "bg-orange-50 text-foreground ring-2 ring-[#e07a2f]"
                    : "bg-background text-muted-foreground"
                )}
              >
                <span className="font-medium">Other children</span>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full",
                    othersOpen ? "bg-[#e07a2f] text-white" : "bg-muted"
                  )}
                >
                  {othersOpen ? <Check className="size-4" /> : null}
                </span>
              </button>
            ) : null}
            {othersOpen
              ? otherChoices.map((child) => (
                  <ChildChoice
                    key={child.id}
                    child={child}
                    mode={mode}
                    selected={selected.has(child.id)}
                    onToggle={() => toggle(child.id)}
                  />
                ))
              : null}
          </div>
          {save.error ? (
            <p className="text-sm text-destructive">
              {errorMessage(save.error)}
            </p>
          ) : null}
          <Button
            type="button"
            className={cn(
              "h-12 text-white",
              mode === "pickup"
                ? "bg-[#1070b3] hover:bg-[#1070b3]/90"
                : "bg-[#e07a2f] hover:bg-[#e07a2f]/90"
            )}
            disabled={selected.size === 0 || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Sending…" : "Confirm"}
          </Button>
        </>
      )}
    </div>
  )
}
function ChildChoice({ child, mode, selected, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between rounded-2xl px-5 py-4 text-left",
        selected
          ? mode === "pickup"
            ? "bg-sky-50 ring-2 ring-[#1070b3]"
            : "bg-orange-50 ring-2 ring-[#e07a2f]"
          : "bg-background text-muted-foreground"
      )}
    >
      <span>
        <span
          className={cn("block font-medium", selected && "text-foreground")}
        >
          {child.name}
        </span>
        {child.classLabel ? (
          <span className="block text-xs text-muted-foreground">
            {child.classLabel}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full",
          selected
            ? mode === "pickup"
              ? "bg-[#1070b3] text-white"
              : "bg-[#e07a2f] text-white"
            : "bg-muted"
        )}
      >
        {selected ? <Check className="size-4" /> : null}
      </span>
    </button>
  )
}
