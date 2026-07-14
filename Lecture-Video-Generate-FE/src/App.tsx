import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import UserProfile from './pages/user/Profile';
import CreateContent from './pages/user/CreateContent';
import MyVideos from './pages/user/MyVideos';
import MyLibrary from './pages/user/MyLibrary';
import MyDeepfakeVideos from './pages/user/MyDeepfakeVideos';
import UserGuide from './pages/user/UserGuide';

// Admin Pages
import AdminUserManagement from './pages/admin/UserManagement';
import AdminProfile from './pages/admin/Profile';
import AllVideos from './pages/admin/AllVideos';
import MediaVideoManagement from './pages/admin/MediaVideoManagement';

// Common & Error Pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

import './App.css';
import './styles/create-content.css';
import PageLoading from './pages/common/Loading';

function App() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <PageLoading />;
  }
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={isAdmin ? "/admin/users" : "/dashboard"} />
            : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated
            ? <Navigate to={isAdmin ? "/admin/users" : "/dashboard"} />
            : <Register />
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <UserLayout>
            <UserDashboard />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserLayout>
            <UserProfile />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/create-content" element={
        <ProtectedRoute>
          <UserLayout>
            <CreateContent />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/my-videos" element={
        <ProtectedRoute>
          <UserLayout>
            <MyVideos />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/my-deepfake-videos" element={
        <ProtectedRoute>
          <UserLayout>
            <MyDeepfakeVideos />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/my-library" element={
        <ProtectedRoute>
          <UserLayout>
            <MyLibrary />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/user-guide" element={
        <ProtectedRoute>
          <UserLayout>
            <UserGuide />
          </UserLayout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminUserManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/videos" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AllVideos />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/profile" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <UserProfile />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/media-videos" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <MediaVideoManagement />
          </AdminLayout>
        </ProtectedRoute>
      } />
      {/* Other Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/not-found" element={<NotFound />} />

      {/* Home redirect */}
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={isAdmin ? "/admin/users" : "/users"} />
          : <Navigate to="/login" />
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/not-found" />} />
    </Routes>
  );
}

export default App;