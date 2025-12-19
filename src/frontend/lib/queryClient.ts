// src/frontend/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 dakika boyunca fresh kalır
            gcTime: 1000 * 60 * 30,   // 30 dakika cache'de kalır (garbage collection)
            refetchOnWindowFocus: false, // Sekme değiştiğinde tekrar çekme
            refetchOnMount: false, // Component mount olunca tekrar çekme (cache varsa)
            retry: 1, // Hata durumunda 1 kez tekrar dene
        },
    },
});
