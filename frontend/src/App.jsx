import { Navigate, Route, Routes } from 'react-router-dom'
import PortalShell from './components/PortalShell.jsx'
import LandingPage from './pages/LandingPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RequestsPage from './pages/RequestsPage.jsx'
import RequestFormPage from './pages/RequestFormPage.jsx'
import RequestDetailPage from './pages/RequestDetailPage.jsx'
import AssistantPage from './pages/AssistantPage.jsx'
import { ActivityPage, AdminCategoriesPage, AdminKnowledgePage, KnowledgePage, ProfilePage, StaffPage } from './pages/UtilityPages.jsx'
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx'
import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFound() {
  return <main className="not-found-page"><span className="not-found-mark"><Compass size={26} /></span><span className="eyebrow"><span className="eyebrow-dot" /> PAGE NOT FOUND</span><h1>Looks like we've taken a wrong turn.</h1><p>The page you're looking for could not be found.</p><Link to="/" className="button button-blue"><ArrowLeft size={15} /> Back to homepage</Link></main>
}

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/app" element={<PortalShell />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="requests" element={<RequestsPage />} />
      <Route path="requests/new" element={<RequestFormPage />} />
      <Route path="requests/:id" element={<RequestDetailPage />} />
      <Route path="assistant" element={<AssistantPage />} />
      <Route path="knowledge" element={<KnowledgePage />} />
      <Route path="activity" element={<ActivityPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="staff/requests" element={<StaffPage />} />
      <Route path="staff/requests/:id" element={<RequestDetailPage />} />
      <Route path="admin/categories" element={<AdminCategoriesPage />} />
      <Route path="admin/knowledge" element={<AdminKnowledgePage />} />
      <Route path="admin/dashboard" element={<AdminCategoriesPage />} />
      <Route path="admin/users" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
}
