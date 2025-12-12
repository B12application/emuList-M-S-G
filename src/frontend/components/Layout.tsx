// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
// import DesktopSidebar from './DesktopSidebar'; // Bunu hiç yapmamıştık
import MobileMenu from './MobileMenu'; // 1. YENİ MOBİL MENÜYÜ İMPORT ET

export default function Layout() {
  // 2. Bu state, Header'ı (açmak için) ve MobileMenu'yü (kapatmak için) kontrol eder
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 antialiased">

      {/* 3. Header'a "aç" fonksiyonunu gönder */}
      <Header onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />

      {/* <DesktopSidebar /> */}

      {/* 4. MobileMenu'ye "durum" (isOpen) ve "kapat" fonksiyonlarını gönder */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}