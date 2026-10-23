import { useQuery } from "@tanstack/react-query"
import { Maximize2, Minimize2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getPendingPickups } from "@/api/gate"
import { errorMessage } from "@/lib/errors"
import { useAuth } from "@/lib/auth"
import { queryKeys } from "@/lib/queryClient"
import { cn } from "@/lib/utils"
const filterKey = "gisu.board.grades"
function gradeFromLabel(label) {
  if (!label) {
    return "Other"
  }
  const match = label.match(/^(Year\s+\d+|Early Years(?:\s+\d+)?|Nursery|KG\s*\d*)/i)
  if (match) {
    return match[1].replace(/\s+/g, " ").trim()
  }
  const beforeStream = label.replace(/[A-Z]$/, "").trim()
  return beforeStream || label
}
function loadGrades() {
  try {
    const raw = localStorage.getItem(filterKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
export function PickupBoardPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [selectedGrades, setSelectedGrades] = useState(loadGrades)
  const [fullscreen, setFullscreen] = useState(false)
  const boardQuery = useQuery({
    queryKey: queryKeys.pendingPickups,
    queryFn: getPendingPickups,
    refetchInterval: 3000,
    staleTime: 0,
  })
  const students = boardQuery.data?.students ?? []
  const grades = useMemo(() => {
    const set = new Set(students.map((student) => gradeFromLabel(student.classLabel)))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [students])
  const visible = useMemo(() => {
    if (selectedGrades.length === 0) {
      return students
    }
    const allowed = new Set(selectedGrades)
    return students.filter((student) =>
      allowed.has(gradeFromLabel(student.classLabel))
    )
  }, [students, selectedGrades])
  useEffect(() => {
    localStorage.setItem(filterKey, JSON.stringify(selectedGrades))
  }, [selectedGrades])
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        setFullscreen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  function toggleGrade(grade) {
    setSelectedGrades((current) =>
      current.includes(grade)
        ? current.filter((item) => item !== grade)
        : [...current, grade]
    )
  }
  function handleSignOut() {
    signOut()
    navigate("/login")
  }
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        fullscreen
          ? "fixed inset-0 z-50 bg-[oklch(0.97_0_0)] p-6 md:p-10"
          : "gap-6"
      )}
    >
      {!fullscreen ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base text-muted-foreground">
                Parents at the gate · waiting for confirmation
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {visible.length} student{visible.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium shadow-md"
                onClick={() => setFullscreen(true)}
              >
                <Maximize2 className="size-4" />
                Full screen
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </div>
          {grades.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  selectedGrades.length === 0
                    ? "bg-[#108040] text-white"
                    : "bg-background text-muted-foreground"
                )}
                onClick={() => setSelectedGrades([])}
              >
                All grades
              </button>
              {grades.map((grade) => {
                const active = selectedGrades.includes(grade)
                return (
                  <button
                    key={grade}
                    type="button"
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm",
                      active
                        ? "bg-[#108040] text-white"
                        : "bg-background text-muted-foreground"
                    )}
                    onClick={() => toggleGrade(grade)}
                  >
                    {grade}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          aria-label="Exit full screen"
          className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-2 text-sm shadow-md"
          onClick={() => setFullscreen(false)}
        >
          <Minimize2 className="size-4" />
          Exit
        </button>
      )}
      {boardQuery.error ? (
        <p className="text-sm text-destructive">
          {errorMessage(boardQuery.error)}
        </p>
      ) : null}
      {visible.length === 0 && !boardQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <p
            className={cn(
              "text-muted-foreground",
              fullscreen ? "text-3xl" : "text-lg"
            )}
          >
            No pending pickups
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "grid content-start gap-3 overflow-y-auto",
            fullscreen
              ? "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {visible.map((student) => (
            <article
              key={student.id}
              className={cn(
                "board-name rounded-2xl bg-background px-5 py-4 shadow-md",
                fullscreen && "px-8 py-8"
              )}
            >
              <p
                className={cn(
                  "font-semibold tracking-tight",
                  fullscreen ? "text-4xl md:text-5xl" : "text-2xl"
                )}
              >
                {student.name}
              </p>
              {student.classLabel ? (
                <p
                  className={cn(
                    "mt-2 text-muted-foreground",
                    fullscreen ? "text-xl" : "text-sm"
                  )}
                >
                  {student.classLabel}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
