import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    FaStar,
    FaCog,
    FaSpinner,
    FaPlus,
    FaCheck,
    FaChevronLeft,
    FaChevronRight,
    FaMagic,
    FaFilm,
} from 'react-icons/fa';
import type { Recommendation } from '../../../backend/types/recommendation';

type TFn = (key: string) => string;

interface HomeBestRecommendationsProps {
    recommendations: Recommendation[];
    recsLoading: boolean;
    recsExpanded?: boolean;
    setRecsExpanded?: (v: boolean) => void;
    userUid: string | undefined;
    adminUid: string;
    onOpenAdmin: () => void;
    handleAddToCollection: (rec: Recommendation) => Promise<void>;
    recFilmPage?: number;
    setRecFilmPage?: React.Dispatch<React.SetStateAction<number>>;
    recSeriesPage?: number;
    setRecSeriesPage?: React.Dispatch<React.SetStateAction<number>>;
    recsPerPage?: number;
    t: TFn;
}

export default function HomeBestRecommendations({
    recommendations,
    recsLoading,
    userUid,
    adminUid,
    onOpenAdmin,
    handleAddToCollection,
    t,
}: HomeBestRecommendationsProps) {
    const isAdmin = userUid === adminUid;
    const [selectedTab, setSelectedTab] = useState<'all' | 'movie' | 'series'>('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [actionStatus, setActionStatus] = useState<Record<string, 'adding' | 'added' | 'exists'>>({});
    const PAGE_SIZE = 4;

    const filteredRecs = useMemo(() => {
        if (selectedTab === 'all') return recommendations;
        return recommendations.filter((r) => r.type === selectedTab);
    }, [recommendations, selectedTab]);

    const totalPages = Math.max(1, Math.ceil(filteredRecs.length / PAGE_SIZE));
    const currentItems = filteredRecs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const onAdd = async (rec: Recommendation) => {
        if (actionStatus[rec.id]) return;
        setActionStatus((prev) => ({ ...prev, [rec.id]: 'adding' }));
        try {
            await handleAddToCollection(rec);
            setActionStatus((prev) => ({ ...prev, [rec.id]: 'added' }));
            setTimeout(() => {
                setActionStatus((prev) => {
                    const next = { ...prev };
                    delete next[rec.id];
                    return next;
                });
            }, 2500);
        } catch (error: any) {
            if (error?.message === 'already_exists') {
                setActionStatus((prev) => ({ ...prev, [rec.id]: 'exists' }));
                setTimeout(() => {
                    setActionStatus((prev) => {
                        const next = { ...prev };
                        delete next[rec.id];
                        return next;
                    });
                }, 2500);
            } else {
                setActionStatus((prev) => {
                    const next = { ...prev };
                    delete next[rec.id];
                    return next;
                });
            }
        }
    };

    return (
        <section className="mt-10">
            {/* Header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400">
                        <FaMagic className="text-xs" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            {t('home.bestRecommendations') || 'Küratör Seçkisi'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Özenle derlenen sinematik tavsiyeler
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Sekmeler */}
                    <div className="flex items-center rounded-xl border border-slate-200/90 bg-white/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/80">
                        {(['all', 'movie', 'series'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => {
                                    setSelectedTab(tab);
                                    setCurrentPage(0);
                                }}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                    selectedTab === tab
                                        ? 'bg-slate-900 text-white shadow-2xs dark:bg-zinc-700'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                                }`}
                            >
                                {tab === 'all' ? 'Tümü' : tab === 'movie' ? 'Filmler' : 'Diziler'}
                            </button>
                        ))}
                    </div>

                    {/* Admin Butonu */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenAdmin}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            title="Önerileri Yönet"
                        >
                            <FaCog className="text-xs text-slate-500" />
                            <span className="hidden sm:inline">Yönet</span>
                        </button>
                    )}

                    {/* Sayfalama */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200/90 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                <FaChevronLeft className="text-[9px]" />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200/90 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                <FaChevronRight className="text-[9px]" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* İçerik */}
            {recsLoading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 py-12 dark:border-zinc-800 dark:bg-zinc-900/60">
                    <FaSpinner className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-500 dark:text-zinc-400">Öneriler hazırlanıyor...</span>
                </div>
            ) : currentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                    <p className="text-xs text-slate-400 dark:text-zinc-500">Bu kategoride henüz öneri bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    {currentItems.map((rec) => {
                        const status = actionStatus[rec.id];

                        return (
                            <motion.div
                                key={rec.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:bg-zinc-900 p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-md dark:border-zinc-800/80"
                            >
                                <div className="flex gap-3">
                                    {/* Afiş */}
                                    <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-2xs dark:bg-zinc-800">
                                        {rec.image ? (
                                            <img
                                                src={rec.image}
                                                alt={rec.title}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                                <FaFilm className="text-2xl" />
                                            </div>
                                        )}

                                        {rec.rating && (
                                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 backdrop-blur-xs">
                                                <FaStar className="text-[8px]" />
                                                <span>{rec.rating}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detaylar */}
                                    <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                    {rec.type}
                                                </span>
                                            </div>
                                            <h3 className="mt-1 text-sm font-bold text-slate-900 line-clamp-1 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {rec.title}
                                            </h3>
                                            {rec.description && (
                                                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                                    {rec.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Ekle Aksiyon Butonu */}
                                        <button
                                            type="button"
                                            onClick={() => onAdd(rec)}
                                            disabled={!!status}
                                            className={`mt-2.5 inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-lg px-2.5 py-1 text-xs font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 ${
                                                status === 'added'
                                                    ? 'bg-emerald-500 text-white'
                                                    : status === 'exists'
                                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                                    : 'bg-slate-900 text-white hover:bg-indigo-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-indigo-500'
                                            }`}
                                        >
                                            {status === 'adding' ? (
                                                <>
                                                    <FaSpinner className="h-3 w-3 animate-spin" />
                                                    <span>Ekleniyor</span>
                                                </>
                                            ) : status === 'added' ? (
                                                <>
                                                    <FaCheck className="h-3 w-3 text-white" />
                                                    <span>Eklendi</span>
                                                </>
                                            ) : status === 'exists' ? (
                                                <span>Zaten Ekli</span>
                                            ) : (
                                                <>
                                                    <FaPlus className="text-[9px]" />
                                                    <span>Kütüphaneye Ekle</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}