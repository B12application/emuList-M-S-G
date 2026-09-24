// src/frontend/components/settings/ApiQuotaSettingsSection.tsx
// Comprehensive Dashboard for API Daily Usage, OMDb 1,000 Quota Tracking, TMDb Requests, and Smart Cache Management

import { useState, useEffect } from 'react';
import {
    FaBolt, FaFilm, FaTv, FaDatabase, FaTrash,
    FaCheck, FaExclamationTriangle, FaInfoCircle, FaSave,
    FaChartLine, FaShieldAlt
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAppSound } from '../../context/SoundContext';
import {
    getApiUsage,
    getQuotaConfig,
    saveQuotaConfig,
    getCacheStats,
    clearApiCache,
    refreshSharedQuotaFromRedis,
    type DailyApiUsage,
    type ApiQuotaConfig,
    type CacheStats
} from '../../../backend/services/apiQuotaService';
import { checkRedisStatus, type RedisStatusResult } from '../../../backend/services/redisService';
import ConfirmDialog from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function ApiQuotaSettingsSection() {
    const { t } = useLanguage();
    const { playSuccess, playPop } = useAppSound();

    const [usage, setUsage] = useState<DailyApiUsage>(getApiUsage());
    const [config, setConfig] = useState<ApiQuotaConfig>(getQuotaConfig());
    const [cacheStats, setCacheStats] = useState<CacheStats>(getCacheStats());
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [redisStatus, setRedisStatus] = useState<RedisStatusResult | null>(null);

    // Form states
    const [omdbLimit, setOmdbLimit] = useState(config.omdbDailyLimit.toString());
    const [tmdbLimit, setTmdbLimit] = useState(config.tmdbDailyLimit.toString());
    const [blockWhenLimitReached, setBlockWhenLimitReached] = useState(config.blockWhenLimitReached);

    // Refresh usage on mount
    useEffect(() => {
        setUsage(getApiUsage());
        setCacheStats(getCacheStats());

        // Check global Redis status and sync shared quota
        checkRedisStatus().then(status => setRedisStatus(status));
        refreshSharedQuotaFromRedis().then(fresh => setUsage(fresh));
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const omdbPercent = Math.min(100, Math.round((usage.omdb / (config.omdbDailyLimit || 1000)) * 100));
    const tmdbPercent = Math.min(100, Math.round((usage.tmdb / (config.tmdbDailyLimit || 2500)) * 100));

    const totalRequestsHandled = usage.omdb + usage.tmdb + usage.cacheHits;
    const cacheSavingsPercent = totalRequestsHandled > 0
        ? Math.round((usage.cacheHits / totalRequestsHandled) * 100)
        : 0;

    const handleSaveConfig = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedOmdb = parseInt(omdbLimit, 10) || 1000;
        const parsedTmdb = parseInt(tmdbLimit, 10) || 2500;

        const updated: ApiQuotaConfig = {
            omdbDailyLimit: parsedOmdb,
            tmdbDailyLimit: parsedTmdb,
            blockWhenLimitReached
        };

        saveQuotaConfig(updated);
        setConfig(updated);
        playSuccess();
        toast.success(t('settings.apiQuota.configSaved') || 'Kota ayarları güncellendi!');
    };

    const handleClearCache = () => {
        const cleared = clearApiCache();
        setCacheStats(getCacheStats());
        setUsage(getApiUsage());
        setShowConfirmClear(false);
        playPop();
        toast.success(`${cleared} ${t('settings.apiQuota.cacheCleared') || 'önbellek kaydı silindi!'}`);
    };

    return (
        <div className="space-y-6">
            {/* ═══ REDIS EDGE STATUS BANNER ═══ */}
            <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                redisStatus?.connected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                    : 'bg-stone-50 dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800'
            }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                            redisStatus?.connected
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}>
                            <FaBolt />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                                    {redisStatus?.connected
                                        ? 'Upstash Serverless Redis Aktif'
                                        : 'Merkezi Hibrit Mod (Firestore + Yerel Bellek)'}
                                </h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    redisStatus?.connected
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}>
                                    {redisStatus?.connected ? 'Edge Aktif' : 'Yerel / Firestore'}
                                </span>
                            </div>
                            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                                {redisStatus?.connected
                                    ? `Tüm kullanıcılar ve cihazlar tek bir ortak Redis havuzundan (5-15ms) besleniyor. Kayıtlı Öğe: ${redisStatus.dbSize}`
                                    : 'Cloudflare Pages üzerinde UPSTASH_REDIS_REST_URL tanımlandığında tüm kullanıcılar anında ortak Redis havuzuna bağlanır.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ 1. THREE MAIN STAT CARDS ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                
                {/* OMDb API 1000 Limit Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                                <FaFilm size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                                    {t('settings.apiQuota.omdbCardTitle') || 'OMDb API Günlük Kotası'}
                                </h3>
                                <p className="text-[10px] text-stone-400">
                                    1.000 İstek / Gün (Resmi Sınır)
                                </p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                            omdbPercent >= 90
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : omdbPercent >= 60
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                            %{omdbPercent}
                        </span>
                    </div>

                    <div className="my-2">
                        <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-2xl font-black text-stone-900 dark:text-white">
                                {usage.omdb}
                            </span>
                            <span className="text-xs text-stone-400 font-bold">
                                / {config.omdbDailyLimit} {t('common.requests') || 'istek'}
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                    omdbPercent >= 90
                                        ? 'bg-rose-500'
                                        : omdbPercent >= 60
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                }`}
                                style={{ width: `${omdbPercent}%` }}
                            />
                        </div>
                    </div>

                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800/80">
                        {config.omdbDailyLimit - usage.omdb > 0
                            ? `${config.omdbDailyLimit - usage.omdb} istek hakkınız kaldı (00:00 UTC'de sıfırlanır).`
                            : 'Günlük OMDb kotası doldu! TMDb devrede.'}
                    </p>
                </div>

                {/* TMDb API Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black">
                                <FaTv size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                                    {t('settings.apiQuota.tmdbCardTitle') || 'TMDb API İstekleri'}
                                </h3>
                                <p className="text-[10px] text-stone-400">
                                    Oyuncu, Filmografi & Görseller
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            Hız Korumalı
                        </span>
                    </div>

                    <div className="my-2">
                        <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-2xl font-black text-stone-900 dark:text-white">
                                {usage.tmdb}
                            </span>
                            <span className="text-xs text-stone-400 font-bold">
                                {t('common.today') || 'bugün'}
                            </span>
                        </div>
                        {/* Progress Bar (Against safety threshold) */}
                        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                                style={{ width: `${tmdbPercent}%` }}
                            />
                        </div>
                    </div>

                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800/80">
                        TMDb'de günlük 1.000 sınırı yoktur; dakikalık aşırı yüklenmeler önbellekle korunur.
                    </p>
                </div>

                {/* Smart Cache Savings Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                                <FaDatabase size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                                    {t('settings.apiQuota.cacheCardTitle') || 'Akıllı Önbellek Tasarrufu'}
                                </h3>
                                <p className="text-[10px] text-stone-400">
                                    Sıfır Gecikme & Kota Koruma
                                </p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            %{cacheSavingsPercent} Tasarruf
                        </span>
                    </div>

                    <div className="my-2">
                        <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {usage.cacheHits}
                            </span>
                            <span className="text-xs text-stone-400 font-bold">
                                {t('settings.apiQuota.savedRequests') || 'kurtarılan istek'}
                            </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                                style={{ width: `${Math.min(100, cacheSavingsPercent)}%` }}
                            />
                        </div>
                    </div>

                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800/80">
                        {cacheStats.itemCount} kayıt cihazınızda hazır saklanıyor ({formatBytes(cacheStats.sizeBytes)}).
                    </p>
                </div>
            </div>

            {/* ═══ 2. CACHE DETAILS & MANAGEMENT CARD ═══ */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-stone-200/80 dark:border-zinc-800/80 shadow-lg space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <FaBolt size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-stone-900 dark:text-white">
                                {t('settings.apiQuota.title') || 'API & Önbellek Yönetim Merkezi'}
                            </h2>
                            <p className="text-xs text-stone-500 dark:text-zinc-400">
                                {t('settings.apiQuota.subtitle') || 'Oyuncu kadrosu, film detayları ve günlük limit ayarları'}
                            </p>
                        </div>
                    </div>

                    {/* Clear Cache Button */}
                    <button
                        type="button"
                        onClick={() => setShowConfirmClear(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-rose-200/70 dark:border-rose-800/70 cursor-pointer active:scale-95"
                    >
                        <FaTrash size={12} />
                        <span>{t('settings.apiQuota.clearCache') || 'Önbelleği Temizle'}</span>
                    </button>
                </div>

                {/* Cache Analytics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 text-center">
                        <span className="text-[11px] text-stone-500 dark:text-zinc-400 block font-medium mb-1">
                            {t('settings.apiQuota.cacheItems') || 'Önbellek Kayıtları'}
                        </span>
                        <span className="text-lg font-black text-stone-900 dark:text-white">
                            {cacheStats.itemCount}
                        </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 text-center">
                        <span className="text-[11px] text-stone-500 dark:text-zinc-400 block font-medium mb-1">
                            {t('settings.apiQuota.cacheSize') || 'Önbellek Boyutu'}
                        </span>
                        <span className="text-lg font-black text-stone-900 dark:text-white">
                            {formatBytes(cacheStats.sizeBytes)}
                        </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 text-center">
                        <span className="text-[11px] text-stone-500 dark:text-zinc-400 block font-medium mb-1">
                            {t('settings.apiQuota.quotaSaved') || 'Kurtarılan İstek'}
                        </span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {usage.cacheHits}
                        </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/60 text-center">
                        <span className="text-[11px] text-stone-500 dark:text-zinc-400 block font-medium mb-1">
                            Tasarruf Oranı
                        </span>
                        <span className="text-lg font-black text-sky-600 dark:text-sky-400">
                            %{cacheSavingsPercent}
                        </span>
                    </div>
                </div>

                {/* ═══ 3. QUOTA CONFIGURATION FORM ═══ */}
                <form onSubmit={handleSaveConfig} className="space-y-4 pt-3 border-t border-stone-100 dark:border-zinc-800/80">
                    <h3 className="text-xs font-black text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <FaShieldAlt className="text-amber-500" size={13} />
                        <span>Kota Aşım Koruması & Limit Ayarları</span>
                    </h3>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/70 dark:border-zinc-800/80">
                        <div>
                            <span className="text-xs font-bold text-stone-900 dark:text-white block">
                                {t('settings.apiQuota.blockWhenLimitReached') || 'Günlük Kota Aşım Koruması'}
                            </span>
                            <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mt-0.5">
                                {t('settings.apiQuota.blockWhenLimitReachedDesc') || 'OMDb günlük 1.000 sınırına ulaştığında dış servise istek atmayı engeller.'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setBlockWhenLimitReached(!blockWhenLimitReached)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                                blockWhenLimitReached ? 'bg-amber-500 shadow-md shadow-amber-500/20' : 'bg-stone-300 dark:bg-zinc-700'
                            }`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                                blockWhenLimitReached ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                                {t('settings.apiQuota.omdbLimitInput') || 'OMDb Günlük Limiti'} (Varsayılan: 1000)
                            </label>
                            <input
                                type="number"
                                min={100}
                                max={5000}
                                value={omdbLimit}
                                onChange={(e) => setOmdbLimit(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-stone-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-700 dark:text-zinc-300">
                                {t('settings.apiQuota.tmdbLimitInput') || 'TMDb Günlük Uyarı Sınırı'} (Varsayılan: 2500)
                            </label>
                            <input
                                type="number"
                                min={500}
                                max={10000}
                                value={tmdbLimit}
                                onChange={(e) => setTmdbLimit(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-stone-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-sky-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-amber-500 text-white dark:bg-zinc-800 dark:hover:bg-amber-500 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            <FaSave size={12} />
                            <span>{t('settings.apiQuota.saveConfig') || 'Ayarları Kaydet'}</span>
                        </button>
                    </div>
                </form>

                {/* ═══ 4. EDUCATIONAL INFO ACCORDION ═══ */}
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-400">
                        <FaInfoCircle size={14} />
                        <span>{t('settings.apiQuota.infoTitle') || 'API Limitleri ve Kota Hakkında Önemli Bilgiler'}</span>
                    </div>
                    <ul className="space-y-1.5 text-stone-600 dark:text-zinc-400 text-[11px] leading-relaxed list-disc list-inside">
                        <li>
                            <strong className="text-stone-800 dark:text-zinc-200">OMDb API (1.000 Sınırı):</strong> {t('settings.apiQuota.infoOmdb') || 'OMDb ücretsiz API anahtarları takvim günü başına tam 1.000 istek ile sınırlandırılmıştır. Kotanız dolduğunda servis arama yapmayı durdurur.'}
                        </li>
                        <li>
                            <strong className="text-stone-800 dark:text-zinc-200">TMDb API:</strong> {t('settings.apiQuota.infoTmdb') || 'TMDb API\'de günlük katı bir 1.000 sınırı bulunmamakla birlikte, ani yüklenmelerde IP hız kısıtlaması (rate-limiting) uygulanır.'}
                        </li>
                        <li>
                            <strong className="text-stone-800 dark:text-zinc-200">B12 Akıllı Önbellek:</strong> {t('settings.apiQuota.infoCache') || 'B12, tıkladığınız oyuncunun filmografisini ve film kadrolarını 7-14 gün boyunca cihazınızda saklar. Tekrar eden ziyaretlerinizde kotanızdan 1 istek dahi harcanmaz.'}
                        </li>
                    </ul>
                </div>
            </div>

            {/* Confirm Clear Cache Modal */}
            <ConfirmDialog
                isOpen={showConfirmClear}
                title={t('settings.apiQuota.clearCache') || 'Önbelleği Temizle'}
                message={t('settings.apiQuota.clearCacheConfirm') || 'Tüm önbelleğe alınmış film ve oyuncu verileri silinecektir. Tekrar ziyaret ettiğinizde API istekleri yeniden yapılacaktır. Emin misiniz?'}
                confirmText={t('actions.delete') || 'Temizle'}
                variant="danger"
                onConfirm={handleClearCache}
                onClose={() => setShowConfirmClear(false)}
            />
        </div>
    );
}
