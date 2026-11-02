import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { RootLayout } from "@/layouts"
import { homeForRole } from "@/layouts/nav"
import { useAuth, AuthProvider } from "@/lib/auth"
import {
  AbsentPage,
  AssignPersonPage,
  DashboardPage,
  GateVisitPage,
  GuardianDetailPage,
  HomePage,
  InSchoolPage,
  GuardiansPage,
  LoginPage,
  LogsPage,
  PickedUpPage,
  PickupBoardPage,
  AccountPage,
  ChangePasswordPage,
  SecurityRecordPage,
  SettingsPage,
  StudentDetailPage,
  StudentsPage,
  UsersPage,
} from "@/pages"
import { GuestOnly, RequireAuth, RequireRole } from "@/routes/guards"
export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route element={<RequireAuth />}>
            <Route element={<RootLayout />}>
              <Route index element={<HomeRedirect />} />
              <Route
                path="board"
                element={
                  <RequireRole roles={["DISPLAY"]}>
                    <PickupBoardPage />
                  </RequireRole>
                }
              />
              <Route
                path="home"
                element={
                  <RequireRole roles={["PARENT"]}>
                    <HomePage />
                  </RequireRole>
                }
              />
              <Route
                path="dropoff"
                element={
                  <RequireRole roles={["PARENT"]}>
                    <GateVisitPage mode="dropoff" />
                  </RequireRole>
                }
              />
              <Route
                path="pickup"
                element={
                  <RequireRole roles={["PARENT"]}>
                    <GateVisitPage mode="pickup" />
                  </RequireRole>
                }
              />
              <Route
                path="dashboard"
                element={
                  <RequireRole roles={["SUPERADMIN", "ADMIN"]}>
                    <DashboardPage />
                  </RequireRole>
                }
              />
              <Route
                path="users"
                element={
                  <RequireRole roles={["SUPERADMIN", "ADMIN"]}>
                    <UsersPage />
                  </RequireRole>
                }
              />
              <Route
                path="in-school"
                element={
                  <RequireRole roles={["SUPERADMIN", "ADMIN"]}>
                    <InSchoolPage />
                  </RequireRole>
                }
              />
              <Route
                path="absent"
                element={
                  <RequireRole roles={["SUPERADMIN", "ADMIN"]}>
                    <AbsentPage />
                  </RequireRole>
                }
              />
              <Route
                path="picked-up"
                element={
                  <RequireRole roles={["SUPERADMIN", "ADMIN"]}>
                    <PickedUpPage />
                  </RequireRole>
                }
              />
              <Route
                path="students"
                element={
                  <RequireRole roles={["SUPERADMIN", "PARENT"]}>
                    <StudentsPage />
                  </RequireRole>
                }
              />
              <Route
                path="students/:studentId"
                element={
                  <RequireRole roles={["SUPERADMIN"]}>
                    <StudentDetailPage />
                  </RequireRole>
                }
              />
              <Route
                path="guardians"
                element={
                  <RequireRole roles={["SUPERADMIN"]}>
                    <GuardiansPage />
                  </RequireRole>
                }
              />
              <Route
                path="guardians/:guardianId"
                element={
                  <RequireRole roles={["SUPERADMIN"]}>
                    <GuardianDetailPage />
                  </RequireRole>
                }
              />
              <Route
                path="logs"
                element={
                  <RequireRole roles={["SUPERADMIN", "ADMIN", "SECURITY"]}>
                    <LogsRoute />
                  </RequireRole>
                }
              />
              <Route
                path="today"
                element={
                  <RequireRole roles={["SECURITY"]}>
                    <LogsPage view="today" />
                  </RequireRole>
                }
              />
              <Route
                path="log-dropoff"
                element={
                  <RequireRole roles={["SECURITY"]}>
                    <SecurityRecordPage mode="dropoff" />
                  </RequireRole>
                }
              />
              <Route
                path="log-pickup"
                element={
                  <RequireRole roles={["SECURITY"]}>
                    <SecurityRecordPage mode="pickup" />
                  </RequireRole>
                }
              />
              <Route
                path="settings"
                element={
                  <RequireRole
                    roles={["ADMIN", "PARENT", "SUPERADMIN", "SECURITY"]}
                  >
                    <SettingsPage />
                  </RequireRole>
                }
              />
              <Route
                path="settings/profile"
                element={
                  <RequireRole
                    roles={["ADMIN", "PARENT", "SUPERADMIN", "SECURITY"]}
                  >
                    <AccountPage />
                  </RequireRole>
                }
              />
              <Route
                path="settings/password"
                element={
                  <RequireRole roles={["ADMIN", "PARENT", "SUPERADMIN"]}>
                    <ChangePasswordPage />
                  </RequireRole>
                }
              />
              <Route
                path="settings/assign"
                element={
                  <RequireRole roles={["PARENT"]}>
                    <AssignPersonPage />
                  </RequireRole>
                }
              />
              <Route path="profile/*" element={<Navigate to="/settings" replace />} />
              <Route path="*" element={<HomeRedirect />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
function HomeRedirect() {
  const { user } = useAuth()
  if (!user) {
    return null
  }
  return <Navigate to={homeForRole(user.role)} replace />
}
function LogsRoute() {
  const { user } = useAuth()
  return <LogsPage view={user?.role === "SECURITY" ? "waiting" : "today"} />
}
