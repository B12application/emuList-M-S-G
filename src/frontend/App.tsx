// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Layout from './components/Layout';
import MediaListPage from './pages/MediaListPage';
import CreatePage from './pages/CreatePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';

import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';
import WrappedPage from './pages/WrappedPage';
import VisitedMapPage from './pages/VisitedMapPage';
import FeedPage from './pages/FeedPage';
import ListsPage from './pages/ListsPage';
import ListDetailPage from './pages/ListDetailPage';
import MigrationPage from './pages/MigrationPage';
import AdminPage from './pages/AdminPage';
import MyShowsPage from './pages/MyShowsPage';
import PlannerPage from './pages/PlannerPage';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { useAuth } from './context/AuthContext';

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
      { path: 'feed', element: <FeedPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'user/:userId', element: <PublicProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'wrapped', element: <WrappedPage /> },
      { path: 'lists', element: <ListsPage /> },
      { path: 'lists/:id', element: <ListDetailPage /> },
      { path: 'migration', element: <MigrationPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'my-shows', element: <MyShowsPage /> },
      { path: 'planner', element: <PlannerPage /> },
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
  {
    path: '/sifremi-unuttum',
    element: <ForgotPasswordPage />
  },
]);

import { SoundProvider } from './context/SoundContext';

const SplashScreen = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-black z-[100]">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex flex-col items-center"
    >
      {/* Outer spinning ring */}
      <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-8 relative">
        {/* Inner static logo */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
        </div>
      </div>
      <h1 className="text-3xl font-bold tracking-[0.3em] font-[Orbitron] text-stone-900 dark:text-white">B12</h1>
      <p className="mt-4 text-[10px] font-black tracking-[0.6em] text-stone-400 dark:text-zinc-600 uppercase ml-2">Initializing System</p>
    </motion.div>
  </div>
);

function App() {
  const { loading } = useAuth();

  return (
    <LanguageProvider>
      <NotificationProvider>
        <SoundProvider>
          <QueryClientProvider client={queryClient}>
            <AnimatePresence mode="wait">
              {loading ? (
                <SplashScreen key="splash" />
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  <RouterProvider router={router} />
                </motion.div>
              )}
            </AnimatePresence>
          </QueryClientProvider>
        </SoundProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;
