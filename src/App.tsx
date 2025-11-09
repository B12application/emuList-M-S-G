// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import MediaListPage from './pages/MediaListPage';
import CreatePage from './pages/CreatePage';
import HomePage from './pages/HomePage'; // 1. BURAYI KONTROL ET


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { 
        index: true, 
        element: <HomePage /> 
      }, 
      
      // HATA DÜZELTMESİ: type="Film" gibi prop'ları kaldır
      { path: 'movie', element: <MediaListPage /> },
      { path: 'series', element: <MediaListPage /> },
      { path: 'game', element: <MediaListPage /> },
      { path: 'all', element: <MediaListPage /> },
      
      { path: 'create', element: <CreatePage /> },
      // ... (diğer rotalar) ...
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;