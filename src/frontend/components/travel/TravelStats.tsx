import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaRoute, FaCheckCircle, FaCity } from 'react-icons/fa';

interface TravelStatsProps {
  visitedCities: number;
  totalVisitedPlaces: number;
  activePlans: number;
  totalAttractions: number;
}

export default function TravelStats({
  visitedCities,
  totalVisitedPlaces,
  activePlans,
  totalAttractions,
}: TravelStatsProps) {
  const stats = [
    {
      label: 'Gezilen İl',
      value: visitedCities,
      total: 81,
      icon: FaCity,
      gradient: 'from-sky-500 to-cyan-400',
      bgGlow: 'bg-sky-500/10',
      iconColor: 'text-sky-400',
    },
    {
      label: 'Gezilen Yer',
      value: totalVisitedPlaces,
      total: null,
      icon: FaCheckCircle,
      gradient: 'from-emerald-500 to-teal-400',
      bgGlow: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Aktif Plan',
      value: activePlans,
      total: null,
      icon: FaRoute,
      gradient: 'from-violet-500 to-purple-400',
      bgGlow: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
    },
    {
      label: 'Keşfedilen',
      value: totalAttractions,
      total: null,
      icon: FaMapMarkerAlt,
      gradient: 'from-amber-500 to-orange-400',
      bgGlow: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          className="relative group"
        >
          <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-stone-200 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-all duration-300">
            {/* Background glow */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${stat.bgGlow} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10`}>
                <stat.icon className="text-white text-lg" />
              </div>
              <div>
                <div className="text-2xl font-black text-stone-900 dark:text-white">
                  {stat.value}
                  {stat.total && (
                    <span className="text-sm font-normal text-stone-400 dark:text-zinc-500">/{stat.total}</span>
                  )}
                </div>
                <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">{stat.label}</div>
              </div>
            </div>

            {/* Progress bar for cities */}
            {stat.total && (
              <div className="mt-3 w-full h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((stat.value / stat.total) * 100)}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`}
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
