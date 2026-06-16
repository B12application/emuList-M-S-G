import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import useUserProfile from '../hooks/useUserProfile';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FaUserEdit, FaCamera, FaHeart, FaFilm, FaTv, FaGamepad, FaBook, FaCalendarAlt, FaCheck, FaTimes, FaCog, FaStar, FaHistory, FaChevronRight, FaQuoteLeft, FaGithub, FaLinkedin, FaTwitter, FaInstagram, FaGlobe, FaLink, FaChartBar, FaTrophy, FaEye, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../../backend/config/firebaseConfig';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

import useMedia from '../hooks/useMedia';
import Footer from '../components/Footer';
import useMediaHistory from '../hooks/useMediaHistory';
import DetailModal from '../components/DetailModal';
import type { MediaItem } from '../../backend/types/media';


export default function ProfilePage() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const { items: allItems, loading: loadingMedia, refetch: refetchMedia } = useMedia('all', 'all', true);

    // İSTATİSTİK OPTİMİZASYONU
    const stats = useMemo(() => {
        const counts = {
            movieCount: 0,
            seriesCount: 0,
            gameCount: 0,
            bookCount: 0,
            totalCount: allItems.length
        };

        allItems.forEach(item => {
            if (item.type === 'movie') counts.movieCount++;
            else if (item.type === 'series') counts.seriesCount++;
            else if (item.type === 'game') counts.gameCount++;
            else if (item.type === 'book') counts.bookCount++;
        });

        return {
            ...counts,
            totalCount: counts.movieCount + counts.seriesCount + counts.gameCount + counts.bookCount
        };
    }, [allItems]);

    const statsLoading = loadingMedia;
    const { history } = useMediaHistory();

    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLinks, setSocialLinks] = useState<{
        github?: string;
        linkedin?: string;
        twitter?: string;
        instagram?: string;
        website?: string;
    }>({});

    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [activeTab, setActiveTab] = useState<'favorites' | 'recent' | 'stats'>('favorites');

    // Gender-based avatar URLs
    const MALE_AVATAR_URL = 'https://www.pngall.com/wp-content/uploads/5/Profile-Male-PNG.png';
    const FEMALE_AVATAR_URL = 'https://www.pngmart.com/files/23/Female-Transparent-PNG.png';

    // Get the appropriate avatar based on gender
    const getDefaultAvatar = () => {
        if (profile?.gender === 'female') return FEMALE_AVATAR_URL;
        return MALE_AVATAR_URL;
    };

    useEffect(() => {
        if (profile?.bio) setBio(profile.bio);
        if (profile?.socialLinks) setSocialLinks(profile.socialLinks);
    }, [profile]);

    useEffect(() => {
        if (user?.displayName) setDisplayName(user.displayName);
        if (user?.photoURL &&
            user.photoURL !== MALE_AVATAR_URL &&
            user.photoURL !== FEMALE_AVATAR_URL) {
            setAvatarUrl(user.photoURL);
        } else {
            setAvatarUrl('');
        }
    }, [user, profile]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let finalPhotoURL: string | null = null;

            if (avatarUrl && avatarUrl.trim() !== '') {
                finalPhotoURL = avatarUrl.trim();
            } else {
                finalPhotoURL = null;
            }

            if (displayName !== user.displayName || finalPhotoURL !== user.photoURL) {
                await updateProfile(user, {
                    displayName,
                    photoURL: finalPhotoURL
                });
            }

            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                bio,
                socialLinks,
                displayName,
                photoURL: finalPhotoURL,
                gender: profile?.gender
            }, { merge: true });

            await queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });

            toast.success(t('profile.saveSuccess') || 'Profil güncellendi!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(t('profile.saveError') || 'Hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Favorites: Increased limit for full width grid
    const favorites = allItems.filter(item => item.isFavorite).slice(0, 8);

    const recentlyWatched = useMemo(() => {
        return history
            .filter(item => item.watched)
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 5);
    }, [history]);

    // En yüksek puanlı içerikler - TypeScript düzeltmesi
    const topRated = useMemo(() => {
        return allItems
            .filter(item => item.rating)
            .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
            .slice(0, 5);
    }, [allItems]);

    return (
        <div className="min-h-screen pt-4 pb-0">

            {/* MAIN CONTAINER: Centered single column */}
            <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-16">

                {/* TOP CONTROLS */}
                <div className="flex justify-between items-center mb-8">
                    <div className="w-12"></div>

                    {/* Settings / Edit Controls */}
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-stone-50 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 hover:border-amber-500 text-stone-700 dark:text-zinc-200 font-semibold rounded-2xl shadow-xs transition-all"
                                >
                                    <FaUserEdit /> {t('profile.editProfile')}
                                </motion.button>
                                <Link
                                    to="/settings"
                                    title={t('settings.title')}
                                    className="flex items-center justify-center w-11 h-11 bg-stone-50 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 hover:border-amber-500 hover:text-amber-500 text-stone-700 dark:text-zinc-200 rounded-2xl shadow-xs transition-all"
                                >
                                    <FaCog />
                                </Link>
                            </>
                        ) : (
                            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                <FaUserEdit className="animate-pulse" />
                                Düzenleme Modu
                            </span>
                        )}
                    </div>
                </div>

                {/* HERO SECTION: Centered Avatar & Info */}
                <div className="text-center relative mb-12">
                    <div className="relative inline-block mb-6">
                        <div className="w-48 h-48 rounded-full p-1.5 bg-gradient-to-br from-stone-600 via-amber-600 to-white mx-auto shadow-2xl">
                            <img
                                src={avatarUrl || getDefaultAvatar()}
                                alt="Profile"
                                className="w-full h-full object-cover rounded-full bg-stone-200 dark:bg-zinc-900 border-4 border-white dark:border-stone-800"
                            />
                        </div>
                        {isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="absolute inset-0 bg-black/50 rounded-full" />
                                <FaCamera className="text-white text-3xl relative z-10" />
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4 max-w-md mx-auto relative z-10">
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full text-center text-2xl font-black bg-stone-100 dark:bg-stone-950/50 border border-stone-300 dark:border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-stone-500 focus:outline-hidden"
                                placeholder="İsim"
                            />
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    className="w-full text-center text-xs bg-stone-100 dark:bg-stone-950/50 border border-stone-300 dark:border-zinc-700 rounded-xl px-4 py-2 text-stone-500 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                    placeholder="https://example.com/photo.jpg"
                                />
                                <p className="text-[10px] text-stone-400 dark:text-zinc-500 text-center">
                                    💡 Özel fotoğraf URL'si girin veya boş bırakın ({profile?.gender === 'female' ? 'kadın' : 'erkek'} avatar kullanılır)
                                </p>
                            </div>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full h-32 bg-stone-100 dark:bg-stone-950/50 border border-stone-300 dark:border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-stone-500 focus:outline-hidden resize-none text-center"
                                placeholder={t('profile.bioPlaceholder')}
                            />

                            {/* Social Links Edit Section */}
                            <div className="mt-6 p-4 bg-stone-100 dark:bg-stone-950/50 rounded-2xl border border-stone-300 dark:border-zinc-700">
                                <h3 className="text-sm font-bold text-stone-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                                    <FaLink className="text-amber-500" />
                                    {t('profile.socialLinks')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <FaGithub className="text-stone-700 dark:text-zinc-300 text-lg flex-shrink-0" />
                                        <div className="flex-1 flex items-center bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                                            <span className="text-xs text-stone-400 pl-3">github.com/</span>
                                            <input
                                                type="text"
                                                value={socialLinks.github || ''}
                                                onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value.replace(/^@/, '') }))}
                                                className="flex-1 text-sm bg-transparent px-1 py-2 focus:outline-none"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaLinkedin className="text-blue-600 text-lg flex-shrink-0" />
                                        <div className="flex-1 flex items-center bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                                            <span className="text-xs text-stone-400 pl-3">linkedin.com/in/</span>
                                            <input
                                                type="text"
                                                value={socialLinks.linkedin || ''}
                                                onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value.replace(/^@/, '') }))}
                                                className="flex-1 text-sm bg-transparent px-1 py-2 focus:outline-none"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaTwitter className="text-sky-500 text-lg flex-shrink-0" />
                                        <div className="flex-1 flex items-center bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                                            <span className="text-xs text-stone-400 pl-3">x.com/</span>
                                            <input
                                                type="text"
                                                value={socialLinks.twitter || ''}
                                                onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value.replace(/^@/, '') }))}
                                                className="flex-1 text-sm bg-transparent px-1 py-2 focus:outline-none"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaInstagram className="text-pink-500 text-lg flex-shrink-0" />
                                        <div className="flex-1 flex items-center bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500">
                                            <span className="text-xs text-stone-400 pl-3">instagram.com/</span>
                                            <input
                                                type="text"
                                                value={socialLinks.instagram || ''}
                                                onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value.replace(/^@/, '') }))}
                                                className="flex-1 text-sm bg-transparent px-1 py-2 focus:outline-none"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 md:col-span-2">
                                        <FaGlobe className="text-emerald-500 text-lg flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={socialLinks.website || ''}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                                            className="flex-1 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-zinc-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tight mb-3">
                                {displayName}
                            </h1>

                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    <FaStar /> Premium
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold uppercase tracking-wider">
                                    <FaCalendarAlt className="opacity-70" /> {user?.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '2024'}
                                </div>
                            </div>

                            {/* BIO as centered text */}
                            <div className="max-w-2xl mx-auto">
                                {bio ? (
                                    <p className="text-stone-600 dark:text-stone-300 text-base leading-relaxed text-center italic relative">
                                        <FaQuoteLeft className="inline-block text-amber-500/20 text-xl absolute -top-2 -left-4 transform -translate-x-full" />
                                        {bio}
                                    </p>
                                ) : (
                                    <p className="text-stone-400 dark:text-stone-600 text-sm italic">{t('profile.bioPlaceholder')}</p>
                                )}
                            </div>

                            {/* Social Links Display */}
                            {(socialLinks.github || socialLinks.linkedin || socialLinks.twitter || socialLinks.instagram || socialLinks.website) && (
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    {socialLinks.github && (
                                        <a
                                            href={`https://github.com/${socialLinks.github}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-zinc-300 hover:bg-gray-800 hover:text-white dark:hover:bg-stone-200 dark:hover:text-stone-800 transition-all hover:scale-110"
                                            title="GitHub"
                                        >
                                            <FaGithub size={18} />
                                        </a>
                                    )}
                                    {socialLinks.linkedin && (
                                        <a
                                            href={`https://linkedin.com/in/${socialLinks.linkedin}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all hover:scale-110"
                                            title="LinkedIn"
                                        >
                                            <FaLinkedin size={18} />
                                        </a>
                                    )}
                                    {socialLinks.twitter && (
                                        <a
                                            href={`https://x.com/${socialLinks.twitter}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition-all hover:scale-110"
                                            title="Twitter"
                                        >
                                            <FaTwitter size={18} />
                                        </a>
                                    )}
                                    {socialLinks.instagram && (
                                        <a
                                            href={`https://instagram.com/${socialLinks.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-pink-500 hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400 hover:text-white transition-all hover:scale-110"
                                            title="Instagram"
                                        >
                                            <FaInstagram size={18} />
                                        </a>
                                    )}
                                    {socialLinks.website && (
                                        <a
                                            href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all hover:scale-110"
                                            title="Website"
                                        >
                                            <FaGlobe size={18} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MARQUEE */}
                {!isEditing && (
                    <div className="w-full bg-amber-500/5 border-y border-amber-500/10 py-3 mb-12 overflow-hidden backdrop-blur-sm">
                        <Marquee gradient={false} speed={40} className="text-amber-600/50 dark:text-amber-400/50 font-bold uppercase tracking-[0.2em] text-xs">
                            &nbsp;&bull; EmuSportApp &bull; V.I.P &bull; MOVIE LOVER &bull; SERIES ADDICT &bull; GAMER &bull; BOOKWORM &bull; EXPLORER
                            &nbsp;&bull; EmuSportApp &bull; V.I.P &bull; MOVIE LOVER &bull; SERIES ADDICT &bull; GAMER &bull; BOOKWORM &bull; EXPLORER
                        </Marquee>
                    </div>
                )}

                {/* STATS ROW: Full Width Horizontal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
                    {[
                        { title: t('home.movieCount'), count: stats.movieCount, icon: <FaFilm />, color: 'text-blue-500', from: 'from-blue-500/10', to: 'to-blue-500/5', border: 'hover:border-blue-500/50' },
                        { title: t('home.seriesCount'), count: stats.seriesCount, icon: <FaTv />, color: 'text-emerald-500', from: 'from-emerald-500/10', to: 'to-emerald-500/5', border: 'hover:border-emerald-500/50' },
                        { title: t('home.gameCount'), count: stats.gameCount, icon: <FaGamepad />, color: 'text-amber-500', from: 'from-amber-500/10', to: 'to-amber-500/5', border: 'hover:border-amber-500/50' },
                        { title: t('home.bookCount'), count: stats.bookCount, icon: <FaBook />, color: 'text-amber-700', from: 'from-rose-500/10', to: 'to-rose-500/5', border: 'hover:border-amber-700/50' },
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -4 }}
                            className={`bg-gradient-to-br ${item.from} ${item.to} dark:bg-stone-900/40 p-5 rounded-3xl border border-white/10 dark:border-white/5 ${item.border} transition-all relative overflow-hidden group`}
                        >
                            <div className={`text-2xl mb-3 ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                            <div className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-1">{statsLoading ? '-' : item.count}</div>
                            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-widest">{item.title}</div>
                        </motion.div>
                    ))}
                </div>

                {/* TAB SYSTEM */}
                <div className="mb-12">
                    {/* Tab Headers */}
                    <div className="flex border-b-2 border-stone-200 dark:border-zinc-800 mb-8">
                        {[
                            { id: 'favorites' as const, label: t('profile.favorites'), icon: <FaHeart /> },
                            { id: 'recent' as const, label: t('stats.recentWatched'), icon: <FaHistory /> },
                            { id: 'stats' as const, label: 'İstatistikler', icon: <FaChartBar /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-6 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all relative ${activeTab === tab.id
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'favorites' && (
                            <motion.div
                                key="favorites"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {favorites.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {favorites.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItem(item as MediaItem)}
                                                className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
                                            >
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                                                    <div className="text-white font-bold text-base line-clamp-2 leading-tight mb-1.5 group-hover:text-amber-300 transition-colors">{item.title}</div>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-300 uppercase font-bold tracking-wider">
                                                        <span className={`px-1.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 ${item.type === 'movie' ? 'text-blue-200' :
                                                            item.type === 'series' ? 'text-emerald-200' :
                                                                item.type === 'game' ? 'text-amber-200' : 'text-rose-200'
                                                            }`}>
                                                            {item.type}
                                                        </span>
                                                        {item.rating && <span className="text-amber-400 flex items-center gap-0.5"><FaStar size={8} /> {item.rating}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-stone-50 dark:bg-stone-900/30 rounded-2xl border-2 border-dashed border-stone-200 dark:border-zinc-700">
                                        <FaHeart className="text-5xl mx-auto mb-4 text-stone-300 dark:text-zinc-600" />
                                        <p className="text-base font-medium text-stone-400 dark:text-zinc-500">{t('profile.noFavorites')}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'recent' && (
                            <motion.div
                                key="recent"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {recentlyWatched.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentlyWatched.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItem(item as unknown as MediaItem)}
                                                className="block group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-5 p-4 rounded-3xl hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors border border-transparent hover:border-stone-200 dark:hover:border-zinc-700 hover:shadow-lg">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300 ${item.type === 'movie' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                        item.type === 'series' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                            item.type === 'game' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                                                'bg-amber-50 text-rose-600 dark:bg-amber-900/20 dark:text-amber-700'
                                                        }`}>
                                                        {item.type === 'movie' ? <FaFilm /> :
                                                            item.type === 'series' ? <FaTv /> :
                                                                item.type === 'game' ? <FaGamepad /> : <FaBook />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors">
                                                            {item.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                                                {t(`nav.${item.type}s`)}
                                                            </span>
                                                            {item.rating && (
                                                                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                                                    ★ {item.rating}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 dark:text-stone-700 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                        <FaChevronRight />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-stone-50 dark:bg-stone-900/30 rounded-2xl border-2 border-dashed border-stone-200 dark:border-zinc-700">
                                        <FaHistory className="text-5xl mx-auto mb-4 text-stone-300 dark:text-zinc-600" />
                                        <p className="text-base font-medium text-stone-400 dark:text-zinc-500">{t('stats.noRecent')}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'stats' && (
                            <motion.div
                                key="stats"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        {
                                            label: 'Toplam İçerik',
                                            value: stats.totalCount,
                                            icon: <FaPlus />,
                                            color: 'text-purple-500',
                                            bg: 'from-purple-500/10 to-purple-500/5'
                                        },
                                        {
                                            label: 'Favoriler',
                                            value: favorites.length,
                                            icon: <FaHeart />,
                                            color: 'text-red-500',
                                            bg: 'from-red-500/10 to-red-500/5'
                                        },
                                        {
                                            label: 'En Yüksek Puan',
                                            value: topRated.length > 0 ? Math.max(...topRated.map(i => Number(i.rating) || 0)) : 0,
                                            icon: <FaTrophy />,
                                            color: 'text-amber-500',
                                            bg: 'from-amber-500/10 to-amber-500/5'
                                        },
                                        {
                                            label: 'Ortalama Puan',
                                            value: allItems.filter(i => i.rating).length > 0
                                                ? (allItems.filter(i => i.rating).reduce((acc: number, i) => acc + (Number(i.rating) || 0), 0) / allItems.filter(i => i.rating).length).toFixed(1)
                                                : '0',
                                            icon: <FaStar />,
                                            color: 'text-yellow-500',
                                            bg: 'from-yellow-500/10 to-yellow-500/5'
                                        },
                                    ].map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ y: -4 }}
                                            className={`bg-gradient-to-br ${item.bg} dark:bg-stone-900/40 p-5 rounded-3xl border border-white/10 dark:border-white/5 transition-all relative overflow-hidden group`}
                                        >
                                            <div className={`text-2xl mb-3 ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                                            <div className="text-3xl font-black text-stone-900 dark:text-stone-100 mb-1">{item.value}</div>
                                            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-widest">{item.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Top Rated Content Preview */}
                                {topRated.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                                            <FaTrophy className="text-amber-500" />
                                            En Yüksek Puanlı İçerikler
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {topRated.map((item, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    whileHover={{ scale: 1.05 }}
                                                    onClick={() => setSelectedItem(item as MediaItem)}
                                                    className="relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group shadow-lg"
                                                >
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                                                        <div className="text-white font-bold text-xs truncate">{item.title}</div>
                                                        <div className="text-amber-400 text-xs flex items-center gap-1">
                                                            <FaStar size={10} />
                                                            {item.rating}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* STICKY EDIT ACTION BAR */}
            {/* STICKY EDIT ACTION BAR - Sayfanın üst kısmında sabit */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-20 left-0 right-0 z-50"
                    >
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200 dark:border-zinc-700 rounded-2xl shadow-2xl">
                                <div className="px-6 py-4">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Sol taraf - Bilgi metni */}
                                        <div className="flex items-center gap-3">
                                            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
                                                <FaUserEdit className="text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-stone-900 dark:text-white">Profil Düzenleniyor</p>
                                                <p className="text-xs text-stone-500 dark:text-zinc-400 hidden sm:block">Değişikliklerinizi kaydetmeyi unutmayın</p>
                                            </div>
                                        </div>

                                        {/* Sağ taraf - Aksiyon butonları */}
                                        <div className="flex items-center gap-3 ml-auto">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIsEditing(false)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-stone-100 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all"
                                            >
                                                <FaTimes className="text-sm" />
                                                <span className="hidden sm:inline">{t('profile.cancel')}</span>
                                                <span className="sm:hidden">İptal</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSave}
                                                disabled={loading}
                                                className="relative flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-amber-500/25"
                                            >
                                                {/* Gradient arkaplan */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500"></div>

                                                {/* Hover shine efekti */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                                                {/* Buton içeriği */}
                                                <span className="relative flex items-center gap-2">
                                                    {loading ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <FaCheck className="text-sm" />
                                                    )}
                                                    <span className="hidden sm:inline">{t('profile.saveProfile')}</span>
                                                    <span className="sm:hidden">Kaydet</span>
                                                </span>
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />

            <DetailModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
                refetch={refetchMedia}
            />
        </div>
    );
}