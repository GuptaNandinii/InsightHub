import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  LineChart,
  PlusCircle,
  Upload,
} from 'lucide-react';

interface SidebarProps {
  onOpenUploadModal?: () => void;
  onOpenNewDashboardModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenUploadModal,
  onOpenNewDashboardModal,
}) => {
  const navItems = [
    {
      to: '/dashboards',
      label: 'Dashboards',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      to: '/datasets',
      label: 'Datasets',
      icon: <Database className="h-4 w-4" />,
    },
    {
      to: '/analytics',
      label: 'Data Profiling',
      icon: <LineChart className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Quick action triggers */}
        <div className="space-y-2">
          {onOpenNewDashboardModal && (
            <button
              onClick={onOpenNewDashboardModal}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New Dashboard
            </button>
          )}

          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload CSV
            </button>
          )}
        </div>

        {/* Navigation links */}
        <div>
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Workspace
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer info badge */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>InsightHub v1.0</span>
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-950" />
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          MERN Production Stack with MongoDB & Recharts
        </p>
      </div>
    </aside>
  );
};
