import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OTPPage from './pages/OTPPage';
import DashboardPage from './pages/DashboardPage';
import CaseListPage from './pages/CaseListPage';
import CaseDetailPage from './pages/CaseDetailPage';
import DocumentViewerPage from './pages/DocumentViewerPage';
import UploadPage from './pages/UploadPage';
import AuditTrailPage from './pages/AuditTrailPage';
import IntegrityDashboardPage from './pages/IntegrityDashboardPage';
import AlertsPage from './pages/AlertsPage';
import BreakGlassPage from './pages/BreakGlassPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDevicesPage from './pages/AdminDevicesPage';
import ProfilePage from './pages/ProfilePage';
import RAGAssistantPage from './pages/RAGAssistantPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OTPPage />} />

        {/* Main Application Shell (Inside Layout TopBar + Sidebar) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CaseListPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="docs/:id" element={<DocumentViewerPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="rag" element={<RAGAssistantPage />} />
          <Route path="audit" element={<AuditTrailPage />} />
          <Route path="audit/:docId" element={<AuditTrailPage />} />
          <Route path="integrity" element={<IntegrityDashboardPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="break-glass" element={<BreakGlassPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/devices" element={<AdminDevicesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
