import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, BarChart2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getStreak,
  getLongestStreak,
  getHeatmapData,
  getSelfRatingTrend,
  getMetricsTrend,
  getSessions,
} from '../utils/progressStore';

/* ─── Heatmap Cell ─── */
function HeatmapCell({ date, count }) {
  const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let bg = 'bg-white/5';
  if (count === 1) bg = 'bg-accent-primary/30';
  if (count === 2) bg = 'bg-accent-primary/60';
  if (count >= 3) bg = 'bg-accent-primary';

  return (
    <div
      title={`${label}: ${count} session${count !== 1 ? 's' : ''}`}
      className={`w-full aspect-square rounded-md ${bg} transition-all hover:scale-110 cursor-default`}
    />
  );
}

/* ─── Custom Tooltip ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-text-muted font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: <span className="text-text-primary">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ─── Section wrapper ─── */
const Section = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="glass-card mb-6"
  >
    <div className="flex items-center gap-2 mb-6">
      <Icon size={20} className="text-accent-primary" />
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
    {children}
  </motion.div>
);

/* ─── Empty State ─── */
const EmptyChart = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-text-muted">
    <BarChart2 size={40} className="mb-3 opacity-30" />
    <p className="text-sm">{message}</p>
  </div>
);

/* ─── Main Page ─── */
const ProgressPage = () => {
  const [streak] = useState(() => getStreak());
  const [longest] = useState(() => getLongestStreak());
  const [heatmap] = useState(() => getHeatmapData(30));
  const [ratingTrend] = useState(() => getSelfRatingTrend());
  const [metricsTrend] = useState(() => getMetricsTrend());
  const [sessions] = useState(() => getSessions());

  const isMilestone = streak >= 3;
  const totalSessions = sessions.length;
  const hasRatingData = ratingTrend.length >= 1;
  const hasMetricsData = metricsTrend.length >= 1;

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl font-extrabold mb-2">Your Progress</h1>
        <p className="text-text-secondary">
          {totalSessions === 0
            ? 'Complete your first session to start tracking progress.'
            : `${totalSessions} session${totalSessions !== 1 ? 's' : ''} completed.`}
        </p>
      </motion.div>

      {/* ─── Streak Hero ─── */}
      <Section title="Streak" icon={Flame}>
        <div className="flex items-center justify-around flex-wrap gap-6">
          {/* Current streak */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={isMilestone ? { scale: [1, 1.06, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${
                isMilestone
                  ? 'bg-orange-500/10 border-orange-400/40 text-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.25)]'
                  : streak > 0
                  ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                  : 'bg-white/5 border-border text-text-muted'
              }`}
            >
              <Flame size={36} fill={streak > 0 ? 'currentColor' : 'none'} />
              <div className="flex flex-col">
                <span className="text-5xl font-extrabold leading-none">{streak}</span>
                <span className="text-sm font-semibold uppercase tracking-widest opacity-70">
                  Current Streak
                </span>
              </div>
            </motion.div>
            {streak === 0 && (
              <p className="text-xs text-text-muted mt-2">Practice today to start your streak!</p>
            )}
          </div>

          {/* Longest streak */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border bg-white/5 border-border">
              <Trophy size={32} className="text-warning" />
              <div className="flex flex-col">
                <span className="text-5xl font-extrabold leading-none text-warning">{longest}</span>
                <span className="text-sm font-semibold uppercase tracking-widest text-text-muted">
                  Longest Streak
                </span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── 30-Day Heatmap ─── */}
      <Section title="30-Day Activity" icon={Calendar}>
        <div className="grid grid-cols-[repeat(30,1fr)] gap-1.5">
          {heatmap.map((cell) => (
            <HeatmapCell key={cell.date} date={cell.date} count={cell.count} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end text-xs text-text-muted">
          <span>Less</span>
          {['bg-white/5', 'bg-accent-primary/30', 'bg-accent-primary/60', 'bg-accent-primary'].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </Section>

      {/* ─── Self-Rating Trend ─── */}
      <Section title="Self-Rating Trend" icon={TrendingUp}>
        {hasRatingData ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ratingTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Line type="monotone" dataKey="clarity" name="Clarity" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="confidence" name="Confidence" stroke="#d946ef" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="vocabulary" name="Vocabulary" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No rating data yet. Complete a session and rate your performance." />
        )}
      </Section>

      {/* ─── Speech Metrics Trend ─── */}
      <Section title="Speech Metrics Trend" icon={TrendingDown}>
        {hasMetricsData ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={metricsTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Line type="monotone" dataKey="avgWpm" name="Avg WPM" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="avgFillerCount" name="Avg Fillers" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No metrics data yet. Complete a session to see WPM and filler trends." />
        )}
      </Section>
    </div>
  );
};

export default ProgressPage;
