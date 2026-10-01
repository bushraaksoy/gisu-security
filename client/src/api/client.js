import axios from "axios"
export const tokenKey = "gisu.token"
export const client = axios.create({
  baseURL: "/api",
  headers: {
    "content-type": "application/json",
  },
})
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey)
  if (token) {
    config.headers.authorization = `Bearer ${token}`
  }
  return config
})
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ""
    const isLogin = url.endsWith("/auth/login")
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem(tokenKey)
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }
    return Promise.reject(error)
  }
)
