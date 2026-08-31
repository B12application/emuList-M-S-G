import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileMenu from './MobileMenu';
import BottomNavBar from './BottomNavBar';
import MobileTopBar from './MobileTopBar';
import EmuAIWidget from './calorie-chat/EmuAIWidget';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased">
      <MobileTopBar onMenuOpen={() => setIsMobileMenuOpen(true)} />
      <Header onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Sadece mobilde görünen alt navigasyon */}
      <BottomNavBar onMenuOpen={() => setIsMobileMenuOpen(true)} />

      {/* Floating emuAI Chatbot Widget */}
      <EmuAIWidget />

      {/* pt-20 → mobilde üst nav bar için; md'de pt-24 */}
      <main className="pt-20 md:pt-24 pb-28 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}