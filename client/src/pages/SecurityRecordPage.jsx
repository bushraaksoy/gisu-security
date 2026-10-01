import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { recordGateVisit, searchGateStudents } from "@/api/gate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/errors"
import { queryKeys } from "@/lib/queryClient"
import { transports } from "@/lib/transport"
import { cn } from "@/lib/utils"
export function SecurityRecordPage({ mode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [selected, setSelected] = useState([])
  const [company, setCompany] = useState(null)
  const [escortName, setEscortName] = useState("")
  const [transport, setTransport] = useState(null)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])
  const search = useQuery({
    queryKey: queryKeys.gateStudents(debounced),
    queryFn: () => searchGateStudents(debounced),
    enabled: debounced.length >= 2,
  })
  const save = useMutation({
    mutationFn: () =>
      recordGateVisit({
        type: mode === "pickup" ? "PICKUP" : "DROPOFF",
        studentIds: selected.map((student) => student.id),
        transport,
        alone: company === "alone",
        escortName: company === "other" ? escortName.trim() : undefined,
      }),
    onSuccess: async () => {
      toast.success(mode === "pickup" ? "Pick up logged" : "Drop off logged")
      await queryClient.invalidateQueries({ queryKey: queryKeys.gateLogs })
      await queryClient.invalidateQueries({ queryKey: queryKeys.present })
      navigate("/logs")
    },
  })
  const results = (search.data ?? []).filter(
    (student) => !selected.some((item) => item.id === student.id)
  )
  function addStudent(student) {
    setSelected((current) =>
      current.some((item) => item.id === student.id)
        ? current
        : [...current, student]
    )
  }
  function confirm() {
    if (selected.length === 0) {
      toast.error("Choose a student")
      return
    }
    if (!company) {
      toast.error("Say who is with the student")
      return
    }
    if (company === "other" && escortName.trim().length < 2) {
      toast.error("Enter who is with the student")
      return
    }
    if (!transport) {
      toast.error("Select a transport first")
      return
    }
    save.mutate()
  }
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students"
        aria-label="Search students"
        className="h-9 rounded-full bg-background px-3 py-0 leading-9 placeholder:text-xs placeholder:leading-9 placeholder:text-[oklch(0.75_0_0)]"
      />
      {selected.length > 0 ? (
        <div className="flex flex-col gap-2">
          {selected.map((student) => (
            <div
              key={student.id}
              className={cn(
                "flex items-center justify-between rounded-2xl px-5 py-4",
                mode === "pickup"
                  ? "bg-sky-50 ring-2 ring-[#1070b3]"
                  : "bg-orange-50 ring-2 ring-[#e07a2f]"
              )}
            >
              <span>
                <span className="block font-medium">{student.name}</span>
                {student.classLabel ? (
                  <span className="block text-xs text-muted-foreground">
                    {student.classLabel}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label={`Remove ${student.name}`}
                className="flex size-8 items-center justify-center rounded-full bg-background"
                onClick={() =>
                  setSelected((current) =>
                    current.filter((item) => item.id !== student.id)
                  )
                }
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {debounced.length < 2 ? (
        <p className="text-sm text-muted-foreground">Type a name to search.</p>
      ) : search.isPending ? (
        <p className="text-sm text-muted-foreground">Searching…</p>
      ) : search.error ? (
        <p className="text-sm text-destructive">{errorMessage(search.error)}</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => addStudent(student)}
              className="flex items-center justify-between rounded-2xl bg-background px-5 py-4 text-left"
            >
              <span>
                <span className="block font-medium">{student.name}</span>
                {student.classLabel ? (
                  <span className="block text-xs text-muted-foreground">
                    {student.classLabel}
                  </span>
                ) : null}
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                <Plus className="size-4 text-muted-foreground" />
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          {mode === "pickup" ? "Who is collecting them" : "Who brought them"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={company === "alone"}
            onClick={() => setCompany("alone")}
            className={cn(
              "flex h-11 items-center justify-center rounded-full bg-background text-sm font-medium",
              company === "alone"
                ? "text-[#0b3b5c] ring-2 ring-[#1070b3]"
                : "text-muted-foreground"
            )}
          >
            Alone
          </button>
          <button
            type="button"
            aria-pressed={company === "other"}
            onClick={() => setCompany("other")}
            className={cn(
              "flex h-11 items-center justify-center rounded-full bg-background text-sm font-medium",
              company === "other"
                ? "text-[#0b3b5c] ring-2 ring-[#1070b3]"
                : "text-muted-foreground"
            )}
          >
            Someone else
          </button>
        </div>
        {company === "other" ? (
          <Input
            value={escortName}
            onChange={(event) => setEscortName(event.target.value)}
            placeholder="Name"
            aria-label="Name of the person with the student"
            className="h-11 rounded-lg bg-background px-3"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Transport</p>
        <div className="grid grid-cols-2 gap-2">
          {transports.map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={transport === value}
              onClick={() => setTransport(value)}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-full bg-background text-sm font-medium",
                transport === value
                  ? "text-[#0b3b5c] ring-2 ring-[#1070b3]"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {save.error ? (
        <p className="text-sm text-destructive">{errorMessage(save.error)}</p>
      ) : null}
      <Button
        type="button"
        className={cn(
          "h-12 text-white",
          mode === "pickup"
            ? "bg-[#1070b3] hover:bg-[#1070b3]/90"
            : "bg-[#e07a2f] hover:bg-[#e07a2f]/90"
        )}
        disabled={save.isPending}
        onClick={confirm}
      >
        {save.isPending ? "Saving…" : "Confirm"}
      </Button>
    </div>
  )
}
