import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { CheckCircle2, XCircle, Zap, Target, BarChart2, CalendarDays } from 'lucide-react';

async function getStats() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalLogs, recentLogs, weekLogs] = await prisma.$transaction([
    prisma.communicationLog.count(),
    prisma.communicationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.communicationLog.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
  ]);

  const sample = recentLogs.length;
  const blufAccuracy = sample === 0 ? 0 : Math.round((recentLogs.filter(l => l.blufScore).length / sample) * 100);
  const rule3Accuracy = sample === 0 ? 0 : Math.round((recentLogs.filter(l => l.ruleOf3Score).length / sample) * 100);

  return { totalLogs, blufAccuracy, rule3Accuracy, weekLogs, recentLogs };
}

export default async function DashboardPage() {
  const { totalLogs, blufAccuracy, rule3Accuracy, weekLogs, recentLogs } = await getStats();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Executive communication performance metrics.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={String(totalLogs)}
          icon={<Zap className="w-4 h-4" />}
          accent="blue"
        />
        <StatCard
          label="BLUF Accuracy"
          value={`${blufAccuracy}%`}
          icon={<Target className="w-4 h-4" />}
          accent={blufAccuracy >= 70 ? 'emerald' : 'amber'}
          sub="last 10 sessions"
        />
        <StatCard
          label="Rule of 3"
          value={`${rule3Accuracy}%`}
          icon={<BarChart2 className="w-4 h-4" />}
          accent={rule3Accuracy >= 70 ? 'emerald' : 'amber'}
          sub="last 10 sessions"
        />
        <StatCard
          label="This Week"
          value={String(weekLogs)}
          icon={<CalendarDays className="w-4 h-4" />}
          accent="purple"
          sub="sessions"
        />
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4 tracking-tight">Recent Sessions</h2>
        {recentLogs.length === 0 ? (
          <div className="text-center py-16 bg-white/1.5 rounded-2xl border border-white/8 border-dashed">
            <p className="text-slate-500 font-medium text-sm">No sessions recorded yet.</p>
            <p className="text-slate-600 text-xs mt-1.5">
              Complete a coaching session and save it to start tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5 bg-white/2.5 border border-white/8 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{log.scenario}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {new Date(log.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {' · '}Pressure {log.pressureLevel}/5
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <ScorePill label="BLUF" pass={log.blufScore} />
                  <ScorePill label="Rule 3" pass={log.ruleOf3Score} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schema upgrade note for dormant Session/Turn models */}
      <div className="bg-blue-500/6 border border-blue-500/15 rounded-2xl p-5">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Premium Analytics — Coming Next</p>
        <p className="text-slate-400 text-sm leading-relaxed">
          The <code className="text-blue-300 bg-blue-500/10 px-1 py-0.5 rounded text-xs">Session</code> and{' '}
          <code className="text-blue-300 bg-blue-500/10 px-1 py-0.5 rounded text-xs">Turn</code> models are live in the database
          with full analytics fields (<code className="text-blue-300/80 text-xs">blufAccuracy</code>,{' '}
          <code className="text-blue-300/80 text-xs">rule3Accuracy</code>, <code className="text-blue-300/80 text-xs">weekNumber</code>,{' '}
          <code className="text-blue-300/80 text-xs">wordCount</code>). Wire the Live Coach to{' '}
          <code className="text-blue-300/80 text-xs">POST /api/sessions</code> after each session to unlock
          week-over-week accuracy trends, hesitation analysis, and pressure-level correlation charts.
        </p>
      </div>
    </div>
  );
}

type Accent = 'blue' | 'emerald' | 'purple' | 'amber';

const accentClasses: Record<Accent, string> = {
  blue:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  purple:  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  amber:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

function StatCard({
  label, value, icon, accent, sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: Accent;
  sub?: string;
}) {
  return (
    <div className="bg-white/2.5 border border-white/8 rounded-2xl p-5 space-y-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${accentClasses[accent]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {label}{sub && <span className="text-slate-600"> · {sub}</span>}
        </p>
      </div>
    </div>
  );
}

function ScorePill({ label, pass }: { label: string; pass: boolean }) {
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
      pass ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
    }`}>
      {pass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}
