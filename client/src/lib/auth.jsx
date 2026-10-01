import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useMemo, useState } from "react"
import { login as loginRequest, me } from "@/api/auth"
import { tokenKey } from "@/api/client"
import { queryKeys } from "@/lib/queryClient"
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey))
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: me,
    enabled: Boolean(token),
    retry: false,
  })
  const value = useMemo(
    () => ({
      token,
      user: meQuery.data ?? null,
      isLoading: Boolean(token) && meQuery.isPending,
      async login(username, password) {
        const result = await loginRequest(username, password)
        localStorage.setItem(tokenKey, result.token)
        setToken(result.token)
        queryClient.setQueryData(queryKeys.me, result.user)
        return result.user
      },
      signOut() {
        localStorage.removeItem(tokenKey)
        setToken(null)
        queryClient.clear()
      },
    }),
    [token, meQuery.data, meQuery.isPending, queryClient]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return value
}
