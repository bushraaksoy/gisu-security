import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { listGateLogs } from "@/api/gateLogs"
import { queryKeys } from "@/lib/queryClient"
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
function waitingVisits(logs) {
  const groups = new Map()
  for (const log of logs) {
    if (log.status !== "PENDING") {
      continue
    }
    const key = log.visitId ?? log.id
    const list = groups.get(key) ?? []
    list.push(log)
    groups.set(key, list)
  }
  return [...groups.values()].map((children) => {
    const first = children[0]
    return {
      key: first.visitId ?? first.id,
      type: first.type,
      parentName: personName(first),
    }
  })
}
export function GateAlerts() {
  const seen = useRef(null)
  const logsQuery = useQuery({
    queryKey: queryKeys.gateLogs,
    queryFn: () => listGateLogs(),
    refetchInterval: 5000,
    staleTime: 0,
  })
  useEffect(() => {
    if (!logsQuery.data) {
      return
    }
    const waiting = waitingVisits(logsQuery.data)
    const keys = new Set(waiting.map((visit) => visit.key))
    if (seen.current) {
      for (const visit of waiting) {
        if (!seen.current.has(visit.key)) {
          toast(`${visit.parentName} is at the gate`, {
            description: typeLabels[visit.type],
          })
        }
      }
    }
    seen.current = keys
  }, [logsQuery.data])
  return null
}
