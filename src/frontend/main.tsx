import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.tsx'
import { MarqueeToastContainer } from './components/MarqueeToast.tsx';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <MarqueeToastContainer />
        <Toaster
          position="top-center"
          gutter={10}
          containerStyle={{ top: '10%' }}
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(248, 250, 248, 0.97)',
              color: 'rgba(25,25,25,0.90)',
              border: '1.5px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 18px',
              maxWidth: '400px',
            },
            success: {
              style: {
                border: '1.5px solid rgba(74,222,128,0.45)',
                boxShadow: '0 8px 40px rgba(22,163,74,0.28), 0 2px 12px rgba(0,0,0,0.35)',
              },
              iconTheme: {
                primary: '#4ade80',
                secondary: 'rgba(28,32,28,0.94)',
              },
            },
            error: {
              style: {
                border: '1.5px solid rgba(220,38,38,0.55)',
                boxShadow: '0 8px 40px rgba(185,28,28,0.35), 0 2px 12px rgba(0,0,0,0.4)',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: 'rgba(18,18,28,0.92)',
              },
            },
            loading: {
              style: {
                border: '1.5px solid rgba(180,130,60,0.50)',
                boxShadow: '0 8px 40px rgba(120,80,30,0.30), 0 2px 12px rgba(0,0,0,0.4)',
              },
              iconTheme: {
                primary: '#d4a264',
                secondary: 'rgba(18,18,28,0.92)',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);