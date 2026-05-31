import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useMedia from '../hooks/useMedia';
import useUserProfile from '../hooks/useUserProfile';
import type { MediaItem } from '../../backend/types/media';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import LuckyDipModal from '../components/LuckyDipModal';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import DetailModal from '../components/DetailModal';
import { useAppSound } from '../context/SoundContext';
import AdminRecommendationsPanel from '../components/AdminRecommendationsPanel';
import { fetchRecommendations } from '../../backend/services/recommendationService';
import type { Recommendation } from '../../backend/types/recommendation';
import { getSeriesProgress, toggleEpisodeWatched, updateCurrentProgress } from '../../backend/services/episodeTrackingService';

import HomeHero from '../components/home/HomeHero';
import HomeCommandLayer from '../components/home/HomeCommandLayer';
import HomeStatsBento from '../components/home/HomeStatsBento';
import HomeContinueWatching from '../components/home/HomeContinueWatching';
import HomeFavoritesRail from '../components/home/HomeFavoritesRail';
import HomeActivityFeed from '../components/home/HomeActivityFeed';
import HomeInsightsStrip from '../components/home/HomeInsightsStrip';
import HomeCategoryBento from '../components/home/HomeCategoryBento';
import HomeBestRecommendations from '../components/home/HomeBestRecommendations';
import HomeCollectionPicks from '../components/home/HomeCollectionPicks';
import HomeClosingCta from '../components/home/HomeClosingCta';

const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || 'ZKU7SObBkeNzMicltUKJjo6ybHH2';

export default function HomePage() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    const [randomItem, setRandomItem] = useState<MediaItem | null>(null);
    const [selectedRecentItem, setSelectedRecentItem] = useState<MediaItem | null>(null);
    const [favoritesPage, setFavoritesPage] = useState(0);
    const FAVORITES_PER_PAGE = 4;

    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [recsExpanded, setRecsExpanded] = useState(true);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [collectionRecsExpanded, setCollectionRecsExpanded] = useState(true);

    const [recFilmPage, setRecFilmPage] = useState(1);
    const [recSeriesPage, setRecSeriesPage] = useState(1);
    const RECS_PER_PAGE = 4;

    const { items: allItems, loading: allLoading, refetch: allRefetch } = useMedia('all', 'all', true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const stats = useMemo(() => {
        const counts = { movieCount: 0, seriesCount: 0, gameCount: 0, bookCount: 0 };
        allItems.forEach((item) => {
            if (item.type === 'movie') counts.movieCount++;
            else if (item.type === 'series') counts.seriesCount++;
            else if (item.type === 'game') counts.gameCount++;
            else if (item.type === 'book') counts.bookCount++;
        });
        return {
            ...counts,
            totalCount: counts.movieCount + counts.seriesCount + counts.gameCount + counts.bookCount,
        };
    }, [allItems]);

    const statsLoading = allLoading;
    const { playClick } = useAppSound();

    const movieRecs = allItems.filter((item) => item.type === 'movie' && !item.watched);
    const seriesRecs = allItems.filter((item) => item.type === 'series' && !item.watched);
    const gameRecs = allItems.filter((item) => item.type === 'game' && !item.watched);
    const bookRecs = allItems.filter((item) => item.type === 'book' && !item.watched);

    const movieRecommendation = movieRecs[0];
    const seriesRecommendation = seriesRecs[0];
    const gameRecommendation = gameRecs[0];
    const bookRecommendation = bookRecs[0];
    const recommendationsLoading = allLoading;

    const recentActivity = useMemo(
        () =>
            [...allItems]
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .slice(0, 6),
        [allItems]
    );

    const dustyItems = useMemo(
        () =>
            [...allItems]
                .filter((item) => !item.watched && item.createdAt)
                .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
                .slice(0, 6),
        [allItems]
    );

    const continueWatchingShows = useMemo(() => {
        return allItems
            .filter((item) => {
                if (item.type !== 'series') return false;
                const progress = getSeriesProgress(item);
                return progress.totalEpisodes > 0 && progress.totalWatched > 0 && progress.percentage < 100;
            })
            .sort((a, b) => {
                const aTime = a.lastWatchedAt ? (a.lastWatchedAt as { seconds?: number }).seconds || 0 : 0;
                const bTime = b.lastWatchedAt ? (b.lastWatchedAt as { seconds?: number }).seconds || 0 : 0;
                return bTime - aTime;
            })
            .slice(0, 4);
    }, [allItems]);

    const heroPreviewItems = useMemo(
        () =>
            [...allItems]
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .slice(0, 14),
        [allItems]
    );

    const spotlightPick = useMemo(() => {
        const pool = allItems.filter((i) => !i.watched);
        if (pool.length === 0) return null;
        return [...pool].sort((a, b) => parseFloat(String(b.rating || 0)) - parseFloat(String(a.rating || 0)))[0];
    }, [allItems]);

    const pulseStats = useMemo(() => {
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const weekAdded = allItems.filter((i) => {
            const s = i.createdAt?.seconds;
            if (s === undefined || s === null) return false;
            return now - s * 1000 < weekMs;
        }).length;
        return {
            watched: allItems.filter((i) => i.watched).length,
            queue: allItems.filter((i) => !i.watched).length,
            favorites: allItems.filter((i) => i.isFavorite).length,
            inProgress: continueWatchingShows.length,
            weekAdded,
        };
    }, [allItems, continueWatchingShows.length]);

    const getNextEpisode = (show: MediaItem): { season: number; episode: number } | null => {
        const ts = show.totalSeasons || 0;
        const we = show.watchedEpisodes || {};
        const eps = show.episodesPerSeason || {};
        for (let s = 1; s <= ts; s++) {
            const w = we[s] || [];
            const tot = eps[s] || 0;
            if (!tot) continue;
            for (let e = 1; e <= tot; e++) {
                if (!w.includes(e)) return { season: s, episode: e };
            }
        }
        return null;
    };

    const handleQuickMarkHome = async (show: MediaItem) => {
        const next = getNextEpisode(show);
        if (!next) return;
        try {
            await toggleEpisodeWatched(show.id, next.season, next.episode, show.watchedEpisodes || {});
            await updateCurrentProgress(show.id, next.season, next.episode);
            toast.success(`S${next.season} E${next.episode} ✓`);
            playClick();
            allRefetch();
        } catch (err) {
            console.error(err);
        }
    };

    const locale = language === 'tr' ? 'tr-TR' : 'en-US';

    const formatDate = (timestamp: unknown) => {
        if (!timestamp) return '—';
        const date =
            timestamp && typeof timestamp === 'object' && 'toDate' in (timestamp as { toDate?: () => Date })
                ? (timestamp as { toDate: () => Date }).toDate()
                : new Date(timestamp as string | number);
        return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
    };

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        setRecsLoading(true);
        const recs = await fetchRecommendations();
        setRecommendations(recs);
        setRecsLoading(false);
    };

    const handleAddToCollection = async (rec: Recommendation) => {
        if (!user) {
            toast.error(t('create.loginRequired'));
            return;
        }
        try {
            const q = query(collection(db, 'mediaItems'), where('userId', '==', user.uid), where('title', '==', rec.title));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                toast.error(t('home.alreadyInCollection'));
                return;
            }
            await addDoc(collection(db, 'mediaItems'), {
                userId: user.uid,
                title: rec.title,
                type: rec.type,
                image: rec.image || '',
                description: rec.description || '',
                rating: rec.rating || '0',
                watched: false,
                isFavorite: false,
                createdAt: Timestamp.now(),
            });
            toast.success(t('home.addedToCollection'));
            allRefetch();
        } catch (error) {
            console.error('Error adding to collection:', error);
            toast.error(t('home.adminRecError'));
        }
    };

    const handleRandomPick = () => {
        const userPool = [...movieRecs, ...seriesRecs, ...gameRecs, ...bookRecs];
        const adminPool = recommendations.map(
            (rec) =>
                ({
                    id: rec.id,
                    title: rec.title,
                    image: rec.image,
                    rating: rec.rating,
                    description: rec.description,
                    type: rec.type as MediaItem['type'],
                    watched: false,
                    createdAt: rec.createdAt,
                    isFavorite: false,
                }) as MediaItem
        );
        const fullPool = [...userPool, ...adminPool];
        if (fullPool.length > 0) {
            setRandomItem(fullPool[Math.floor(Math.random() * fullPool.length)]);
        } else {
            toast.error(t('home.noItemsToPick'));
        }
    };

    const handleRemoveFavorite = (item: MediaItem, e: React.MouseEvent) => {
        e.stopPropagation();
        updateDoc(doc(db, 'mediaItems', item.id), { isFavorite: false }).then(() => allRefetch());
    };

    if (!user) {
        return null;
    }

    const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User';

    const getAvatar = () => {
        if (user.photoURL && user.photoURL !== MALE_AVATAR_URL && user.photoURL !== FEMALE_AVATAR_URL) {
            return user.photoURL;
        }
        if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
        if (profile?.gender === 'male') return MALE_AVATAR_URL;
        return MALE_AVATAR_URL;
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden pb-6">
            {/* Background gradient */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(251,191,36,0.22),transparent),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(139,92,246,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.12),transparent),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(139,92,246,0.15),transparent)]" />

            <section className="relative mx-auto max-w-[1600px] px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-8">
                {/* Hero */}
                <HomeHero
                    displayName={displayName}
                    avatarUrl={getAvatar()}
                    onRandom={handleRandomPick}
                    t={t}
                    previewItems={heroPreviewItems} onAvatarClick={function (): void {
                        throw new Error('Function not implemented.');
                    } }                />

                {/* Pulse Stats */}
                <HomeCommandLayer pulse={pulseStats} t={t} />

                {/* ─── Insights Strip - Tam genişlik yatay ─── */}
                <HomeInsightsStrip
                    t={t}
                    totalCount={stats.totalCount}
                    stats={stats}
                    spotlight={spotlightPick}
                    dustyItems={dustyItems}
                    onSelect={setSelectedRecentItem}
                    formatDate={formatDate}
                />

                {/* Ana grid - tek kolon */}
                <div className="mt-10 space-y-12">
                    <HomeStatsBento stats={stats} loading={statsLoading} t={t} />

                    <HomeContinueWatching
                        shows={continueWatchingShows}
                        t={t}
                        getNextEpisode={getNextEpisode}
                        onQuickMark={handleQuickMarkHome}
                    />

                    <HomeFavoritesRail
                        loading={allLoading}
                        items={allItems}
                        page={favoritesPage}
                        perPage={FAVORITES_PER_PAGE}
                        onPageChange={setFavoritesPage}
                        onSelect={setSelectedRecentItem}
                        onRemoveFavorite={handleRemoveFavorite}
                        t={t}
                    />

                    <HomeActivityFeed
                        loading={allLoading}
                        items={recentActivity}
                        onSelect={setSelectedRecentItem}
                        formatDate={formatDate}
                        t={t}
                    />

                    <HomeCategoryBento t={t} />
                </div>

                {/* Best Recommendations */}
                <HomeBestRecommendations
                    recommendations={recommendations}
                    recsLoading={recsLoading}
                    recsExpanded={recsExpanded}
                    setRecsExpanded={setRecsExpanded}
                    userUid={user?.uid}
                    adminUid={ADMIN_UID}
                    onOpenAdmin={() => setShowAdminPanel(true)}
                    handleAddToCollection={handleAddToCollection}
                    recFilmPage={recFilmPage}
                    setRecFilmPage={setRecFilmPage}
                    recSeriesPage={recSeriesPage}
                    setRecSeriesPage={setRecSeriesPage}
                    recsPerPage={RECS_PER_PAGE}
                    t={t}
                />

                {/* Collection Picks */}
                <HomeCollectionPicks
                    expanded={collectionRecsExpanded}
                    onToggle={() => setCollectionRecsExpanded(!collectionRecsExpanded)}
                    loading={recommendationsLoading}
                    movie={movieRecommendation}
                    series={seriesRecommendation}
                    game={gameRecommendation}
                    book={bookRecommendation}
                    refetch={allRefetch}
                    t={t}
                />

                {/* Closing CTA */}
                <HomeClosingCta t={t} />
            </section>

            {/* Admin Panel */}
            <AdminRecommendationsPanel
                isOpen={showAdminPanel}
                onClose={() => setShowAdminPanel(false)}
                onUpdate={loadRecommendations}
            />

            {/* Modals */}
            <LuckyDipModal
                isOpen={!!randomItem}
                onClose={() => setRandomItem(null)}
                item={randomItem}
                onSpinAgain={handleRandomPick}
            />
            <DetailModal
                isOpen={!!selectedRecentItem}
                onClose={() => setSelectedRecentItem(null)}
                item={selectedRecentItem}
                refetch={allRefetch}
            />
        </div>
    );
}