import { QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"
import "./index.css"
import { ThemeProvider } from "@/components"
import { queryClient } from "@/lib/queryClient"
import App from "./App.jsx"
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <App />
        <Toaster position="top-center" richColors offset={16} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
