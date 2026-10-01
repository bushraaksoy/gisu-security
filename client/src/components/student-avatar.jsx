import { cn } from "@/lib/utils"
const palette = [
  { bg: "#efe6f8", ink: "#6b4f8a" },
  { bg: "#e3eefb", ink: "#3a6eae" },
  { bg: "#e5f4e8", ink: "#4d8a5e" },
  { bg: "#f8eadc", ink: "#c47a32" },
  { bg: "#f8e4e8", ink: "#c45d73" },
  { bg: "#e3f3f6", ink: "#3d8a99" },
]
function colorFor(id) {
  let hash = 0
  const text = String(id ?? "")
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return palette[hash % palette.length]
}
function letter(value) {
  return value?.trim().charAt(0) ?? ""
}
function initialsFor({ givenName, surname, name }) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  const first = letter(givenName) || letter(parts[0])
  const last =
    letter(surname) || letter(parts.length > 1 ? parts[parts.length - 1] : "")
  return `${first}${last}`.toUpperCase()
}
export function StudentAvatar({
  id,
  givenName,
  surname,
  name,
  className,
}) {
  const color = colorFor(id || name)
  const initials = initialsFor({ givenName, surname, name })
  return (
    <span
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        className
      )}
      style={{ backgroundColor: color.bg, color: color.ink }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
