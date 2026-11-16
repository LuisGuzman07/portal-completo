import React from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import InstitucionalPage from './pages/public/InstitucionalPage';
import InvestigadoresPage from './pages/public/InvestigadoresPage';
import InvestigadorDetailPage from './pages/public/InvestigadorDetailPage';
import RepositorioAcademicoPage from './pages/public/RepositorioAcademicoPage';
import PublicacionDetailPage from './pages/public/PublicacionDetailPage';
import AccesoMiembrosPage from './pages/auth/AccesoMiembrosPage';
import ConfirmarCuentaPage from './pages/auth/ConfirmarCuentaPage';

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
import AdminEventosPage from './pages/institutional/AdminEventosPage';
import EventosPage from './pages/public/EventosPage';
import AdminNoticiasPage from './pages/institutional/AdminNoticiasPage';
import NoticiasPage from './pages/public/NoticiasPage';
import AdminMultimediaPage from './pages/institutional/AdminMultimediaPage';
import MultimediaPage from './pages/public/MultimediaPage';
import AdminConveniosPage from './pages/institutional/AdminConveniosPage';
import ConveniosPage from './pages/public/ConveniosPage';
import SolicitudIncorporacionPage from './pages/public/SolicitudIncorporacionPage';
import EvaluarSolicitudesPage from './pages/academic/EvaluarSolicitudesPage';

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
          <Route path="/institucional" element={<InstitucionalPage />} />
          <Route path="/investigadores" element={<InvestigadoresPage />} />
          <Route path="/investigadores/:id" element={<InvestigadorDetailPage />} />
          <Route path="/repositorio" element={<RepositorioAcademicoPage />} />
          <Route path="/repositorio/:id" element={<PublicacionDetailPage />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="/noticias" element={<NoticiasPage />} />
          <Route path="/multimedia" element={<MultimediaPage />} />
          <Route path="/convenios" element={<ConveniosPage />} />
          <Route path="/solicitud-incorporacion" element={<SolicitudIncorporacionPage />} />
          <Route path="/acceso-miembros" element={<AccesoMiembrosPage />} />
          <Route path="/confirmar-cuenta" element={<ConfirmarCuentaPage />} />
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
          <Route path="eventos" element={<AdminEventosPage />} />
          <Route path="noticias" element={<AdminNoticiasPage />} />
          <Route path="multimedia" element={<AdminMultimediaPage />} />
          <Route path="convenios" element={<AdminConveniosPage />} />
          <Route path="solicitudes-incorporacion" element={<EvaluarSolicitudesPage />} />
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
