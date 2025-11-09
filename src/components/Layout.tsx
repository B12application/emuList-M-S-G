
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx';


export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 antialiased">
      
      <Header onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />
      
      {/* <DesktopSidebar /> */}
      
      {/* <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      /> */}
      
      <main className="pt-20 md:pr-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}