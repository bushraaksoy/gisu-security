import { useEffect, useRef, useState } from "react"
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
  imageUrl,
  className,
}) {
  const color = colorFor(id || name)
  const initials = initialsFor({ givenName, surname, name })
  const src = typeof imageUrl === "string" ? imageUrl.trim() : ""
  const imageRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  function noteImage(image) {
    if (!image?.complete) {
      return
    }
    if (image.naturalWidth > 0) {
      setLoaded(true)
      return
    }
    setFailed(true)
  }
  useEffect(() => {
    setLoaded(false)
    setFailed(false)
    noteImage(imageRef.current)
  }, [src])
  const showImage = Boolean(src) && loaded && !failed
  return (
    <span
      className={cn(
        "inline-flex size-12 shrink-0 rounded-full bg-[#e8e8ec] p-px shadow-[0_0_0_2px_#fff,0_0_0_3px_#d4d4d8]",
        className
      )}
      aria-hidden="true"
    >
      <span
        className="relative flex size-full items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
        style={{ backgroundColor: color.bg, color: color.ink }}
      >
        {initials}
        {src && !failed ? (
          <img
            ref={(node) => {
              imageRef.current = node
              noteImage(node)
            }}
            src={src}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover",
              showImage ? "opacity-100" : "opacity-0"
            )}
            onLoad={(event) => noteImage(event.currentTarget)}
            onError={() => setFailed(true)}
          />
        ) : null}
      </span>
    </span>
  )
}
