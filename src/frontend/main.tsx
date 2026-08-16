import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.tsx'
import { ShiftProvider } from './context/ShiftContext.tsx';
import { MarqueeToastContainer } from './components/MarqueeToast.tsx';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ShiftProvider>
          <App />
          <MarqueeToastContainer />
        <Toaster
          position="bottom-right"
          gutter={8}
          containerStyle={{
            bottom: 80,
            right: 20,
          }}
          toastOptions={{
            duration: 1800,
            style: {
              background: 'rgba(24, 24, 27, 0.95)',
              color: '#f4f4f5',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              fontSize: '13px',
              fontWeight: 600,
              padding: '9px 15px',
              maxWidth: '360px',
            },
            success: {
              style: {
                background: 'rgba(20, 20, 24, 0.96)',
                color: '#ffffff',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.18), 0 2px 8px rgba(0,0,0,0.4)',
              },
              iconTheme: {
                primary: '#f59e0b',
                secondary: '#18181b',
              },
            },
            error: {
              style: {
                background: 'rgba(20, 20, 24, 0.96)',
                color: '#ffffff',
                border: '1.5px solid rgba(239, 68, 68, 0.45)',
                boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2), 0 2px 8px rgba(0,0,0,0.4)',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#18181b',
              },
            },
            loading: {
              style: {
                background: 'rgba(20, 20, 24, 0.96)',
                color: '#ffffff',
                border: '1.5px solid rgba(245, 158, 11, 0.45)',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.18), 0 2px 8px rgba(0,0,0,0.4)',
              },
              iconTheme: {
                primary: '#f59e0b',
                secondary: '#18181b',
              },
            },
          }}
        />
        </ShiftProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);