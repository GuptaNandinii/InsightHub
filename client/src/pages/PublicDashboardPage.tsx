import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  Sun,
  Moon,
  Globe,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { WidgetCard } from '../components/dashboards/WidgetCard';
import { useTheme } from '../context/ThemeContext';
import { dashboardApi } from '../api/endpoints';

export const PublicDashboardPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { theme, toggleTheme } = useTheme();

  const [dashboard, setDashboard] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!shareToken) return;
      try {
        setIsLoading(true);
        setError(null);
        const res = await dashboardApi.getPublic(shareToken);
        setDashboard(res);
      } catch (err: any) {
        setError(
          err.response?.data?.message || 'This dashboard is private or does not exist.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
  }, [shareToken]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Public Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="tracking-tight">
              Insight<span className="text-indigo-600 dark:text-indigo-400">Hub</span>
            </span>
          </Link>
          <Badge variant="emerald" size="sm">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" /> Public View
            </span>
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          <Link to="/register">
            <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Build Free Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-6 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-80 col-span-2 rounded-2xl" />
              <Skeleton className="h-80 col-span-1 rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-24 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Unable to Load Dashboard
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                Return to Home
              </Button>
            </Link>
          </div>
        ) : dashboard ? (
          <>
            {/* Dashboard Title & Meta Banner */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {dashboard.title}
                </h1>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5" /> Updated{' '}
                  {new Date(dashboard.updatedAt).toLocaleDateString()}
                </span>
              </div>

              {dashboard.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
                  {dashboard.description}
                </p>
              )}

              {dashboard.tags && dashboard.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dashboard.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Read-Only Interactive Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dashboard.widgets.map((widget: any) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  isEditable={false}
                />
              ))}
            </div>
          </>
        ) : null}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-6 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Powered by InsightHub • Modern Collaborative Analytics</span>
          </div>
          <Link
            to="/register"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold"
          >
            Create Your Free Account →
          </Link>
        </div>
      </footer>
    </div>
  );
};
