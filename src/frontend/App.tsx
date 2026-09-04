// src/App.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { useAuth } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';

// Dynamic lazy-loaded route components for high performance & minimal bundle size
const MediaListPage = lazy(() => import('./pages/MediaListPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const WrappedPage = lazy(() => import('./pages/WrappedPage'));
const VisitedMapPage = lazy(() => import('./pages/VisitedMapPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const ListsPage = lazy(() => import('./pages/ListsPage'));
const ListDetailPage = lazy(() => import('./pages/ListDetailPage'));
const MigrationPage = lazy(() => import('./pages/MigrationPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MyShowsPage = lazy(() => import('./pages/MyShowsPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const TravelPlannerPage = lazy(() => import('./pages/TravelPlannerPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const CalorieChatPage = lazy(() => import('./pages/CalorieChatPage'));
const CalorieDetailsPage = lazy(() => import('./pages/CalorieDetailsPage'));
const BodyProfilePage = lazy(() => import('./pages/BodyProfilePage'));

// Lightweight, non-blocking Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
      <span className="text-xs font-semibold text-stone-400 dark:text-zinc-500 tracking-wider">Yükleniyor...</span>
    </div>
  </div>
);

const LazyRoute = ({ component: Component }: { component: React.ComponentType }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

function RouteErrorBoundary() {
  const error = useRouteError();
  const errorMessage = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Bilinmeyen bir hata oluştu';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-6 text-center shadow-xl">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-black">
          ⚠️
        </div>
        <h2 className="text-base font-black text-stone-900 dark:text-white mb-1">
          Sayfa Yüklenirken Bir Hata Oluştu
        </h2>
        <p className="text-xs text-stone-500 dark:text-zinc-400 mb-4 leading-relaxed line-clamp-3 font-mono bg-stone-50 dark:bg-zinc-800/60 p-2.5 rounded-xl">
          {errorMessage}
        </p>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer shadow-sm"
          >
            Yeniden Dene
          </button>
          <Link
            to="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-bold text-xs hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-center"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
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
      { path: 'movie', element: <LazyRoute component={MediaListPage} /> },
      { path: 'series', element: <LazyRoute component={MediaListPage} /> },
      { path: 'game', element: <LazyRoute component={MediaListPage} /> },
      { path: 'book', element: <LazyRoute component={MediaListPage} /> },
      { path: 'all', element: <LazyRoute component={MediaListPage} /> },
      { path: 'create', element: <LazyRoute component={CreatePage} /> },

      { path: 'map', element: <LazyRoute component={VisitedMapPage} /> },
      { path: 'feed', element: <LazyRoute component={FeedPage} /> },
      { path: 'profile', element: <LazyRoute component={ProfilePage} /> },
      { path: 'user/:userId', element: <LazyRoute component={PublicProfilePage} /> },
      { path: 'settings', element: <LazyRoute component={SettingsPage} /> },
      { path: 'stats', element: <LazyRoute component={StatsPage} /> },
      { path: 'wrapped', element: <LazyRoute component={WrappedPage} /> },
      { path: 'lists', element: <LazyRoute component={ListsPage} /> },
      { path: 'lists/:id', element: <LazyRoute component={ListDetailPage} /> },
      { path: 'migration', element: <LazyRoute component={MigrationPage} /> },
      { path: 'admin', element: <LazyRoute component={AdminPage} /> },
      { path: 'my-shows', element: <LazyRoute component={MyShowsPage} /> },
      { path: 'planner', element: <LazyRoute component={PlannerPage} /> },
      { path: 'expenses', element: <LazyRoute component={ExpensesPage} /> },
      { path: 'travel-planner', element: <LazyRoute component={TravelPlannerPage} /> },
      { path: 'notes', element: <LazyRoute component={NotesPage} /> },
      { path: 'notes/:noteId', element: <LazyRoute component={NotesPage} /> },
      { path: 'calorie-chat', element: <LazyRoute component={CalorieChatPage} /> },
      { path: 'calorie-details', element: <LazyRoute component={CalorieDetailsPage} /> },
      { path: 'body-profile', element: <LazyRoute component={BodyProfilePage} /> },
    ]
  },

  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <LazyRoute component={SignupPage} />
  },
  {
    path: '/sifremi-unuttum',
    element: <LazyRoute component={ForgotPasswordPage} />
  },
  {
    path: '/forgot-password',
    element: <LazyRoute component={ForgotPasswordPage} />
  },
  {
    path: '/reset-password',
    element: <LazyRoute component={ResetPasswordPage} />
  },
  {
    path: '/sifre-sifirla',
    element: <LazyRoute component={ResetPasswordPage} />
  },
  {
    path: '/__/auth/action',
    element: <LazyRoute component={ResetPasswordPage} />
  },
  {
    path: '/auth/action',
    element: <LazyRoute component={ResetPasswordPage} />
  },
]);

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
