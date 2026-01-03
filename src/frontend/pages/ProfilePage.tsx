import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import useUserProfile from '../hooks/useUserProfile';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FaUserEdit, FaCamera, FaHeart, FaFilm, FaTv, FaGamepad, FaBook, FaCalendarAlt, FaCheck, FaTimes, FaCog, FaStar, FaHistory, FaChevronRight, FaQuoteLeft, FaGithub, FaLinkedin, FaTwitter, FaInstagram, FaGlobe, FaLink } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../../backend/config/firebaseConfig';
import toast from 'react-hot-toast';
import useMediaStats from '../hooks/useMediaStats';
import useMedia from '../hooks/useMedia';
import Footer from '../components/Footer';
import useMediaHistory from '../hooks/useMediaHistory';

export default function ProfilePage() {
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const { t } = useLanguage();
    const { stats, loading: statsLoading } = useMediaStats();
    const { items: allItems } = useMedia('all', 'all', true);
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
        // Only use photoURL if it's a custom one (not our default avatars)
        if (user?.photoURL &&
            user.photoURL !== MALE_AVATAR_URL &&
            user.photoURL !== FEMALE_AVATAR_URL) {
            setAvatarUrl(user.photoURL);
        } else {
            setAvatarUrl(''); // Will use gender-based default
        }
    }, [user, profile]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Determine final photoURL to save
            let finalPhotoURL: string | null = null;

            if (avatarUrl && avatarUrl.trim() !== '') {
                // User provided a custom URL - use it
                finalPhotoURL = avatarUrl.trim();
            } else {
                // No custom URL - set to null so gender-based avatar will be used
                finalPhotoURL = null;
            }

            // Update Firebase Auth profile
            if (displayName !== user.displayName || finalPhotoURL !== user.photoURL) {
                await updateProfile(user, {
                    displayName,
                    photoURL: finalPhotoURL
                });
            }

            // Update Firestore user document
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { bio, socialLinks }, { merge: true });

            toast.success(t('profile.saveSuccess') || 'Profil güncellendi!');
            setIsEditing(false);

            // Force reload to show updated avatar
            window.location.reload();
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

    return (
        <div className="min-h-screen pt-4 pb-0 relative">

            {/* MAIN CONTAINER: Centered single column */}
            <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-16">

                {/* TOP CONTROLS */}
                <div className="flex justify-between items-center mb-8">
                    {/* Settings Left (for symmetry if needed, or keeping Right as before) */}
                    <div className="w-12"></div>

                    {/* Settings / Edit Controls */}
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-500 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl shadow-xs transition-all"
                                >
                                    <FaUserEdit /> {t('profile.editProfile')}
                                </motion.button>
                                <Link
                                    to="/settings"
                                    title={t('settings.title')}
                                    className="flex items-center justify-center w-11 h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-500 hover:text-amber-500 text-gray-700 dark:text-gray-200 rounded-2xl shadow-xs transition-all"
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
                    {/* Decorative Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-amber-500/10 to-stone-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative inline-block mb-6">
                        <div className="w-48 h-48 rounded-full p-1.5 bg-gradient-to-br from-stone-600 via-amber-600 to-white mx-auto shadow-2xl">
                            <img
                                src={avatarUrl || getDefaultAvatar()}
                                alt="Profile"
                                className="w-full h-full object-cover rounded-full bg-gray-100 dark:bg-gray-900 border-4 border-white dark:border-stone-800"
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
                                className="w-full text-center text-2xl font-black bg-gray-50 dark:bg-stone-950/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-stone-500 focus:outline-hidden"
                                placeholder="İsim"
                            />
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    className="w-full text-center text-xs bg-gray-50 dark:bg-stone-950/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-gray-500 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                    placeholder="https://example.com/photo.jpg"
                                />
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                                    💡 Özel fotoğraf URL'si girin veya boş bırakın ({profile?.gender === 'female' ? 'kadın' : 'erkek'} avatar kullanılır)
                                </p>
                            </div>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full h-32 bg-gray-50 dark:bg-stone-950/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-stone-500 focus:outline-hidden resize-none text-center"
                                placeholder={t('profile.bioPlaceholder')}
                            />

                            {/* Social Links Edit Section */}
                            <div className="mt-6 p-4 bg-gray-50 dark:bg-stone-950/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                    <FaLink className="text-amber-500" />
                                    {t('profile.socialLinks')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <FaGithub className="text-gray-700 dark:text-gray-300 text-lg flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={socialLinks.github || ''}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
                                            className="flex-1 text-sm bg-white dark:bg-stone-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                            placeholder="github.com/username"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaLinkedin className="text-blue-600 text-lg flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={socialLinks.linkedin || ''}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                                            className="flex-1 text-sm bg-white dark:bg-stone-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                            placeholder="linkedin.com/in/username"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaTwitter className="text-sky-500 text-lg flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={socialLinks.twitter || ''}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                                            className="flex-1 text-sm bg-white dark:bg-stone-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                            placeholder="twitter.com/username"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaInstagram className="text-pink-500 text-lg flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={socialLinks.instagram || ''}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                                            className="flex-1 text-sm bg-white dark:bg-stone-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                            placeholder="instagram.com/username"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 md:col-span-2">
                                        <FaGlobe className="text-emerald-500 text-lg flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={socialLinks.website || ''}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                                            className="flex-1 text-sm bg-white dark:bg-stone-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black text-gray-900 dark:text-stone-100 tracking-tight mb-3">
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
                                    <p className="text-gray-600 dark:text-stone-300 text-base leading-relaxed text-center italic relative">
                                        <FaQuoteLeft className="inline-block text-amber-500/20 text-xl absolute -top-2 -left-4 transform -translate-x-full" />
                                        {bio}
                                    </p>
                                ) : (
                                    <p className="text-gray-400 dark:text-gray-600 text-sm italic">{t('profile.bioPlaceholder')}</p>
                                )}
                            </div>

                            {/* Social Links Display */}
                            {(socialLinks.github || socialLinks.linkedin || socialLinks.twitter || socialLinks.instagram || socialLinks.website) && (
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    {socialLinks.github && (
                                        <a
                                            href={socialLinks.github.startsWith('http') ? socialLinks.github : `https://${socialLinks.github}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200 dark:hover:text-gray-800 transition-all hover:scale-110"
                                            title="GitHub"
                                        >
                                            <FaGithub size={18} />
                                        </a>
                                    )}
                                    {socialLinks.linkedin && (
                                        <a
                                            href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://${socialLinks.linkedin}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all hover:scale-110"
                                            title="LinkedIn"
                                        >
                                            <FaLinkedin size={18} />
                                        </a>
                                    )}
                                    {socialLinks.twitter && (
                                        <a
                                            href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://${socialLinks.twitter}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-sky-500 hover:bg-sky-500 hover:text-white transition-all hover:scale-110"
                                            title="Twitter"
                                        >
                                            <FaTwitter size={18} />
                                        </a>
                                    )}
                                    {socialLinks.instagram && (
                                        <a
                                            href={socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://${socialLinks.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-pink-500 hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400 hover:text-white transition-all hover:scale-110"
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
                                            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-stone-800 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all hover:scale-110"
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

                {/* STATS ROW: Full Width Horizontal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
                    {[
                        { title: t('home.movieCount'), count: stats.movieCount, icon: <FaFilm />, color: 'text-blue-500', from: 'from-blue-500/10', to: 'to-blue-500/5', border: 'hover:border-blue-500/50' },
                        { title: t('home.seriesCount'), count: stats.seriesCount, icon: <FaTv />, color: 'text-emerald-500', from: 'from-emerald-500/10', to: 'to-emerald-500/5', border: 'hover:border-emerald-500/50' },
                        { title: t('home.gameCount'), count: stats.gameCount, icon: <FaGamepad />, color: 'text-amber-500', from: 'from-amber-500/10', to: 'to-amber-500/5', border: 'hover:border-amber-500/50' },
                        { title: t('home.bookCount'), count: stats.bookCount, icon: <FaBook />, color: 'text-rose-500', from: 'from-rose-500/10', to: 'to-rose-500/5', border: 'hover:border-rose-500/50' },
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -4 }}
                            className={`bg-gradient-to-br ${item.from} ${item.to} dark:bg-stone-900/40 p-5 rounded-3xl border border-white/10 dark:border-white/5 ${item.border} transition-all relative overflow-hidden group`}
                        >
                            <div className={`text-2xl mb-3 ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                            <div className="text-3xl font-black text-gray-900 dark:text-stone-100 mb-1">{statsLoading ? '-' : item.count}</div>
                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{item.title}</div>
                        </motion.div>
                    ))}
                </div>

                {/* CONTENT SECTIONS STACKED */}
                <div className="space-y-12">

                    {/* FAVORITES */}
                    <div className="bg-white dark:bg-stone-900/30 rounded-[2.5rem] p-8 md:p-10 border border-gray-100 dark:border-white/5 shadow-2xl shadow-stone-900/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100 flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-500">
                                    <FaHeart />
                                </div>
                                {t('profile.favorites')}
                            </h2>
                            <Link to="/all" className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all border border-transparent hover:border-amber-200 dark:hover:border-amber-700/30">
                                {t('home.viewCollection') || 'Tümünü Gör'}
                            </Link>
                        </div>

                        {favorites.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {favorites.map((item) => (
                                    <Link to={`/${item.type}`} key={item.id} className="group relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
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
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-stone-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <FaHeart className="text-4xl mb-3 opacity-20" />
                                <p className="text-sm font-medium">{t('profile.noFavorites')}</p>
                            </div>
                        )}
                    </div>

                    {/* RECENTLY WATCHED */}
                    <div className="bg-white dark:bg-stone-900/30 rounded-[2.5rem] p-8 md:p-10 border border-gray-100 dark:border-white/5 shadow-2xl shadow-stone-900/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mt-32 pointer-events-none"></div>

                        <div className="mb-8 relative z-10">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-stone-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-500">
                                    <FaHistory />
                                </div>
                                {t('stats.recentWatched')}
                            </h2>
                        </div>

                        {recentlyWatched.length > 0 ? (
                            <div className="space-y-3">
                                {recentlyWatched.map((item) => (
                                    <Link to={`/${item.type}`} key={item.id} className="block group">
                                        <div className="flex items-center gap-5 p-4 rounded-3xl hover:bg-white dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5 hover:shadow-lg dark:hover:shadow-black/20">
                                            {/* Icon Box */}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300 ${item.type === 'movie' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                item.type === 'series' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                    item.type === 'game' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                                        'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                                }`}>
                                                {item.type === 'movie' ? <FaFilm /> :
                                                    item.type === 'series' ? <FaTv /> :
                                                        item.type === 'game' ? <FaGamepad /> : <FaBook />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors">
                                                    {item.title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-stone-400 uppercase tracking-wider">
                                                        {t(`nav.${item.type}s`)}
                                                    </span>
                                                    {item.rating && (
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                                            ★ {item.rating}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Arrow */}
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 dark:text-stone-700 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                <FaChevronRight />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400 dark:text-stone-500 bg-gray-50 dark:bg-stone-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <FaHistory className="text-5xl mx-auto mb-4 opacity-20" />
                                <p className="text-base font-medium">{t('stats.noRecent')}</p>
                            </div>
                        )}
                    </div>

                </div>

            </div>

            {/* STICKY EDIT ACTION BAR */}
            {isEditing && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-50"
                >
                    {/* Gradient top border */}
                    <div className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

                    {/* Glassmorphism bar */}
                    <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/50 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
                        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                            <div className="flex items-center justify-between gap-4">
                                {/* Left side - info text */}
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 items-center justify-center">
                                        <FaUserEdit className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Profil Düzenleniyor</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Değişikliklerinizi kaydetmeyi unutmayın</p>
                                    </div>
                                </div>

                                {/* Right side - action buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <FaTimes className="text-sm" />
                                        <span className="hidden sm:inline">{t('profile.cancel')}</span>
                                        <span className="sm:hidden">İptal</span>
                                    </button>

                                    {/* Animated Save Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="relative flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        {/* Animated gradient background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]"></div>

                                        {/* Shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                                        {/* Button content */}
                                        <span className="relative flex items-center gap-2">
                                            {loading ? (
                                                <span className="animate-spin">⏳</span>
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
                </motion.div>
            )}

            <Footer />
        </div>
    );
}
