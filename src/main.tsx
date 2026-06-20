import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from '@/services/socket';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import App from './App';
import './i18n';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              className: 'dark:bg-surface-elevated dark:text-foreground bg-white text-gray-900',
            }}
          />
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
