import { Navigate } from "react-router-dom"

// Children management is now part of the unified Profile / settings page.
export default function Children() {
  return <Navigate to="/portal/profile" replace />
}
