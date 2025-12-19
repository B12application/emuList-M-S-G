// src/frontend/components/QuoteWidget.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuoteLeft, FaFilm, FaTv, FaBook, FaGamepad, FaSyncAlt } from 'react-icons/fa';
import { getDailyQuote, getRandomQuote, type Quote } from '../data/quotes';

export default function QuoteWidget() {
    const [quote, setQuote] = useState<Quote>(getDailyQuote());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const getTypeIcon = (type: Quote['type']) => {
        switch (type) {
            case 'movie': return <FaFilm />;
            case 'series': return <FaTv />;
            case 'book': return <FaBook />;
            case 'game': return <FaGamepad />;
        }
    };

    const getTypeColor = (type: Quote['type']) => {
        switch (type) {
            case 'movie': return 'from-blue-500 to-sky-500';
            case 'series': return 'from-emerald-500 to-teal-500';
            case 'book': return 'from-purple-500 to-violet-500';
            case 'game': return 'from-amber-500 to-orange-500';
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setQuote(getRandomQuote());
            setIsRefreshing(false);
        }, 300);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 shadow-xl border border-white/10"
        >
            {/* Arka plan dekor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-12 -translate-x-12" />

            <div className="relative z-10">
                {/* Başlık */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white/60">
                        <FaQuoteLeft className="text-lg" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Günün Sözü</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white disabled:opacity-50"
                        title="Yeni söz"
                    >
                        <FaSyncAlt className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Quote */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={quote.text}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <p className="text-lg md:text-xl font-medium text-white leading-relaxed mb-4 italic">
                            "{quote.text}"
                        </p>

                        {/* Kaynak */}
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${getTypeColor(quote.type)} shadow-lg`}>
                                {getTypeIcon(quote.type)}
                            </div>
                            <div>
                                <p className="text-white font-semibold">{quote.source}</p>
                                {quote.author && (
                                    <p className="text-white/60 text-sm">— {quote.author}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
