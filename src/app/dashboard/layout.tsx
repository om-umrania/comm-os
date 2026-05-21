import Link from 'next/link';
import { LayoutDashboard, BrainCircuit, TrendingUp, ArrowLeft } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/sessions', label: 'Sessions', icon: BrainCircuit },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020817] text-white flex">

      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/8 bg-white/1.5 flex flex-col">
        <div className="px-5 py-6 border-b border-white/8">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-emerald-400">
              Comm-OS
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/15 border border-blue-500/20 px-1.5 py-0.5 rounded">
              Premium
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium">Executive Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/6 transition-all text-sm font-medium group"
            >
              <Icon className="w-4 h-4 shrink-0 group-hover:text-blue-400 transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/8">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Back to Coach
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
