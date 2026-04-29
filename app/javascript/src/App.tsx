import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

import Home         from "@/pages/public/Home"
import Events       from "@/pages/public/Events"
import About        from "@/pages/public/About"
import EventDetail  from "@/pages/portal/EventDetail"
import Login        from "@/pages/auth/Login"
import Dashboard    from "@/pages/portal/Dashboard"
import Profile      from "@/pages/portal/Profile"
import Children     from "@/pages/portal/Children"
import QuickAdd     from "@/pages/admin/QuickAdd"
import AcceptInvite from "@/pages/invite/Accept"

function ProtectedRoute() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <Navigate to="/login" replace />
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
        <Route path="/invite/:token" element={<AcceptInvite />} />

        {/* Protected portal + admin */}
        <Route element={<ProtectedRoute />}>
          <Route path="/portal"           element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/dashboard" element={<Dashboard />} />
          <Route path="/portal/profile"   element={<Profile />} />
          <Route path="/portal/children"  element={<Children />} />
          <Route path="/events/:id"       element={<EventDetail />} />
          <Route path="/admin/quick-add"  element={<QuickAdd />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
