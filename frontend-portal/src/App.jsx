import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import InvestigadoresPage from './pages/public/InvestigadoresPage';
import RepositorioAcademicoPage from './pages/public/RepositorioAcademicoPage';
import AccesoMiembrosPage from './pages/auth/AccesoMiembrosPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage';
import AdminRolesPage from './pages/admin/AdminRolesPage';
import AdminAuditoriaPage from './pages/admin/AdminAuditoriaPage';
import AcademicProfilePage from './pages/academic/AcademicProfilePage';
import AdminInvestigadoresPage from './pages/academic/AdminInvestigadoresPage';
import AdminMiembrosPage from './pages/academic/AdminMiembrosPage';
import AdminPublicacionesPage from './pages/publications/AdminPublicacionesPage';
import RevisionPublicacionesPage from './pages/publications/RevisionPublicacionesPage';

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <Header />
      <main className="w-full pt-20 bg-background min-h-screen flex flex-col flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes with Header & Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/investigadores" element={<InvestigadoresPage />} />
          <Route path="/repositorio" element={<RepositorioAcademicoPage />} />
          <Route path="/acceso-miembros" element={<AccesoMiembrosPage />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="perfil-academico" element={<AcademicProfilePage />} />
          <Route path="publicaciones" element={<AdminPublicacionesPage />} />
          <Route path="revisiones" element={<RevisionPublicacionesPage />} />
          <Route path="investigadores" element={<AdminInvestigadoresPage />} />
          <Route path="miembros" element={<AdminMiembrosPage />} />
          <Route path="usuarios" element={<AdminUsuariosPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="auditoria" element={<AdminAuditoriaPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
