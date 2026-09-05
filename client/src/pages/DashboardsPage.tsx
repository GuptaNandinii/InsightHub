import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  Globe,
  Lock,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ShareModal } from '../components/dashboards/ShareModal';
import { Dashboard } from '../types';
import { dashboardApi } from '../api/endpoints';

export const DashboardsPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedShareDashboard, setSelectedShareDashboard] = useState<Dashboard | null>(null);
  const navigate = useNavigate();

  const fetchDashboards = async () => {
    try {
      setIsLoading(true);
      const res = await dashboardApi.getAll();
      setDashboards(res);
    } catch (err) {
      console.error('Failed to load dashboards', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      await dashboardApi.delete(id);
      setDashboards((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error('Failed to delete dashboard', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytics Dashboards
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build, customize, and share interactive dashboards powered by your CSV data.
          </p>
        </div>
      </div>

      {/* Grid of Dashboards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : dashboards.length === 0 ? (
        <EmptyState
          icon={<LayoutDashboard className="h-8 w-8" />}
          title="No dashboards yet"
          description="Create your first dashboard to visualize insights and explore trends across your datasets."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboards.map((dash) => (
            <Card
              key={dash._id}
              hoverEffect
              onClick={() => navigate(`/dashboards/${dash._id}`)}
              className="p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={dash.isPublic ? 'emerald' : 'slate'} size="sm">
                    <span className="flex items-center gap-1">
                      {dash.isPublic ? (
                        <>
                          <Globe className="h-3 w-3" />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Private
                        </>
                      )}
                    </span>
                  </Badge>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedShareDashboard(dash);
                      }}
                      title="Share settings"
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Globe className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(dash._id, e)}
                      title="Delete dashboard"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {dash.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                  {dash.description || 'No description provided.'}
                </p>

                {dash.tags && dash.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {dash.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-indigo-500" />
                  {dash.widgets?.length || 0} charts
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(dash.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {selectedShareDashboard && (
        <ShareModal
          isOpen={!!selectedShareDashboard}
          onClose={() => setSelectedShareDashboard(null)}
          dashboard={selectedShareDashboard}
          onUpdate={(updated) => {
            setDashboards((prev) =>
              prev.map((d) => (d._id === updated._id ? updated : d))
            );
            setSelectedShareDashboard(updated);
          }}
        />
      )}
    </div>
  );
};
