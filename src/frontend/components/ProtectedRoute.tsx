// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type ReactNode } from 'react';
import { FaSpinner } from 'react-icons/fa';
interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth(); // Kullanıcı hafızasını oku

  // 1. Durum: Hâlâ kontrol ediliyor (Yükleniyor)
  // AuthContext'in sonucu dönene kadar bekle, hiçbir şey gösterme
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <FaSpinner className="animate-spin h-10 w-10 text-sky-500" />
      </div>
    );
  }

  // 2. Durum: Kontrol bitti ve kullanıcı YOK (giriş yapmamış)
  // Kullanıcıyı /login sayfasına yönlendir
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Durum: Kontrol bitti ve kullanıcı VAR
  // Sayfanın kendisini (children) göster
  return <>{children}</>;
}