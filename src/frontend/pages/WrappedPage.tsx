// src/frontend/pages/WrappedPage.tsx
// Yıllık Özet sayfası - Spotify Wrapped tarzı

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMediaHistory from '../hooks/useMediaHistory';
import { useLanguage } from '../context/LanguageContext';
import { FaFilm, FaTv, FaGamepad, FaBook, FaStar, FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import Footer from '../components/Footer';

const CARD_COLORS = [
    'from-purple-600 to-indigo-700',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
];

export default function WrappedPage() {
    const { history, loading } = useMediaHistory();
    const { t, language } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Get available years
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        history.forEach(item => {
            if (item.createdAt) {
                const year = item.createdAt.toDate().getFullYear();
                years.add(year);
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [history]);

    // Calculate stats for selected year
    const yearStats = useMemo(() => {
        if (loading || history.length === 0) return null;

        const yearItems = history.filter(item => {
            if (!item.createdAt) return false;
            return item.createdAt.toDate().getFullYear() === selectedYear;
        });

        if (yearItems.length === 0) return null;

        // Total counts
        const totalCount = yearItems.length;
        const typeCounts = { movie: 0, series: 0, game: 0, book: 0 };
        let watchedCount = 0;

        // Genre counts
        const genreCounts: Record<string, number> = {};

        // Highest rated
        let highestRated = yearItems[0];

        // Monthly distribution
        const monthlyData: number[] = Array(12).fill(0);

        yearItems.forEach(item => {
            // Type counts
            if (typeCounts[item.type] !== undefined) typeCounts[item.type]++;
            if (item.watched) watchedCount++;

            // Genre
            if (item.genre) {
                item.genre.split(', ').forEach((g: string) => {
                    const trimmed = g.trim();
                    if (trimmed) genreCounts[trimmed] = (genreCounts[trimmed] || 0) + 1;
                });
            }

            // Highest rated
            const currentRating = parseFloat(item.rating) || 0;
            const highestRating = parseFloat(highestRated.rating) || 0;
            if (currentRating > highestRating) {
                highestRated = item;
            }

            // Monthly
            if (item.createdAt) {
                const month = item.createdAt.toDate().getMonth();
                monthlyData[month]++;
            }
        });

        // Most watched type
        const mostWatchedType = Object.entries(typeCounts).reduce((a, b) => b[1] > a[1] ? b : a);

        // Top genre
        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];

        // Best month
        const bestMonthIndex = monthlyData.indexOf(Math.max(...monthlyData));
        const monthNames = language === 'tr'
            ? ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
            : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        return {
            totalCount,
            typeCounts,
            watchedCount,
            completionRate: Math.round((watchedCount / totalCount) * 100),
            mostWatchedType: mostWatchedType[0] as 'movie' | 'series' | 'game' | 'book',
            mostWatchedTypeCount: mostWatchedType[1],
            topGenre: topGenre ? topGenre[0] : null,
            topGenreCount: topGenre ? topGenre[1] : 0,
            highestRated,
            bestMonth: monthNames[bestMonthIndex],
            bestMonthCount: monthlyData[bestMonthIndex],
        };
    }, [history, loading, selectedYear, language]);

    const typeIcons = {
        movie: <FaFilm className="text-4xl" />,
        series: <FaTv className="text-4xl" />,
        game: <FaGamepad className="text-4xl" />,
        book: <FaBook className="text-4xl" />,
    };

    const typeLabels = {
        movie: language === 'tr' ? 'Film' : 'Movie',
        series: language === 'tr' ? 'Dizi' : 'Series',
        game: language === 'tr' ? 'Oyun' : 'Game',
        book: language === 'tr' ? 'Kitap' : 'Book',
    };

    // Slides data
    const slides = yearStats ? [
        {
            id: 'total',
            title: language === 'tr' ? `${selectedYear} Yılı Özeti` : `${selectedYear} Year Summary`,
            content: (
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="text-8xl font-black mb-4"
                    >
                        {yearStats.totalCount}
                    </motion.div>
                    <p className="text-xl opacity-80">
                        {language === 'tr' ? 'içerik ekledin' : 'items added'}
                    </p>
                </div>
            )
        },
        {
            id: 'type',
            title: language === 'tr' ? 'En Çok Ne İzledin?' : 'What Did You Watch Most?',
            content: (
                <div className="text-center">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                    >
                        {typeIcons[yearStats.mostWatchedType]}
                    </motion.div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        className="text-5xl font-black mb-2"
                    >
                        {yearStats.mostWatchedTypeCount}
                    </motion.div>
                    <p className="text-xl opacity-80">{typeLabels[yearStats.mostWatchedType]}</p>
                </div>
            )
        },
        {
            id: 'genre',
            title: language === 'tr' ? 'Favori Türün' : 'Your Favorite Genre',
            content: yearStats.topGenre ? (
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="text-6xl mb-6"
                    >
                        🎭
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl font-black mb-2"
                    >
                        {yearStats.topGenre}
                    </motion.div>
                    <p className="text-lg opacity-80">
                        {yearStats.topGenreCount} {language === 'tr' ? 'içerik' : 'items'}
                    </p>
                </div>
            ) : null
        },
        {
            id: 'best',
            title: language === 'tr' ? 'En Yüksek Puanın' : 'Your Highest Rating',
            content: (
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="flex items-center justify-center gap-2 text-5xl font-black mb-4"
                    >
                        <FaStar className="text-yellow-300" />
                        {yearStats.highestRated.rating}
                    </motion.div>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl font-semibold mb-2"
                    >
                        {yearStats.highestRated.title}
                    </motion.p>
                    <p className="text-sm opacity-70 capitalize">{typeLabels[yearStats.highestRated.type]}</p>
                </div>
            )
        },
        {
            id: 'month',
            title: language === 'tr' ? 'En Aktif Ayın' : 'Your Most Active Month',
            content: (
                <div className="text-center">
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-6xl mb-6"
                    >
                        📅
                    </motion.div>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        className="text-4xl font-black mb-2"
                    >
                        {yearStats.bestMonth}
                    </motion.div>
                    <p className="text-lg opacity-80">
                        {yearStats.bestMonthCount} {language === 'tr' ? 'içerik eklendi' : 'items added'}
                    </p>
                </div>
            )
        },
    ].filter(s => s.content !== null) : [];

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">{t('common.loading')}</div>;
    }

    if (!yearStats || slides.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 px-4">
                <FaCalendarAlt className="text-6xl text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold mb-2">{selectedYear} {language === 'tr' ? 'için veri bulunamadı' : 'has no data'}</h2>
                <p className="text-gray-400 mb-6">{language === 'tr' ? 'Bu yıl henüz içerik eklememişsiniz.' : 'You haven\'t added any content this year.'}</p>
                {availableYears.length > 0 && (
                    <div className="flex gap-2">
                        {availableYears.slice(0, 5).map(year => (
                            <button
                                key={year}
                                onClick={() => setSelectedYear(year)}
                                className={`px-4 py-2 rounded-xl font-semibold transition ${year === selectedYear
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12">
            {/* Year Selector */}
            <div className="flex justify-center gap-2 py-6">
                {availableYears.slice(0, 5).map(year => (
                    <button
                        key={year}
                        onClick={() => { setSelectedYear(year); setCurrentSlide(0); }}
                        className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${year === selectedYear
                                ? 'bg-white text-gray-900 shadow-lg scale-110'
                                : 'bg-white/20 text-white/70 hover:bg-white/30'
                            }`}
                    >
                        {year}
                    </button>
                ))}
            </div>

            {/* Main Wrapped Card */}
            <div className="max-w-lg mx-auto px-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                        className={`bg-gradient-to-br ${CARD_COLORS[currentSlide % CARD_COLORS.length]} rounded-3xl p-8 text-white min-h-[400px] flex flex-col shadow-2xl`}
                    >
                        <h2 className="text-lg font-bold opacity-80 mb-8 text-center">
                            {slides[currentSlide].title}
                        </h2>

                        <div className="flex-1 flex items-center justify-center">
                            {slides[currentSlide].content}
                        </div>

                        {/* Dots */}
                        <div className="flex justify-center gap-2 mt-8">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={prevSlide}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <FaChevronLeft /> {language === 'tr' ? 'Önceki' : 'Previous'}
                    </button>
                    <button
                        onClick={nextSlide}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        {language === 'tr' ? 'Sonraki' : 'Next'} <FaChevronRight />
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
