export function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user
  return publicUser
}
