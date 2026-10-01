export function usernameFromName(name) {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .join(".")
  return slug.length >= 3 ? slug.slice(0, 64) : "user"
}
