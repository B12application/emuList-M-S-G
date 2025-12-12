// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import MediaListPage from './pages/MediaListPage';
import CreatePage from './pages/CreatePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';

import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';
import VisitedMapPage from './pages/VisitedMapPage';
import { LanguageProvider } from './context/LanguageContext';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />
      },
      { path: 'movie', element: <MediaListPage /> },
      { path: 'series', element: <MediaListPage /> },
      { path: 'game', element: <MediaListPage /> },
      { path: 'book', element: <MediaListPage /> },
      { path: 'all', element: <MediaListPage /> },
      { path: 'create', element: <CreatePage /> },

      { path: 'map', element: <VisitedMapPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'stats', element: <StatsPage /> }, // New Stats Route
    ]
  },

  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
]);

function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}

export default App;