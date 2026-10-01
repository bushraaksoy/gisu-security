import { QueryClient } from "@tanstack/react-query"
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
})
export const queryKeys = {
  me: ["me"],
  users: ["users"],
  localStudents: ["local-students"],
  gateLogs: ["gate-logs"],
  gateLogsOn: (date) => ["gate-logs", date],
  gateStudents: (query) => ["gate-students", query],
  gateToday: ["gate-today"],
  gateAllowed: ["gate-allowed"],
  gatePermissions: ["gate-permissions"],
  present: ["present"],
  directory: ["directory"],
}
