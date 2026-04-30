import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { auth } from "@/lib/auth"

import Home         from "@/pages/public/Home"
import Events       from "@/pages/public/Events"
import About        from "@/pages/public/About"
import EventDetail  from "@/pages/portal/EventDetail"
import Login        from "@/pages/auth/Login"
import AuthCallback from "@/pages/auth/Callback"
import Dashboard    from "@/pages/portal/Dashboard"
import Profile      from "@/pages/portal/Profile"
import Children     from "@/pages/portal/Children"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import FamilyDetail   from "@/pages/admin/FamilyDetail"
import AdminSettings  from "@/pages/admin/Settings"
import QuickAdd       from "@/pages/admin/QuickAdd"
import AcceptInvite from "@/pages/invite/Accept"

function ProtectedRoute() {
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/"              element={<Home />} />
        <Route path="/events"        element={<Events />} />
        <Route path="/about"         element={<About />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />

        {/* Protected portal + admin */}
        <Route element={<ProtectedRoute />}>
          <Route path="/portal"           element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/dashboard" element={<Dashboard />} />
          <Route path="/portal/profile"   element={<Profile />} />
          <Route path="/portal/children"  element={<Children />} />
          <Route path="/events/:id"       element={<EventDetail />} />
          <Route path="/admin"                  element={<AdminDashboard />} />
          <Route path="/admin/families/:id"    element={<FamilyDetail />} />
          <Route path="/admin/settings"        element={<AdminSettings />} />
          <Route path="/admin/quick-add"       element={<QuickAdd />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
