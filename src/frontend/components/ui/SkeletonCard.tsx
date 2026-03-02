// src/components/ui/SkeletonCard.tsx

export default function SkeletonCard() {
  return (
    <article className="rounded-2xl border border-stone-300 dark:border-zinc-800 overflow-hidden bg-stone-50 dark:bg-zinc-900 shadow-sm animate-pulse">
      <div className="relative">
        {/* Görsel skeleton */}
        <div className="h-64 w-full bg-stone-200 dark:bg-zinc-700" />
        
        {/* Badge skeleton'ları */}
        <div className="absolute left-3 top-3">
          <div className="h-6 w-24 rounded-full bg-gray-300 dark:bg-zinc-600" />
        </div>
        <div className="absolute right-3 top-3">
          <div className="h-6 w-16 rounded-full bg-gray-300 dark:bg-zinc-600" />
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        {/* Başlık skeleton */}
        <div className="h-5 w-3/4 bg-stone-200 dark:bg-zinc-700 rounded" />
        
        {/* Açıklama skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-stone-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-5/6 bg-stone-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-4/6 bg-stone-200 dark:bg-zinc-700 rounded" />
        </div>
        
        {/* Butonlar skeleton */}
        <div className="mt-2 flex items-center justify-between">
          <div className="h-10 w-20 bg-stone-200 dark:bg-zinc-700 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-stone-200 dark:bg-zinc-700 rounded-xl" />
            <div className="h-10 w-10 bg-stone-200 dark:bg-zinc-700 rounded-xl" />
          </div>
        </div>
      </div>
    </article>
  );
}

