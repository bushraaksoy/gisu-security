import { Clock, House, School, X } from "lucide-react"

export const gateStates = {
  waiting: {
    label: "Waiting for the gate",
    icon: Clock,
    chip: "bg-amber-50 text-amber-800",
    iconWrap: "bg-amber-50 text-amber-700",
  },
  "at-school": {
    label: "At school",
    icon: School,
    chip: "bg-[#f3faf4] text-[#6a9a78]",
    iconWrap: "bg-[#f3faf4] text-[#7aa888]",
  },
  "picked-up": {
    label: "Picked up",
    icon: House,
    chip: "bg-sky-50 text-sky-800",
    iconWrap: "bg-sky-50 text-sky-700",
  },
  rejected: {
    label: "Not accepted",
    icon: X,
    chip: "bg-red-50 text-red-700",
    iconWrap: "bg-red-50 text-red-700",
  },
}
export function StatusBadge({ state }) {
  const status = gateStates[state]
  if (!status) {
    return null
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.chip}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status.label}
    </span>
  )
}
