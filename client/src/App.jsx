import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import NotFoundPage from './pages/NotFoundPage';
import CookieConsent from './components/CookieConsent';
import { analytics } from './services/analyticsService';

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Dynamic Meta Title Management
    const pathTitles = {
      '/': 'SākshyaChain Portal Gateway',
      '/login': 'Portal Gateway | SākshyaChain',
      '/otp': 'MFA OTP Verification | SākshyaChain',
      '/privacy': 'Privacy Policy | SākshyaChain Legal',
      '/terms': 'Terms of Service | SākshyaChain Governance',
      '/dashboard': 'Digital Vault Dashboard | SākshyaChain',
      '/cases': 'Case Management Directory | SākshyaChain',
      '/upload': 'Secure Evidence Upload | SākshyaChain',
      '/audit': 'Audit DAG Ledger | SākshyaChain',
      '/integrity': 'Cryptographic Integrity | SākshyaChain',
      '/break-glass': 'Break-Glass Emergency Access | SākshyaChain',
      '/rag': 'AI Legal Assistant | SākshyaChain'
    };

    const title = pathTitles[location.pathname] || 'SākshyaChain — Multi-Tenant Digital Vault';
    document.title = title;

    // Track privacy-preserving telemetry pageview
    analytics.trackPageView(location.pathname);
  }, [location]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        {/* Public & Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OTPPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />

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

        {/* Standalone Fallback 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Cookie Consent Banner */}
      <CookieConsent />
    </BrowserRouter>
  );
}
