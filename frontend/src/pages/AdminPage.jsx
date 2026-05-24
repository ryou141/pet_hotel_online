import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/admin/AdminLayout'
import Dashboard from '../components/admin/Dashboard'
import StaffDashboard from '../components/admin/StaffDashboard'
import ClientsManager from '../components/admin/ClientsManager'
import PetsManager from '../components/admin/PetsManager'
import RoomsManager from '../components/admin/RoomsManager'
import CamerasManager from '../components/admin/CamerasManager'
import StaffManager from '../components/admin/StaffManager'
import GalleryManager from '../components/admin/GalleryManager'
import BookingsManager from '../components/admin/BookingsManager'
import NotesManager from '../components/admin/NotesManager'
import TariffsManager from '../components/admin/TariffsManager'

export default function AdminPage() {
  const { user } = useAuth()
  const isStaff = user?.role === 'staff'

  return (
    <AdminLayout>
      <Routes>
        <Route index element={isStaff ? <StaffDashboard /> : <Dashboard />} />
        <Route path="pets"     element={<PetsManager />} />
        <Route path="notes"    element={<NotesManager />} />

        {/* Admin-only — staff gets redirected to main */}
        <Route path="bookings" element={isStaff ? <Navigate to="/admin" replace /> : <BookingsManager />} />
        <Route path="clients"  element={isStaff ? <Navigate to="/admin" replace /> : <ClientsManager />} />
        <Route path="rooms"    element={isStaff ? <Navigate to="/admin" replace /> : <RoomsManager />} />
        <Route path="cameras"  element={isStaff ? <Navigate to="/admin" replace /> : <CamerasManager />} />
        <Route path="staff"    element={isStaff ? <Navigate to="/admin" replace /> : <StaffManager />} />
        <Route path="gallery"  element={isStaff ? <Navigate to="/admin" replace /> : <GalleryManager />} />
        <Route path="tariffs"  element={isStaff ? <Navigate to="/admin" replace /> : <TariffsManager />} />
      </Routes>
    </AdminLayout>
  )
}
