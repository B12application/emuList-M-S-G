// src/frontend/components/ui/SkeletonLoader.tsx

// Shimmer animation styles - gradient kayarak parlama efekti
const shimmerStyle = {
    backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
};

// Generic Skeleton Component with Shimmer
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
            <div
                className="absolute inset-0 animate-pulse"
                style={shimmerStyle}
            />
            {/* Shimmer animation keyframes eklendi via CSS-in-JS */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

// Media Card Skeleton
export function MediaCardSkeleton() {
    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden">
            <Skeleton className="aspect-[2/3] w-full" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </div>
        </div>
    );
}

// Activity Card Skeleton
export function ActivityCardSkeleton() {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Skeleton className="w-20 h-28 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-24 rounded-lg" />
                    <Skeleton className="h-7 w-32 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Profile Skeleton
export function ProfileSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <Skeleton className="h-8 w-16 mx-auto mb-2" />
                        <Skeleton className="h-3 w-20 mx-auto" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Stats Card Skeleton  
export function StatsCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-3/4" />
            </div>
        </div>
    );
}
