import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FinancePage } from '@/modules/finance';
import { CalendarPage } from '@/modules/big-calendar';
import { EmailPage } from '@/modules/email';
import { ChatPage } from '@/modules/chat';
import { NotFoundPage, ServiceUnavailablePage } from '@/modules/error-view';
import { FileManagerMyFilesPage, SharedWithMePage, TrashPage } from '@/modules/file-manager';
import { ActivityLogPage, TimelinePage } from '@/modules/activity-log';
import { InventoryPage, InventoryDetailsPage, InventoryFormPage } from '@/modules/inventory';
import {
  InvoicesPage,
  InvoiceDetailsPage,
  CreateInvoicePage,
  EditInvoicePage,
} from '@/modules/invoices';
import { TaskManagerPage } from '@/modules/task-manager';
// Eager: LandingPage (route '/') must stay eager to preserve the first-paint
// budget for the marketing home. ProfilePage (route '/profile') is unrelated
// to the code-splitting target routes and stays eager as well.
import { ProfilePage, LandingPage } from '@/modules/profile';
import { UsersTablePage } from '@/modules/iam';
import { MainLayout } from '@/layout/main-layout/main-layout';
import { AuthRoutes } from './auth.route';
import { Guard } from '@/state/store/auth/guard';
import { ProtectedRoute } from '@/state/store/auth/protected-route';
import { ClientMiddleware } from '@/state/client-middleware';
import { ThemeProvider } from '@/styles/theme/theme-provider';
import { SidebarProvider } from '@/components/ui-kit/sidebar';
import { Toaster } from '@/components/ui-kit/toaster';
import { useLanguageContext } from '@/i18n/language-context';
import { LoadingOverlay } from '@/components/core';

// Code-split profile routes. Each lazy() call imports directly from the page
// module (not the barrel) so Vite emits a dedicated chunk per route and we
// avoid pulling the whole `@/modules/profile` barrel into one bundle.
// See design.md §Performance Considerations (Code-splitting).
const ProfileEditorPage = lazy(() =>
  import('@/modules/profile/pages/profile-editor/profile-editor').then((m) => ({
    default: m.ProfileEditorPage,
  })),
);
const AppearancePage = lazy(() =>
  import('@/modules/profile/pages/appearance/appearance').then((m) => ({
    default: m.AppearancePage,
  })),
);
const SectionsPage = lazy(() =>
  import('@/modules/profile/pages/sections/sections').then((m) => ({
    default: m.SectionsPage,
  })),
);
const PreviewPage = lazy(() =>
  import('@/modules/profile/pages/preview/preview').then((m) => ({
    default: m.PreviewPage,
  })),
);
const AdminPage = lazy(() =>
  import('@/modules/profile/pages/admin/admin').then((m) => ({
    default: m.AdminPage,
  })),
);
const PublicProfilePage = lazy(() =>
  import('@/modules/profile/pages/public-profile/public-profile').then((m) => ({
    default: m.PublicProfilePage,
  })),
);
const BrowsePage = lazy(() =>
  import('@/modules/profile/pages/browse/browse').then((m) => ({
    default: m.BrowsePage,
  })),
);

export const AppRoutes = () => {
  const { isLoading } = useLanguageContext();

  if (isLoading) {
    return <LoadingOverlay />;
  }
  return (
    <div className="min-h-screen bg-background font-sans antialiased relative">
      <ClientMiddleware>
        <ThemeProvider>
          <SidebarProvider>
            <Suspense fallback={<LoadingOverlay />}>
              <Routes>
                {AuthRoutes}
                <Route path="/u/:username" element={<PublicProfilePage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/" element={<LandingPage />} />
                <Route
                  element={
                    <Guard>
                      <MainLayout />
                    </Guard>
                  }
                >
                  <Route path="/dashboard" element={<Navigate to="/dashboard/profile" replace />} />
                  <Route path="/dashboard/profile" element={<ProfileEditorPage />} />
                  <Route path="/dashboard/appearance" element={<AppearancePage />} />
                  <Route path="/dashboard/sections" element={<SectionsPage />} />
                  <Route path="/dashboard/preview" element={<PreviewPage />} />
                  <Route path="/dashboard/admin" element={<AdminPage />} />
                  <Route
                    path="/finance"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <FinancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/inventory/add" element={<InventoryFormPage />} />
                  <Route path="/inventory/:itemId" element={<InventoryDetailsPage />} />
                  <Route path="/activity-log" element={<ActivityLogPage />} />
                  <Route
                    path="/timeline"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <TimelinePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/mail" element={<EmailPage />} />
                  <Route path="/mail/:category" element={<EmailPage />} />
                  <Route path="/mail/:category/:emailId" element={<EmailPage />} />
                  <Route path="/mail/:category/:labels/:emailId" element={<EmailPage />} />
                  <Route path="/identity-management" element={<UsersTablePage />} />
                  <Route path="/task-manager" element={<TaskManagerPage />} />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/invoices/create-invoice" element={<CreateInvoicePage />} />
                  <Route path="/invoices/:invoiceId/edit" element={<EditInvoicePage />} />
                  <Route path="/invoices/:invoiceId" element={<InvoiceDetailsPage />} />
                  <Route path="/file-manager/my-files" element={<FileManagerMyFilesPage />} />
                  <Route path="/file-manager/shared-files" element={<SharedWithMePage />} />
                  <Route path="/file-manager/trash" element={<TrashPage />} />
                  <Route
                    path="/file-manager/my-files/:folderId"
                    element={<FileManagerMyFilesPage />}
                  />
                  <Route
                    path="/file-manager/shared-files/:folderId"
                    element={<SharedWithMePage />}
                  />
                  <Route path="/file-manager/trash/:folderId" element={<TrashPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/503" element={<ServiceUnavailablePage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                </Route>

                {/* Redirects */}
                <Route path="/file-manager" element={<Navigate to="/file-manager/my-files" />} />
                <Route path="/my-files" element={<Navigate to="/file-manager/my-files" />} />
                <Route
                  path="/shared-files"
                  element={<Navigate to="/file-manager/shared-files" />}
                />
                <Route path="/trash" element={<Navigate to="/file-manager/trash" />} />

                <Route path="*" element={<Navigate to="/404" />} />
              </Routes>
            </Suspense>
          </SidebarProvider>
        </ThemeProvider>
      </ClientMiddleware>
      <Toaster />
    </div>
  );
};
