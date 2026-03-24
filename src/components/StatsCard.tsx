import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  target?: number;
  progress?: number;
  color: 'red' | 'green' | 'blue' | 'amber';
}

export default function StatsCard({
  title,
  value,
  subtitle,
  unit,
  icon: Icon,
  trend,
  target,
  progress,
  color,
}: StatsCardProps) {
  const colorClasses = {
    red: 'text-red-500 bg-red-100/80 dark:bg-red-900/30',
    green: 'text-green-500 bg-green-100/80 dark:bg-green-900/30',
    blue: 'text-blue-500 bg-blue-100/80 dark:bg-blue-900/30',
    amber: 'text-amber-500 bg-amber-100/80 dark:bg-amber-900/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="p-4 glass-soft rounded-xl border border-white/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all"
    >
      <div className="h-1 w-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 mb-3 opacity-70" />
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? 'text-red-500' : 'text-green-500'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black text-gray-900 dark:text-white">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
          )}
          {subtitle && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</span>
          )}
        </div>
      </div>

      {target !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span>Target: {target} min</span>
            <span className={Number(value) <= target ? 'text-green-500' : 'text-red-500'}>
              {Number(value) <= target ? 'On Track' : 'Behind'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((Number(value) / target) * 100, 100)}%` }}
              className={`h-full rounded-full ${
                Number(value) <= target ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full ${colorClasses[color].split(' ')[0].replace('text', 'bg')}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
