import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { PublicQuizJoinPage } from './pages/public/PublicQuizJoinPage.js';
import { StudentLayout } from './layouts/StudentLayout.js';
import { AdminLayout } from './layouts/AdminLayout.js';

import { StudentDashboardPage } from './pages/student/StudentDashboardPage.js';
import { QuizExamPage } from './pages/student/QuizExamPage.js';
import { StudentResultPage } from './pages/student/StudentResultPage.js';
import { StudentAnalyticsPage } from './pages/student/StudentAnalyticsPage.js';
import { StudentProfilePage } from './pages/student/StudentProfilePage.js';

import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminQuizListPage } from './pages/admin/AdminQuizListPage.js';
import { AdminQuizEditorPage } from './pages/admin/AdminQuizEditorPage.js';
import { AdminPdfImportPage } from './pages/admin/AdminPdfImportPage.js';
import { AdminAiQuizGeneratorPage } from './pages/admin/AdminAiQuizGeneratorPage.js';
import { AdminQuizReportPage } from './pages/admin/AdminQuizReportPage.js';
import { AdminRegistrationSettingsPage } from './pages/admin/AdminRegistrationSettingsPage.js';
import { AdminProfilePage } from './pages/admin/AdminProfilePage.js';
import { AdminMarkingPanelPage } from './pages/admin/AdminMarkingPanelPage.js';
import { PanelDashboardPage } from './pages/panel/PanelDashboardPage.js';
import { UserRole } from './types/index.js';

const ProtectedRoute: React.FC<{
  children: React.ReactElement;
  requiredRole?: UserRole | UserRole[];
}> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950/90 text-slate-400 gap-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading Examination Portal...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      if (user.role === 'MARKING_PANEL') return <Navigate to="/panel/dashboard" replace />;
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

export const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Global Background with Ambient Gradient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Ambient Gradients for Dark and Light Modes */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 dark:bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 dark:bg-gradient-to-tr dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-950/50 bg-gradient-to-tr from-slate-50 via-slate-50/90 to-blue-50/40" />
        <div className="absolute inset-0 dark:bg-[radial-gradient(circle_at_75%_25%,_rgba(30,58,138,0.22)_0%,_rgba(11,15,25,0.85)_55%,_#0b0f19_100%)] bg-[radial-gradient(circle_at_75%_25%,_rgba(59,130,246,0.08)_0%,_rgba(248,250,252,0.85)_55%,_#f8fafc_100%)]" />
        <div className="absolute inset-0 dark:bg-gradient-to-b dark:from-transparent dark:via-slate-950/50 dark:to-slate-950/95 bg-gradient-to-b from-transparent via-slate-50/40 to-slate-50/90" />
      </div>

      {/* Main App Content Stack */}
      <div className="relative z-10 flex-1 flex flex-col">
        <Routes>
          {/* Root redirect */}
          <Route
            path="/"
            element={
              user ? (
                user.role === 'ADMIN' ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : user.role === 'MARKING_PANEL' ? (
                  <Navigate to="/panel/dashboard" replace />
                ) : (
                  <Navigate to="/student/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

      {/* Auth & Public Share Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/quiz/:quizId" element={<PublicQuizJoinPage />} />

      {/* Student Protected Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="analytics" element={<StudentAnalyticsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="results/:resultId" element={<StudentResultPage />} />
      </Route>

      {/* Standalone Distraction-free Exam View */}
      <Route
        path="/student/quiz/:quizId/take"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <QuizExamPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="quizzes" element={<AdminQuizListPage />} />
        <Route path="quizzes/create" element={<AdminQuizEditorPage />} />
        <Route path="quizzes/:quizId/edit" element={<AdminQuizEditorPage />} />
        <Route path="pdf-import" element={<AdminPdfImportPage />} />
        <Route path="ai-generator" element={<AdminAiQuizGeneratorPage />} />
        <Route path="marking-panel" element={<AdminMarkingPanelPage />} />
        <Route path="registration-settings" element={<AdminRegistrationSettingsPage />} />
        <Route path="quizzes/:quizId/report" element={<AdminQuizReportPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* Marking Panel Member Protected Routes */}
      <Route
        path="/panel/dashboard"
        element={
          <ProtectedRoute requiredRole={['MARKING_PANEL', 'ADMIN']}>
            <PanelDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </div>
  </div>
  );
};
